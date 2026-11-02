'use strict';

// Egna funktioner för VVS Uppdrag. supabase-js anropar
// /functions/v1/identify-material och får samma svar som den gamla
// Supabase Edge Function gav.
//
// Nyckeln till Anthropic ligger bara i serverns .env – aldrig i appen.

const http = require('node:http');
const { verifyJwt, bearer } = require('../lib/jwt');
const { pool, asService } = require('../lib/db');

const PORT = Number(process.env.PORT || 9000);
const MAX_BODY = Number(process.env.MAX_BODY_BYTES || 25 * 1024 * 1024);
const ANTHROPIC_KEY = (process.env.ANTHROPIC_API_KEY || '').trim();
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT =
  'Du är expert på VVS-material (rör, kopplingar, ventiler, fittings) för svensk yrkesutbildning åk 1-3. ' +
  'Titta på bilden och identifiera vilken rördel eller komponent det är. ' +
  'Svara ENDAST med kompakt JSON, ingen text utanför JSON-objektet, exakt detta format: ' +
  '{"name":"kort svenskt namn, t.ex. \'Vinkelkoppling 90°\'","wrong_answers":["tre rimliga men felaktiga namn på liknande delar"]}. ' +
  'Om du är osäker, gör ditt bästa fackmässiga gissning ändå -- lämna aldrig name tomt.';

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(payload),
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, apikey, content-type',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
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

async function requireApprovedTeacher(req) {
  const token = bearer(req);
  if (!token) return null;
  let claims;
  try {
    claims = verifyJwt(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
  if (!claims?.sub || claims.role !== 'authenticated') return null;

  return asService(async (client) => {
    const { rows } = await client.query(
      "select id from profiles where id = $1 and status = 'approved'",
      [claims.sub]
    );
    return rows.length ? claims : null;
  });
}

async function identifyMaterial(req, res) {
  const claims = await requireApprovedTeacher(req);
  if (!claims) return json(res, 403, { error: 'Endast godkända lärare kan använda AI-förslag.' });
  if (!ANTHROPIC_KEY) return json(res, 503, { error: 'AI-hjälpen är inte aktiverad.' });

  let body;
  try {
    body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
  } catch {
    return json(res, 400, { error: 'Ogiltig JSON.' });
  }

  const imageBase64 = body?.imageBase64;
  const mimeType = body?.mimeType || 'image/jpeg';
  if (!imageBase64) return json(res, 400, { error: 'Ingen bild skickades.' });

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            { type: 'text', text: 'Vilken rördel är detta?' },
          ],
        },
      ],
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    console.error('[functions] Anthropic-fel', anthropicRes.status, errText.slice(0, 400));
    return json(res, 502, { error: 'AI-tjänsten svarade inte.' });
  }

  const data = await anthropicRes.json();
  const text = data?.content?.[0]?.text ?? '';
  let parsed = {};
  try {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : text);
  } catch {
    return json(res, 502, { error: 'Kunde inte tolka AI-svaret.' });
  }
  if (!parsed.name) return json(res, 502, { error: 'AI:n kunde inte identifiera delen.' });

  return json(res, 200, {
    name: parsed.name,
    wrong_answers: Array.isArray(parsed.wrong_answers) ? parsed.wrong_answers.slice(0, 3) : [],
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'authorization, apikey, content-type',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
      });
      return res.end();
    }

    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (req.method === 'GET' && path === '/healthz') {
      await pool.query('select 1');
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && path === '/identify-material') {
      return identifyMaterial(req, res);
    }

    return json(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error('[functions] oväntat fel:', err);
    if (!res.headersSent) return json(res, 500, { error: 'internal_error' });
    res.end();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[functions] lyssnar på :${PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
