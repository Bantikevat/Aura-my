import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  try { req.userId = jwt.verify(token, process.env.JWT_SECRET).sub; return next(); }
  catch { return res.status(401).json({ message: 'Session expired. Please sign in again.' }); }
}
