// Solid Anadomisi — PDF generation proxy
// Proxies to Lambda to avoid browser CORS preflight issues (OPTIONS returns 404 on API GW)

const LAMBDA_URL = 'https://6m579m9vg1.execute-api.eu-west-1.amazonaws.com/pdf';

export const handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Sanitize quote_number: Lambda uses it as a filename in content-disposition header,
    // which does not allow non-ASCII characters (RFC 7230). Replace Greek prefix Π→P etc.
    let body = event.body;
    try {
      const parsed = JSON.parse(body);
      if (parsed?.quote?.quote_number) {
        parsed.quote.quote_number = parsed.quote.quote_number
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')  // strip combining diacritics
          .replace(/[^\x20-\x7E]/g, c => {   // replace remaining non-ASCII
            const map = { 'Π': 'P', 'π': 'p', 'Α': 'A', 'Β': 'B', 'Ε': 'E' };
            return map[c] || 'X';
          });
        body = JSON.stringify(parsed);
      }
    } catch { /* leave body as-is if parse fails */ }

    const res = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    const data = await res.json();

    return {
      statusCode: res.status,
      headers: CORS,
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: err.message || 'Proxy error' })
    };
  }
};
