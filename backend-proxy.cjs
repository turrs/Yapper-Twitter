const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');


const app = express();
const PORT = process.env.PORT || 4000;
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
app.use(cookieParser());
app.use(cors({
  origin: import.meta.env.VITE_URL_BACKEND,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
app.use(express.json());

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI;


const { createClient } = require('@supabase/supabase-js');
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;
// Untuk GET /oauth/twitter/callback?code=...
app.get('/oauth/twitter/callback', async (req, res) => {
  const { code } = req.query;
  console.log('[DEBUG] client_id:', TWITTER_CLIENT_ID);
  console.log('[DEBUG] client_secret:', TWITTER_CLIENT_SECRET ? '[SET]' : '[MISSING]');
  console.log('[DEBUG] base64:', Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64'));

  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }
  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: TWITTER_REDIRECT_URI,
        code_verifier: process.env.TWITTER_CODE_VERIFIER || 'y_SfRG4BmOES02uqWeIkIgLQAlTBggyf_G7uKT51ku8',
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({ error: tokenData.error_description || 'Failed to get Twitter access token' });
    }
    // Fetch user info
    const userRes = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    const userData = await userRes.json();

    // Upsert user/token to Supabase
    let supabaseResult = null;
    if (supabase && userData.data) {
      const { data, error } = await supabase
        .from('twitter_users')
        .upsert({
          twitter_user_id: userData.data.id,
          username: userData.data.username,
          name: userData.data.name,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
          scope: tokenData.scope,
          token_type: tokenData.token_type,
          raw: userData.data
        }, { onConflict: ['twitter_user_id'] })
        .select();
      if (error) {
        return res.status(500).json({ error: 'Supabase upsert error: ' + error.message });
      }
      supabaseResult = data;
    }

    // Kirim token ke frontend lewat query param (jangan dipakai untuk produksi sensitif)
    res.cookie('twitter_token', tokenData.access_token, {
      httpOnly: false,
      secure: false, // set true if using https
      sameSite: 'lax',
      maxAge: tokenData.expires_in * 1000,
    });
    res.cookie('twitter_name', userData.data.username, {
      httpOnly: false,
      secure: false, // set true if using https
      sameSite: 'lax',
      maxAge: tokenData.expires_in * 1000,
    });
    return res.redirect(`${import.meta.env.VITE_URL_FRONTEND}/`);    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Untuk POST /oauth/twitter/callback { code: '...' }


// app.post('/oauth/twitter/callback', async (req, res) => {
//   const { code } = req.body;
//   if (!code) {
//     return res.status(400).json({ error: 'Missing code' });
//   }
//   try {
//     // Exchange code for access token
//     const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'Authorization': 'Basic ' + Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64'),
//       },
//       body: new URLSearchParams({
//         code,
//         grant_type: 'authorization_code',
//         client_id: TWITTER_CLIENT_ID,
//         redirect_uri: TWITTER_REDIRECT_URI,
//         code_verifier: process.env.TWITTER_CODE_VERIFIER || 'y_SfRG4BmOES02uqWeIkIgLQAlTBggyf_G7uKT51ku8',
//       }).toString(),
//     });
//     const tokenData = await tokenRes.json();
//     if (!tokenRes.ok) {
//       return res.status(tokenRes.status).json({ error: tokenData.error_description || 'Failed to get Twitter access token' });
//     }
//     // Fetch user info
//     const userRes = await fetch('https://api.twitter.com/2/users/me', {
//       headers: {
//         'Authorization': `Bearer ${tokenData.access_token}`,
//       },
//     });
//     const userData = await userRes.json();

//     // Upsert user/token to Supabase
//     let supabaseResult = null;
//     if (supabase && userData.data) {
//       const { data, error } = await supabase
//         .from('twitter_users')
//         .upsert({
//           twitter_user_id: userData.data.id,
//           username: userData.data.username,
//           name: userData.data.name,
//           access_token: tokenData.access_token,
//           refresh_token: tokenData.refresh_token,
//           token_expiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
//           scope: tokenData.scope,
//           token_type: tokenData.token_type,
//           raw: userData.data
//         }, { onConflict: ['twitter_user_id'] })
//         .select();
//       if (error) {
//         return res.status(500).json({ error: 'Supabase upsert error: ' + error.message });
//       }
//       supabaseResult = data;
//     }

//     res.json({ token: tokenData, user: userData, supabase: supabaseResult });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Proxy endpoint for Twitter API v2 recent search
app.get('/twitter/search', async (req, res) => {
  const { query, max_results } = req.query;
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
    // Mapping agar sesuai format Tweet di frontend
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
    res.json({ data: mapped });
  } catch (error) {
    console.log('[DEBUG] error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI Comment Generation Endpoint
app.post('/ai/generate-comment', async (req, res) => {
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
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/twitter/post-comment', async (req, res) => {
  const { tweetId, comment  } = req.body;
  // Get access token from cookies
  const authHeader = req.headers.authorization;
  const twitterToken = authHeader ? authHeader.split(' ')[1] : null;
  if (!twitterToken) {
    return res.status(401).json({ error: 'Twitter access token not found. Please login again.' });
  }
  if (!tweetId || !comment) {
    return res.status(400).json({ error: 'Missing tweetId or comment' });
  }
  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${twitterToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: comment,
        reply: { in_reply_to_tweet_id: tweetId },
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || data.title || 'Failed to post comment' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/twitter/generate-tweet', async (req, res) => {
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
            content: `Buatkan saya 10 tweet dalam bahasa Inggris dengan minimal 200 hingga maks 250 kata, Saya merupakan copywriter dimana saya akan membuatkan tweet untuk menaikkan engagement, sehingga perlu content yang menarik dan tentu saja tata bahasanya tidak seperti hasil dari generate AI, sesuai permintaan berikut: ${prompt}. Jawab hanya dengan tweet-nya saja, tidak perlu penjelasan.`
          }
        ],
        stream: false
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }
    // Ambil isi tweet dari response
    const tweet = data.choices?.[0]?.message?.content || '';
    res.json({ tweet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post Tweet Endpoint (bukan reply)
app.post('/twitter/post-tweet', async (req, res) => {
  const { tweet } = req.body;
  // Get access token from cookies
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
      body: JSON.stringify({
        text: tweet
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || data.title || 'Failed to post tweet' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/twitter/me', async (req, res) => {
  console.log('[DEBUG] req.body:', req.body);
  const token = req.body.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const response = await fetch('https://api.twitter.com/2/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const user = await response.json();
  res.json(user);
});
app.listen(PORT, () => {
  console.log(`Express proxy server listening on port ${PORT}`);
}); 