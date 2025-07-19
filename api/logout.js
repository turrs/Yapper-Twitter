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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (!token) {
    return res.status(401).json({ error: 'Token is required' });
  }

  try {
    // Hash the token to match what's stored in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // First, get user info from session
    const { data: sessionResult, error: sessionError } = await supabase.rpc('validate_session', {
      p_token_hash: tokenHash
    });

    if (sessionError || !sessionResult || sessionResult.length === 0) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    const user = sessionResult[0];

    // Deactivate the session
    const { error: logoutError } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('token_hash', tokenHash);

    if (logoutError) {
      console.error('Logout error:', logoutError);
      return res.status(500).json({ error: 'Failed to logout' });
    }

    // Log the logout activity
    await supabase.rpc('log_user_activity', {
      p_user_id: user.user_id,
      p_activity_type: 'logout',
      p_description: 'User logged out via extension',
      p_metadata: {
        user_agent: req.headers['user-agent'],
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        method: 'extension_logout'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 