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
    // For demo purposes, we'll use a simple hardcoded user
    // In production, you should use a proper database and password hashing
    const validUsers = [
      {
        email: 'demo@example.com',
        password: 'demo123',
        userId: '1'
      },
      {
        email: 'test@example.com', 
        password: 'test123',
        userId: '2'
      }
    ];

    const user = validUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64');

    return res.status(200).json({
      success: true,
      token: token,
      userId: user.userId,
      email: user.email,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 