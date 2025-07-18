export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { tweet } = req.body;
  if (!tweet) {
    return res.status(400).json({ error: 'Missing tweet content' });
  }

  try {
    const response = await fetch('https://api.akbxr.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer UNLIMITED-BETA',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'auto',
        messages: [
          {
            role: 'user',
            content: `Saya merupakan user twitter yang akan membalas tweet ini, tolong balaskan saya sebagai pemula untuk membalas tweet ini, lansung on point balasannnya dalam bahasa inggris, jangan balas selain itu : ${tweet}`
          }
        ],
        stream: false
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
