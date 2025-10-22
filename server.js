// server.js (Corregido)
const jsonServer = require('json-server')
const bodyParser = require('body-parser') // <- Importar body-parser
const customAuth = require('./middlewares/auth')
const validation = require('./middlewares/validation')
const jwt = require('jsonwebtoken'); // <-- 1. Importar JWT
const fs = require('fs'); // <-- Para leer db.json

// Secreto para firmar el token (Úsalo también para verificar en auth.js)
const SECRET_KEY = 'tu-secreto-super-seguro-de-prueba'; // <-- 2. Definir secreto

const app = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

// 1. Middlewares por defecto
app.use(middlewares)

// 2. Body Parser (DEBE ir antes de auth/validation para leer req.body)
app.use(bodyParser.json())

// 3. Autenticación (Se aplica a todas las rutas antes de la lógica)
app.use(customAuth)

// 4. Validación (Aplicada solo a POST /products)
// El 'validation' se ejecuta. Si pasa, 'next()' llama al jsonServer.router
app.post('/products', validation, (req, res, next) => {
  next();
})

// NUEVA CONEXIÓN: VALIDACIÓN DE ÓRDENES
app.post('/orders', validation, (req, res, next) => { // <-- Se conecta la validación aquí
  next();
});

// 3. Ruta POST /login para generar el token
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Leer usuarios de db.json
    const db = JSON.parse(fs.readFileSync('db.json', 'UTF-8'));
    const user = db.users.find(u => u.email === email && u.password === password);

    if (user) {
      // Validación adicional para simular el usuario bloqueado de Sauce Demo
      if (user.status === 'locked') {
          // Error 403 Forbidden para simular acceso denegado
          return res.status(403).json({ message: 'User has been locked out.' }); 
      }

      // Credenciales correctas: Generar el token
      const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });

      // Devolver el token al cliente (tu prueba automatizada)
      return res.json({ token });
    } else {
        // Credenciales incorrectas
        return res.status(401).json({ message: 'Invalid credentials' });
    }
});

// 5. Router (Maneja las peticiones GET, PUT, DELETE, y POST si validation pasó)
app.use(router)

const PORT = 3000
app.listen(PORT, () => {
  console.log(`JSON Server with Custom Middlewares running on http://localhost:${PORT}`)
})