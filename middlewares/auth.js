const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'tu-secreto-super-seguro-de-prueba'; // use env in production

module.exports = (req, res, next) => {
  // Public routes and allowed methods
  const publicRoutes = [
    { path: '/login', methods: ['POST'] },
    { path: '/register', methods: ['POST'] }
  ];

  const isPublic = publicRoutes.some(r => r.path === req.path && r.methods.includes(req.method));
  if (isPublic) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Bearer token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    // Attach decoded payload for downstream handlers
    req.user = decoded;
    return next();
  } catch (err) {
    if (err && err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token expired' });
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};