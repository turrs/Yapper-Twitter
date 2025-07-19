import { createClient } from '@supabase/supabase-js';

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

  const { email, password, fullName, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Basic validation
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Create new user using Supabase function
    const { data: userId, error: createError } = await supabase.rpc('create_user', {
      p_email: email,
      p_password: password,
      p_full_name: fullName || null,
      p_username: username || null
    });

    if (createError) {
      console.error('User creation error:', createError);
      
      // Handle specific errors
      if (createError.message.includes('Email already exists')) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      
      if (createError.message.includes('Username already exists')) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Log the registration activity
    await supabase.rpc('log_user_activity', {
      p_user_id: userId,
      p_activity_type: 'register',
      p_description: 'New user registration',
      p_metadata: {
        user_agent: req.headers['user-agent'],
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        method: 'extension_register',
        email: email,
        has_username: !!username,
        has_full_name: !!fullName
      }
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: userId
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 