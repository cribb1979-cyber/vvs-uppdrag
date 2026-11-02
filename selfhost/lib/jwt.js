'use strict';

const crypto = require('node:crypto');

// GoTrue och PostgREST delar en hemlighet och signerar med HS256. Vi gör
// samma kontroll som de gör, utan något bibliotek.
function verifyJwt(token, secret) {
  if (typeof token !== 'string') throw new Error('token saknas');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('ogiltig token');

  const [headerPart, payloadPart, signaturePart] = parts;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest();
  const actual = Buffer.from(signaturePart, 'base64url');

  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    throw new Error('fel signatur');
  }

  let header;
  try {
    header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8'));
  } catch {
    throw new Error('ogiltig header');
  }
  if (header.alg !== 'HS256') throw new Error('fel algoritm');

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
  } catch {
    throw new Error('ogiltig payload');
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp < now) {
    throw new Error('token har gått ut');
  }

  return payload;
}

function bearer(req) {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1] : null;
}

module.exports = { verifyJwt, bearer };
