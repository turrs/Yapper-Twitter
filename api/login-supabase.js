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

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Authenticate user using Supabase function
    const { data: authResult, error: authError } = await supabase.rpc('authenticate_user', {
      p_email: email,
      p_password: password
    });

    if (authError) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!authResult || authResult.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = authResult[0];

    // Check if user is active and verified
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    if (!user.is_verified) {
      return res.status(401).json({ error: 'Account not verified. Please verify your email first.' });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Set token expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create session in database
    const { data: sessionResult, error: sessionError } = await supabase.rpc('create_session', {
      p_user_id: user.user_id,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt.toISOString(),
      p_user_agent: req.headers['user-agent'] || null,
      p_ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || null
    });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    // Log login activity
    await supabase.rpc('log_user_activity', {
      p_user_id: user.user_id,
      p_activity_type: 'login',
      p_description: 'User logged in via extension',
      p_metadata: {
        user_agent: req.headers['user-agent'],
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        method: 'extension_login'
      }
    });

    return res.status(200).json({
      success: true,
      token: token,
      userId: user.user_id,
      email: user.email,
      fullName: user.full_name,
      username: user.username,
      role: user.role,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 