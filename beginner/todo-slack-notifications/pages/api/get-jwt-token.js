import JWT from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Secret key for signing the JWT
    const secret = process.env.EMBED_WORKFLOW_SK;
    
    if (!secret) {
      return res.status(500).json({ 
        message: 'Server configuration error: Missing EMBED_WORKFLOW_SK environment variable' 
      });
    }
    
    // Current time in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Create the JWT payload
    const payload = {
      sub: userId, // The user's unique identifier
      iat: currentTime, // Issued at timestamp
      exp: currentTime + 60 * 60, // Expiration (1 hour from now)
      discover: true, // Enable auto-discovery of users
    };
    
    // Sign the JWT
    const token = JWT.sign(payload, secret, { algorithm: 'HS256' });
    
    // Return the token
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating JWT token:', error);
    return res.status(500).json({ 
      message: 'Failed to generate token',
      error: error.message
    });
  }
}