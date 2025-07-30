import JWT from "jsonwebtoken";

export default function handler(req, res) {
  const secret = process.env.EMBED_WORKFLOW_SK;
  const userId = req.query.userId || process.env.EMBED_WORKFLOW_DEFAULT_USER || 'main';
  
  if (!secret) {
    return res.status(500).json({ error: 'Missing EMBED_WORKFLOW_SK environment variable' });
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    iat: currentTime,
    exp: currentTime + 60 * 60,
    discover: true
  };
  
  try {
    const token = JWT.sign(payload, secret, { algorithm: "HS256" });
    res.status(200).json({ token, userId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate JWT token' });
  }
}