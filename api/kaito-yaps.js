import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
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
  const token = authHeader.substring(7);
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
    // Optionally, you can log activity here if needed
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { duration = '30d', topic_id = 'CYSIC', top_n = '100', username } = req.query;

  try {
    const kaitoUrl = `https://hub.kaito.ai/api/v1/gateway/ai/kol/mindshare/top-leaderboard?duration=${duration}&topic_id=${topic_id}&top_n=${top_n}&customized_community=customized&community_yaps=true`;
    const response = await fetch(kaitoUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch yapping history');
    }
    const data = await response.json();
    console.log(data);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching yapping history:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
} 