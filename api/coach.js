const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const API_KEY = process.env.GEMINI_API_KEY;
const ALLOWED_ORIGINS = new Set([
  'https://caubalucbinh121087-png.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:5500'
]);

function setCors(req, res) {
  const origin = req.headers.origin || '';
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  return !origin || ALLOWED_ORIGINS.has(origin);
}

module.exports = async (req, res) => {
  const originAllowed = setCors(req, res);
  if (req.method === 'OPTIONS') {
    if (!originAllowed) return res.status(403).json({ error: 'Origin not allowed' });
    return res.status(204).end();
  }
  if (!originAllowed) return res.status(403).json({ error: 'Origin not allowed' });
  if (req.method === 'GET') {
    return res.status(200).json({ service: 'English Master AI Coach', status: 'ok' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel Environment Variables' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const text = String(body.text || '').trim().slice(0, 8000);
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const prompt = `You are English Master, a supportive English learning coach for a Vietnamese learner. Respond in Vietnamese, while keeping corrected English examples in English. Analyze the user's English text. Provide: (1) a natural corrected version, (2) up to 5 important errors with short explanations, (3) a more natural alternative when useful, and (4) one short practice exercise. Be encouraging, concise, and do not invent errors. User content:\n${text}`;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(API_KEY)}`;
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1200 }
      }),
      signal: AbortSignal.timeout(55000)
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = data.error?.message || `Gemini request failed (${upstream.status})`;
      return res.status(502).json({ error: message });
    }
    const reply = (data.candidates || [])
      .flatMap(candidate => candidate.content?.parts || [])
      .map(part => part.text || '').join('\n').trim();
    if (!reply) return res.status(502).json({ error: 'Gemini returned an empty response' });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('AI Coach request failed:', error);
    return res.status(500).json({ error: error.name === 'TimeoutError' ? 'Gemini request timed out' : 'Unable to process AI Coach request' });
  }
};
