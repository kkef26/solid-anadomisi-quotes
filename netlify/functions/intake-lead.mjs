// intake-lead.mjs
// Receives Fluent Forms webhook from anadomisi.tech
// Normalises Greek phone numbers, fuzzy-matches against clients table,
// inserts into leads with client_id + is_returning flag if match found.

const SB_URL  = 'https://ynxcbvfhrwuenjnvsceq.supabase.co';
const SB_KEY  = process.env.SUPABASE_SERVICE_KEY
             || process.env.SUPABASE_ANON_KEY
             || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlueGNidmZocnd1ZW5qbnZzY2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MzEyNDMsImV4cCI6MjA4OTAwNzI0M30.wWWbwIEZZ9V9oRLyr_tKmh5QgPySTcKbh5s1k8hp_-w';

const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ── Greek phone normaliser ────────────────────────────────────────────────
// Accepts: 6971234567 / 06971234567 / +306971234567 / 2101234567 etc.
function normalisePhone(raw = '') {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('30') && digits.length > 10) return '+' + digits;
  if (digits.startsWith('0') && digits.length === 11) return '+30' + digits.slice(1);
  if (digits.length === 10) return '+30' + digits;
  return digits; // fallback
}

// ── Supabase REST helper ──────────────────────────────────────────────────
async function sb(path, opts = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey'       : SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type' : 'application/json',
      'Prefer'       : opts.prefer || 'return=representation',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

// ── Client match ──────────────────────────────────────────────────────────
// Phones are stored as 10-digit Greek format (e.g. 6973335660).
// Build OR filter covering all normalisation variants.
async function findClient(phone, email) {
  const filters = [];

  if (phone) {
    const digits = phone.replace(/\D/g, '');
    const d10    = digits.slice(-10);          // last 10: 6973335660
    const d12    = '30' + d10;                 // 306973335660
    const plus12 = '%2B30' + d10;             // +306973335660 (URL-encoded)
    // Cover all formats seen in the wild
    [d10, d12, '+30' + d10, '0' + d10].forEach(v => {
      filters.push(`phone.eq.${encodeURIComponent(v)}`);
    });
  }
  if (email) filters.push(`email.eq.${encodeURIComponent(email.toLowerCase())}`);
  if (!filters.length) return null;

  const { ok, data } = await sb(
    `clients?select=id,full_name,phone,email&or=(${filters.join(',')})&deleted_at=is.null&limit=1`,
    { method: 'GET', prefer: '' }
  );
  if (!ok || !Array.isArray(data) || !data.length) return null;
  return data[0];
}

// ── Main handler ──────────────────────────────────────────────────────────
export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: CORS });
  if (req.method !== 'POST')    return new Response('Method not allowed', { status: 405, headers: CORS });

  let body;
  try {
    const text = await req.text();
    // Fluent Forms can send application/x-www-form-urlencoded or JSON
    if (req.headers.get('content-type')?.includes('application/json')) {
      body = JSON.parse(text);
    } else {
      body = Object.fromEntries(new URLSearchParams(text));
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad request body' }), { status: 400, headers: CORS });
  }

  // ── Map Fluent Forms fields ──────────────────────────────────────────────
  // Field names match sprint2-fluent-forms-setup.md spec
  const fullName   = (body.full_name   || body.name        || '').trim();
  const rawPhone   = (body.phone       || body.telephone   || '').trim();
  const email      = (body.email       || '').trim().toLowerCase();
  const area       = (body.area        || body.neighborhood|| '').trim();
  const address    = (body.address     || '').trim();
  const jobType    = (body.job_type    || body.service_type|| '').trim();
  const description= (body.description || body.message     || '').trim();
  const budget     = (body.budget      || '').trim();
  const timeline   = (body.timeline    || '').trim();
  const source     = (body.source      || body.how_found   || 'anadomisi.tech').trim();
  const vatNumber  = (body.vat_number  || body.afm         || '').trim();

  if (!fullName && !rawPhone && !email) {
    return new Response(JSON.stringify({ error: 'No contact info provided' }), { status: 422, headers: CORS });
  }

  const phone = rawPhone ? normalisePhone(rawPhone) : null;

  // ── Returning customer check ─────────────────────────────────────────────
  const matchedClient = await findClient(phone, email);
  const isReturning   = !!matchedClient;
  const clientId      = matchedClient?.id || null;

  // ── Build lead record ────────────────────────────────────────────────────
  const lead = {
    full_name    : fullName   || matchedClient?.full_name || null,
    phone        : phone      || matchedClient?.phone     || null,
    email        : email      || matchedClient?.email     || null,
    area,
    work_type    : jobType,
    description,
    budget_range : budget     || null,
    start_timeline: timeline  || null,
    source,
    status       : 'new',
    is_returning : isReturning,
    client_id    : clientId,
  };

  const { ok, status, data } = await sb('leads', {
    method: 'POST',
    body  : JSON.stringify(lead),
    prefer: 'return=representation',
  });

  if (!ok) {
    console.error('Supabase insert error', status, data);
    return new Response(JSON.stringify({ error: 'DB insert failed', detail: data }), { status: 500, headers: CORS });
  }

  const inserted = Array.isArray(data) ? data[0] : data;

  return new Response(
    JSON.stringify({
      success     : true,
      lead_id     : inserted?.id,
      is_returning: isReturning,
      client_name : matchedClient?.full_name || null,
    }),
    { status: 201, headers: { ...CORS, 'Content-Type': 'application/json' } }
  );
}
