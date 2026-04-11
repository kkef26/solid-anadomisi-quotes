import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { text } = await req.json()
  if (!text || typeof text !== 'string' || !text.trim()) {
    return new Response(JSON.stringify({ error: 'No text provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const prompt = `You are an expert assistant for a Greek construction company. Parse the following raw walkthrough notes (written in Greek, possibly informal or voice-transcribed) and structure them into discrete work items.

Return ONLY a JSON array. Each object must have:
- "category": work category in Greek (e.g. "Βαφές", "Πλακάκια", "Ηλεκτρολογικά", "Υδραυλικά", "Χτίσιμο", "Μόνωση", "Γυψοσανίδα", "Κουφώματα", "Πόρτες", "Δάπεδο", "Σοβάς", "Κεραμίδια", "Αποξήλωση")
- "description": specific work description in Greek, clear and professional
- "notes": any conditions, quantities, or special notes in Greek (null if none)
- "photos": []

Raw walkthrough notes:
${text}

Respond ONLY with a valid JSON array. No markdown fences, no explanation, no extra text.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('Anthropic error:', errText)
    return new Response(JSON.stringify({ error: 'AI service error', detail: errText }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const aiData = await response.json()
  const rawContent = aiData.content?.[0]?.text || '[]'

  let items
  try {
    // Strip any accidental markdown fences
    const cleaned = rawContent.replace(/```json?
?/g, '''').replace(/```/g, '''').trim()
    items = JSON.parse(cleaned)
    if (!Array.isArray(items)) items = []
  } catch {
    console.error('Parse error, raw:', rawContent)
    items = []
  }

  return new Response(JSON.stringify({ items }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
