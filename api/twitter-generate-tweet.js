export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
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
              content: `Buatkan saya 10 tweet dalam bahasa Inggris, sesuai permintaan berikut: ${prompt}. Jawab hanya dengan tweet-nya saja, tidak perlu penjelasan.`
            }
          ],
          stream: false
        })
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }
      const tweet = data.choices?.[0]?.message?.content || '';
      res.status(200).json({ tweet });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }