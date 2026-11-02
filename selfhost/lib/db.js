'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DB_URL,
  max: Number(process.env.DB_POOL_MAX || 5),
});

// PostgREST byter roll per request. Vi gör samma sak: en transaktion där
// rollen och JWT-claims sätts lokalt, så att RLS-reglerna gäller exakt som
// de gör när appen pratar med /rest/v1. Rollen återställs automatiskt vid
// commit/rollback.
async function withRole(role, claims, fn) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query("select set_config('role', $1, true)", [role]);
    if (claims) {
      await client.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify(claims),
      ]);
    }
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    try {
      await client.query('rollback');
    } catch {
      // ignorera: anslutningen är ändå på väg tillbaka till poolen
    }
    throw err;
  } finally {
    client.release();
  }
}

// service_role har bypassrls — samma roll som edge-funktionerna körde med.
const asService = (fn) => withRole('service_role', null, fn);

// authenticated + användarens claims — RLS gäller.
const asUser = (claims, fn) => withRole('authenticated', claims, fn);

module.exports = { pool, withRole, asService, asUser };
