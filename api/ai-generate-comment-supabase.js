import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (!token) {
    return res.status(401).json({ error: 'Token is required' });
  }

  // Validate token using Supabase
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const { data: sessionResult, error: sessionError } = await supabase.rpc('validate_session', {
      p_token_hash: tokenHash
    });

    if (sessionError || !sessionResult || sessionResult.length === 0) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    const user = sessionResult[0];
    
    // Log the activity
    await supabase.rpc('log_user_activity', {
      p_user_id: user.user_id,
      p_activity_type: 'generate_comment',
      p_description: 'User generated AI comment',
      p_metadata: {
        user_agent: req.headers['user-agent'],
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        method: 'ai_generate_comment'
      }
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(401).json({ error: 'Invalid token' });
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