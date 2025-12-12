// server.js (actualizado para usar bcrypt y SECRET desde env)
const jsonServer = require("json-server");
const bodyParser = require("body-parser");
const customAuth = require("./middlewares/auth");
const validation = require("./middlewares/validation");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const bcrypt = require("bcrypt");

const SECRET_KEY =
  process.env.JWT_SECRET || "tu-secreto-super-seguro-de-prueba";
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
const DB_FILE = process.env.DB_FILE || "db.json";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1m";

if (process.env.MIGRATE_ON_START === "true") {
  console.log("MIGRATE_ON_START is true. Running migration script...");
  try {
    const { execSync } = require("child_process");
    execSync("node scripts/hash-passwords.js", { stdio: "inherit" });
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

const app = jsonServer.create();
const router = jsonServer.router(DB_FILE);
const middlewares = jsonServer.defaults();

app.use(middlewares);
app.use(bodyParser.json());

// Auth middleware (verifica JWT para rutas protegidas)
app.use(customAuth);

// Aplicar validación en POST /products y POST /orders
app.post("/products", validation, (req, res, next) => {
  next();
});

app.post("/orders", validation, (req, res, next) => {
  next();
});

// POST /login: ahora usa bcrypt.compare y es async
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Leer usuarios de db.json
  const db = JSON.parse(fs.readFileSync(DB_FILE, "UTF-8"));
  const user = db.users.find((u) => u.email === email);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.status === "locked") {
    return res.status(403).json({ message: "User has been locked out." });
  }

  // Si la contraseña en db.json está en claro, soportamos ambos casos:
  // - si user.password parece ser un hash bcrypt (empieza con $2b$/$2a$/$2y$), usamos bcrypt.compare
  // - si no, comparamos texto plano (esto facilita migración)
  try {
    let passwordMatches = false;
    if (
      typeof user.password === "string" &&
      (user.password.startsWith("$2a$") ||
        user.password.startsWith("$2b$") ||
        user.password.startsWith("$2y$"))
    ) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      // migración: comparación literal si no hay hash
      passwordMatches = password === user.password;
    }

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: JWT_EXPIRES_IN,
    });
    return res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `JSON Server with Custom Middlewares running on http://localhost:${PORT}`
  );
});
