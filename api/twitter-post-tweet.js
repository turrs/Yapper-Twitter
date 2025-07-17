export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const { tweet } = req.body;
    const authHeader = req.headers.authorization;
    const twitterToken = authHeader ? authHeader.split(' ')[1] : null;
    if (!twitterToken) {
      return res.status(401).json({ error: 'Twitter access token not found. Please login again.' });
    }
    if (!tweet) {
      return res.status(400).json({ error: 'Missing tweet content' });
    }
    try {
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${twitterToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tweet }),
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data.error || data.title || 'Failed to post tweet' });
      }
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }