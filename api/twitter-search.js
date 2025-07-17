export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const { query, max_results } = req.query;
    const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }
    if (!BEARER_TOKEN) {
      return res.status(500).json({ error: 'Twitter Bearer Token not configured' });
    }
    const encodedQuery = encodeURIComponent(query);
    const maxResults = max_results || 10;
    const twitterUrl = `https://api.twitter.com/2/tweets/search/recent?query=${encodedQuery}&max_results=${maxResults}&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=name,username,profile_image_url`;
    try {
      const response = await fetch(twitterUrl, {
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }
      const users = (data.includes && data.includes.users) || [];
      const mapped = (data.data || []).map(tweet => {
        const author = users.find(user => user.id === tweet.author_id) || {};
        return {
          id: tweet.id,
          username: author.name || 'Unknown User',
          handle: author.username ? `@${author.username}` : '@unknown',
          content: tweet.text,
          timestamp: tweet.created_at || '',
          likes: tweet.public_metrics ? tweet.public_metrics.like_count : 0,
          retweets: tweet.public_metrics ? tweet.public_metrics.retweet_count : 0,
          replies: tweet.public_metrics ? tweet.public_metrics.reply_count : 0,
          avatar: author.profile_image_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop',
          url: author.username ? `https://twitter.com/${author.username}/status/${tweet.id}` : ''
        };
      });
      res.status(200).json({ data: mapped });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }