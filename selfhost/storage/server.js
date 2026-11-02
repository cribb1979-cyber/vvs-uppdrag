'use strict';

// Egen Storage-tjänst för VVS Uppdrag. supabase-js pratar samma API:
//   POST /storage/v1/object/<bucket>/<org_id>/<fil>    (uppladdning)
//   GET  /storage/v1/object/public/<bucket>/<fil>      (publik URL)
//
// Bucketarna är quiz-images och installationer. Uppladdning kräver en
// godkänd lärare, och första mappen måste vara lärarens org_id – samma
// regel som RLS-policyerna i supabase/migrations/0002_quiz.sql och
// 0011_infobank.sql. Själva kontrollen görs här, eftersom den här
// tjänsten äger storage.objects i stället för Supabase Storage.

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { verifyJwt, bearer } = require('../lib/jwt');
const { asService } = require('../lib/db');

const PORT = Number(process.env.PORT || 5001);
const FILE_DIR = process.env.FILE_DIR || '/data';
const MAX_UPLOAD = Number(process.env.MAX_UPLOAD_BYTES || 20 * 1000 * 1000);

const BUCKETS = new Set(['quiz-images', 'installationer']);
const PUBLIC_PREFIX = '/storage/v1/object/public/';
const PRIVATE_PREFIX = '/storage/v1/object/';

const TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.m4a': 'audio/mp4',
  '.mp4': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.caf': 'audio/x-caf',
};

function contentType(file) {
  return TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, content-type, x-upsert, cache-control',
    'access-control-allow-methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
    ...headers,
  });
  res.end(body);
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  send(res, status, payload, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(payload),
  });
}

// Delar upp /storage/v1/object/[public/]<bucket>/<sökväg>.
function parseObjectPath(pathname) {
  const isPublic = pathname.startsWith(PUBLIC_PREFIX);
  const prefix = isPublic ? PUBLIC_PREFIX : PRIVATE_PREFIX;
  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);
  const [bucket, ...parts] = rest.split('/');
  if (!BUCKETS.has(bucket) || parts.length === 0) return null;

  return { public: isPublic, bucket, rel: parts.join('/') };
}

// Slår ihop den relativa sökvägen med bucketens mapp och vägrar allt som
// försöker klättra ut ur den (.., tomma segment, absoluta sökvägar).
function resolveFile(rel, bucket = 'quiz-images') {
  if (!BUCKETS.has(bucket)) return null;

  let decoded;
  try {
    decoded = rel.split('/').map(decodeURIComponent).join('/');
  } catch {
    return null;
  }

  const parts = decoded.split('/').filter(Boolean);
  if (!parts.length || parts.some((p) => p === '.' || p === '..')) return null;
  if (parts.join('/') !== decoded) return null; // dubbla snedstreck

  const root = path.join(FILE_DIR, bucket);
  const full = path.join(root, ...parts);
  if (full !== root && !full.startsWith(root + path.sep)) return null;

  return { full, name: parts.join('/') };
}

async function orgIdFor(claims) {
  return asService(async (client) => {
    const { rows } = await client.query(
      "select org_id from profiles where id = $1 and status = 'approved'",
      [claims.sub]
    );
    return rows[0]?.org_id || null;
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_UPLOAD) {
        reject(Object.assign(new Error('too_large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function authenticate(req) {
  const token = bearer(req);
  if (!token) return null;
  try {
    const claims = verifyJwt(token, process.env.JWT_SECRET);
    if (!claims?.sub) return null;
    return claims;
  } catch {
    return null;
  }
}

async function servePublic(req, res, bucket, rel) {
  const file = resolveFile(rel, bucket);
  if (!file) return json(res, 400, { error: 'bad_path' });

  let stat;
  try {
    stat = await fsp.stat(file.full);
  } catch {
    return json(res, 404, { error: 'not_found' });
  }
  if (!stat.isFile()) return json(res, 404, { error: 'not_found' });

  res.writeHead(200, {
    'content-type': contentType(file.full),
    'content-length': stat.size,
    'cache-control': 'public, max-age=31536000, immutable',
    'access-control-allow-origin': '*',
  });

  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file.full).pipe(res);
}

async function upload(req, res, bucket, rel) {
  const claims = await authenticate(req);
  if (!claims) return json(res, 401, { error: 'unauthorized' });

  const file = resolveFile(rel, bucket);
  if (!file) return json(res, 400, { error: 'bad_path' });

  const orgId = await orgIdFor(claims);
  if (!orgId) return json(res, 403, { error: 'no_org' });

  // Samma regel som RLS-policyerna: första mappen måste vara den egna orgens id.
  if (file.name.split('/')[0] !== orgId) {
    return json(res, 403, { error: 'wrong_folder' });
  }

  const exists = await fsp
    .stat(file.full)
    .then((s) => s.isFile())
    .catch(() => false);
  const upsert = String(req.headers['x-upsert'] || '').toLowerCase() === 'true';
  if (exists && !upsert) return json(res, 409, { error: 'already_exists' });

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    return json(res, err.status || 400, { error: err.message });
  }

  await fsp.mkdir(path.dirname(file.full), { recursive: true });
  const tmp = `${file.full}.${crypto.randomUUID()}.tmp`;
  await fsp.writeFile(tmp, body);
  await fsp.rename(tmp, file.full); // atomiskt: ingen halv fil om servern dör

  await asService(async (client) => {
    await client.query(
      'insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3)',
      [bucket, file.name, claims.sub]
    );
  });

  return json(res, 200, { Key: `${bucket}/${file.name}` });
}

async function remove(req, res, bucket, rel) {
  const claims = await authenticate(req);
  if (!claims) return json(res, 401, { error: 'unauthorized' });

  const file = resolveFile(rel, bucket);
  if (!file) return json(res, 400, { error: 'bad_path' });

  const orgId = await orgIdFor(claims);
  if (!orgId || file.name.split('/')[0] !== orgId) {
    return json(res, 403, { error: 'forbidden' });
  }

  try {
    await fsp.unlink(file.full);
  } catch {
    return json(res, 404, { error: 'not_found' });
  }

  await asService((client) =>
    client.query('delete from storage.objects where bucket_id = $1 and name = $2', [
      bucket,
      file.name,
    ])
  );

  return json(res, 200, {});
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return send(res, 204, '');

    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;

    if (req.method === 'GET' && pathname === '/healthz') {
      return json(res, 200, { ok: true });
    }

    const obj = parseObjectPath(pathname);
    if (!obj) return json(res, 404, { error: 'not_found' });

    if (obj.public) {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return json(res, 405, { error: 'method_not_allowed' });
      }
      return servePublic(req, res, obj.bucket, obj.rel);
    }

    if (req.method === 'POST' || req.method === 'PUT') return upload(req, res, obj.bucket, obj.rel);
    if (req.method === 'DELETE') return remove(req, res, obj.bucket, obj.rel);
    return json(res, 405, { error: 'method_not_allowed' });
  } catch (err) {
    console.error('[storage] oväntat fel:', err);
    if (!res.headersSent) return json(res, 500, { error: 'internal_error' });
    res.end();
  }
});

// Startas bara när filen körs direkt (inte när den importeras av ett test).
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[storage] lyssnar på :${PORT}, filer i ${FILE_DIR}/{quiz-images,installationer}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { server, resolveFile, contentType, parseObjectPath, PUBLIC_PREFIX, PRIVATE_PREFIX };
