import fetch from 'node-fetch';

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI;
const VITE_URL_FRONTEND = process.env.VITE_URL_FRONTEND;

// Jika Anda menggunakan Supabase, import dan inisialisasi di sini
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const code = req.body?.code || req.query?.code;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  try {
    // Tukar code dengan access token
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

    // Ambil data user
    const userRes = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    const userData = await userRes.json();

    // Simpan ke Supabase jika diperlukan (contoh, nonaktifkan jika tidak pakai)
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
    }

    // Set cookie (jika environment mendukung)
    res.setHeader('Set-Cookie', `twitter_token=${tokenData.access_token}; HttpOnly; Path=/; Max-Age=${tokenData.expires_in}`);

    // Redirect ke frontend (atau kirim data)
    if (VITE_URL_FRONTEND) {
      return res.redirect(`${VITE_URL_FRONTEND}/`);
    } else {
      return res.status(200).json({ user: userData, token: tokenData });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
} 