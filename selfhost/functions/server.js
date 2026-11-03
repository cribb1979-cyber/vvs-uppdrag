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
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
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

// ---------------------------------------------------------------------------
// generate-assignment: lokalt AI-utkast till ett färdigt uppdrag.
//
// Standard är gemma2:9b på Y900 (noll marginalkostnad). Snabbläget använder
// stoffe-stabil. RSK-nummer får ALDRIG hittas på av modellen – de måste finnas
// i Förrådets material_catalog, annars lämnas de tomma och flaggas.
// ---------------------------------------------------------------------------

const OLLAMA_URL = (process.env.OLLAMA_URL || '').replace(/\/+$/, '');
const OLLAMA_MODEL_QUALITY = process.env.OLLAMA_MODEL_QUALITY || 'gemma2:9b';
const OLLAMA_MODEL_QUICK = process.env.OLLAMA_MODEL_QUICK || 'stoffe-stabil';
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 120000);

const GENERATE_SYSTEM_PROMPT =
  'Du är en erfaren svensk VVS-lärare på gymnasiet. Skriv ett färdigt praktiskt uppdrag på svenska. ' +
  'Svara ENDAST med ett JSON-objekt enligt schemat, ingen text utanför. ' +
  'Hitta aldrig på RSK-nummer: använd bara RSK som finns i Förrådets materiallista, annars tom sträng. ' +
  'Välj rule_refs endast från listan med Säkervatten-koder.';

function normalisera(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function klipp(text, max) {
  const s = String(text || '').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function parseJsonLoose(text) {
  const raw = String(text || '');
  try {
    return JSON.parse(raw);
  } catch {
    // modellen kan lägga en kort inledning runt JSON-objektet
  }
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      // ignorera
    }
  }
  return null;
}

function byggExempel(rows) {
  return (rows || []).map((row) => {
    const payload = row.payload || {};
    const a = payload.assignment || {};
    return {
      title: row.titel || a.title || '',
      description: klipp(a.description, 220),
      goal: klipp(a.goal, 160),
      self_check_items: Array.isArray(a.self_check_items) ? a.self_check_items.slice(0, 5) : [],
      material: (Array.isArray(payload.material_requirements) ? payload.material_requirements : [])
        .slice(0, 8)
        .map((m) => ({ component: m.component, dimension: m.dimension, quantity: m.quantity })),
    };
  });
}

function byggPrompt({ prompt, level, rules, selectedRules, catalog, examples }) {
  const regelText = (rules || [])
    .map(
      (r) =>
        `- ${r.kod}: ${klipp(r.rubrik, 80)}. ${klipp(r.sammanfattning, 180)} Kontroll: ${(r.kontrollpunkter || [])
          .slice(0, 4)
          .join('; ')}`,
    )
    .join('\n');

  const valdaText =
    selectedRules && selectedRules.length
      ? `Prioritera dessa regelkoder om de passar: ${selectedRules.join(', ')}`
      : '';

  const nyckelord = normalisera(`${prompt} ${level || ''} ${(selectedRules || []).join(' ')}`)
    .split(' ')
    .filter((w) => w.length > 2);
  const relevant = (catalog || []).filter((c) => {
    const text = normalisera(`${c.name} ${c.dimension} ${c.category}`);
    return nyckelord.some((w) => text.includes(w));
  });
  const catalogForPrompt = (relevant.length >= 8 ? relevant : catalog || []).slice(0, 60);
  const materialText = catalogForPrompt
    .map(
      (c) =>
        `- ${c.name}${c.dimension ? ` | ${c.dimension}` : ''}${c.rsk_number ? ` | RSK ${c.rsk_number}` : ''}`,
    )
    .join('\n');

  const exempelText = (examples || []).map((e) => JSON.stringify(e)).join('\n');

  const schema = {
    title: 'kort svensk titel',
    description: '2-4 meningar om vad eleven ska göra',
    goal: 'ett tydligt och mätbart mål',
    self_check_items: ['5-7 konkreta punkter'],
    reflection_questions: ['3-5 reflektionsfrågor'],
    material: [{ component: 'Komponent', dimension: 't.ex. 15 mm', quantity: 1, rsk: '' }],
    rule_refs: ['en eller flera regelkoder från listan'],
  };

  return [
    `Skapa ett färdigt praktiskt VVS-uppdrag om: ${prompt}`,
    `Nivå: ${level || 'GY'}`,
    valdaText,
    'Säkervatten-regler att välja bland:',
    regelText || '(inga regler skickades)',
    'Exempel på godkända uppdrag:',
    exempelText || '(inga exempel)',
    'Förrådets material. Använd bara RSK som står här, annars tom sträng:',
    materialText || '(Förrådet är tomt – lämna alla rsk tomma)',
    'JSON-schema:',
    JSON.stringify(schema),
    'Svara bara med JSON-objektet.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function valideraUtkast(parsed, { prompt, catalog, allowedRules }) {
  const byRsk = new Map();
  const byName = new Map();
  for (const c of catalog || []) {
    const rsk = String(c.rsk_number || '').replace(/\D/g, '');
    if (rsk) byRsk.set(rsk, c);
    const namn = normalisera(c.name);
    if (namn) byName.set(namn, c);
  }

  const material = (Array.isArray(parsed.material) ? parsed.material : [])
    .slice(0, 15)
    .map((m) => {
      const component = klipp(m?.component, 80);
      const dimension = klipp(m?.dimension, 40);
      const quantity = Math.max(1, Number.parseInt(m?.quantity, 10) || 1);
      let rsk = String(m?.rsk || '').replace(/\D/g, '').slice(0, 12);
      let rskStatus = 'missing';

      if (rsk && byRsk.has(rsk)) {
        rskStatus = 'match';
      } else {
        const traff = byName.get(normalisera(component));
        const traffRsk = traff ? String(traff.rsk_number || '').replace(/\D/g, '') : '';
        if (traffRsk) {
          rsk = traffRsk;
          rskStatus = 'match';
        } else {
          rsk = '';
        }
      }

      return { component, dimension, quantity, rsk, rsk_status: rskStatus };
    })
    .filter((m) => m.component);

  const allowed = new Set(allowedRules || []);
  const ruleRefs = (Array.isArray(parsed.rule_refs) ? parsed.rule_refs : [])
    .filter((k) => typeof k === 'string' && allowed.has(k))
    .slice(0, 12);

  const selfCheck = (Array.isArray(parsed.self_check_items) ? parsed.self_check_items : [])
    .map((s) => klipp(s, 160))
    .filter(Boolean)
    .slice(0, 8);
  const reflections = (Array.isArray(parsed.reflection_questions) ? parsed.reflection_questions : [])
    .map((s) => klipp(s, 200))
    .filter(Boolean)
    .slice(0, 6);

  return {
    draft: {
      title: klipp(parsed.title, 120) || klipp(prompt, 80),
      description: klipp(parsed.description, 1200),
      goal: klipp(parsed.goal, 400),
      self_check_items: selfCheck,
      reflection_questions: reflections,
      material,
      rule_refs: ruleRefs,
    },
    rsk_missing: material.filter((m) => m.rsk_status === 'missing').length,
    rsk_matched: material.filter((m) => m.rsk_status === 'match').length,
  };
}

async function generateAssignment(req, res) {
  const claims = await requireApprovedTeacher(req);
  if (!claims) return json(res, 403, { error: 'Endast godkända lärare kan använda AI-läget.' });
  if (!OLLAMA_URL) return json(res, 503, { error: 'Lokal AI är inte konfigurerad.' });

  let body;
  try {
    body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
  } catch {
    return json(res, 400, { error: 'Ogiltig JSON.' });
  }

  const prompt = String(body?.prompt || '').trim();
  if (!prompt) return json(res, 400, { error: 'Beskriv uppdraget först.' });

  const mode = body?.mode === 'quick' ? 'quick' : 'quality';
  const model = mode === 'quick' ? OLLAMA_MODEL_QUICK : OLLAMA_MODEL_QUALITY;
  const rules = Array.isArray(body?.rules) ? body.rules : [];
  const selectedRules = Array.isArray(body?.selected_rules) ? body.selected_rules : [];
  const allowedRules = rules.map((r) => r?.kod).filter((k) => typeof k === 'string');

  let catalog = [];
  let examples = [];
  try {
    const data = await asService(async (client) => {
      const profil = await client.query('select org_id from profiles where id = $1', [claims.sub]);
      const orgId = profil.rows[0]?.org_id;
      if (!orgId) return { catalog: [], examples: [] };
      const cat = await client.query(
        'select name, rsk_number, dimension, category from material_catalog where org_id = $1 order by name limit 500',
        [orgId],
      );
      let ex = { rows: [] };
      try {
        ex = await client.query(
          "select titel, payload from uppdragsbank_mallar where status = 'godkand' order by created_at desc limit 2",
        );
      } catch {
        // bankmigrationen kan saknas på en mycket tidig installation
      }
      return { catalog: cat.rows, examples: byggExempel(ex.rows) };
    });
    catalog = data.catalog;
    examples = data.examples;
  } catch (err) {
    console.error('[functions] kunde inte läsa AI-underlag', err);
    return json(res, 502, { error: 'Kunde inte läsa Förrådet och banken.' });
  }

  const userPrompt = byggPrompt({
    prompt,
    level: body?.level,
    rules,
    selectedRules,
    catalog,
    examples,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  let ollamaRes;
  try {
    ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        options: { temperature: 0.2, num_predict: 800 },
        messages: [
          { role: 'system', content: GENERATE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    console.error('[functions] Ollama-fel', err?.name, err?.message);
    return json(res, 502, { error: 'Lokal AI svarade inte. Kontrollera att Ollama kör på Y900.' });
  } finally {
    clearTimeout(timer);
  }

  if (!ollamaRes.ok) {
    const errText = await ollamaRes.text();
    console.error('[functions] Ollama HTTP-fel', ollamaRes.status, errText.slice(0, 400));
    return json(res, 502, { error: 'Lokal AI svarade med fel.' });
  }

  const data = await ollamaRes.json();
  const parsed = parseJsonLoose(data?.message?.content ?? '');
  if (!parsed) return json(res, 502, { error: 'Kunde inte tolka AI-svaret.' });

  return json(res, 200, {
    ...valideraUtkast(parsed, { prompt, catalog, allowedRules }),
    model,
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
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

    if (req.method === 'POST' && path === '/generate-assignment') {
      return generateAssignment(req, res);
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
