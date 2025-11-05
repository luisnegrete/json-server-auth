// scripts/hash-passwords.js
// Uso: node scripts/hash-passwords.js
// Este script lee db.json y reemplaza passwords en texto plano por hashes bcrypt.
// IMPORTANTE: Haz backup de db.json antes de ejecutar.

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, '..', 'db.json');
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

async function run() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('db.json not found at', DB_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const db = JSON.parse(raw);

  if (!Array.isArray(db.users)) {
    console.error('No users array found in db.json');
    process.exit(1);
  }

  for (let i = 0; i < db.users.length; i++) {
    const u = db.users[i];
    const pwd = u.password;
    if (!pwd) continue;

    // Si ya parece un hash bcrypt, saltar
    if (typeof pwd === 'string' && (pwd.startsWith('$2a$') || pwd.startsWith('$2b$') || pwd.startsWith('$2y$'))) {
      console.log(`User ${u.email}: already hashed, skipping`);
      continue;
    }

    // Hash the password
    const hash = await bcrypt.hash(pwd, SALT_ROUNDS);
    db.users[i].password = hash;
    console.log(`User ${u.email}: password hashed`);
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log('db.json updated with hashed passwords. Make a backup before committing.');
}

run().catch(err => {
  console.error('Error hashing passwords:', err);
  process.exit(1);
});