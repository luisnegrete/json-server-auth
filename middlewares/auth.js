// middlewares/auth.js (Para usar JWT)
const jwt = require('jsonwebtoken');

// El mismo secreto usado en server.js
const SECRET_KEY = 'tu-secreto-super-seguro-de-prueba'; 

module.exports = (req, res, next) => {
    // 1. Rutas Públicas (Incluimos /login)
    const publicPaths = ['/login', '/register']; 
    if (publicPaths.includes(req.path) && req.method === 'POST') {
        return next();
    }
    
    // 2. Obtener Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Bearer token missing' });
    }
    
    const token = authHeader.split(' ')[1];

    try {
        // 3. Verificar Token
        jwt.verify(token, SECRET_KEY);
        
        // Token válido: Continuar el flujo normal
        next(); 
    } catch (err) {
        // Token inválido o expirado
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};