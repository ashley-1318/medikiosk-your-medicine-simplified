// Auth middleware — verifies JWT on protected routes
const { parseJwt } = require('../lib/jwt');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  const token = authHeader.replace('Bearer ', '');
  const payload = parseJwt(token);
  if (!payload?.id) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = payload; // { id, role, phone }
  next();
}

module.exports = { requireAuth };
