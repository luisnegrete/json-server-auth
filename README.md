// ...existing code...

# json-server-auth — API mock con autenticación JWT y validación

Este proyecto expone un mock HTTP REST (json-server) ampliado con middlewares para:

- Autenticación JWT (verificación en middleware).
- Validaciones de payload (productos y órdenes).
- Soporte para contraseñas hasheadas (bcrypt) y script de migración.
- Empaquetado y ejecución vía Docker / docker-compose.

## Estructura principal

json-server-auth/

- middlewares/
  - auth.js — verifica y descifra JWT; adjunta req.user
  - validation.js — valida POST /products y POST /orders
- scripts/
  - hash-passwords.js — lee db.json y convierte passwords a bcrypt
- Dockerfile
- docker-compose.yml
- server.js — arranque, rutas personalizadas (login), middlewares y router json-server
- db.json — base de datos simulada (users, products, orders)
- .env / .env.example

## Variables de entorno (relevantes)

Lectura desde .env (o docker-compose env_file). Valores presentes en el repo:

- JWT_SECRET — secreto para firmar/verificar tokens (requerido).
- BCRYPT_SALT_ROUNDS — rounds para bcrypt (por defecto 10).
- PORT — puerto de la app (por defecto 3000).
- MIGRATE_ON_START — (indica intención de migración; el script existe bajo scripts/).
- RATE*LIMIT*\* — variables disponibles en .env, no todas están aplicadas por defecto en server.js.

Nota: el tiempo de expiración del token está definido en server.js como '1m' (1 minuto). Cambiarlo requiere editar server.js.

## Inicio rápido

Con Docker (recomendado):

- Construir y levantar:
  docker-compose up --build
- Levantar en background:
  docker-compose up -d
- Ejecutar el seeder de hashing (migrate service incluido en docker-compose):
  docker-compose run --rm migrate

Localmente:

- Instalar dependencias:
  npm install
- Ejecutar:
  npm start
- Modo desarrollo (si tienes nodemon):
  npm run dev

Para migrar passwords del db.json a hashes:

- Hacer backup de db.json
- Ejecutar:
  npm run hash-passwords
  o usar el servicio `migrate` en docker-compose.

## Endpoints principales

Base URL: http://localhost:3000

Rutas públicas:

- POST /login
  - Body JSON: { "email": "...", "password": "..." }
  - Respuesta exitosa: { "token": "<jwt>" } (nota: la propiedad se llama token)
  - El login soporta comparar contra passwords en claro o hashed (bcrypt). Compatible con db.json provisto.

Rutas protegidas (requieren header Authorization: Bearer <token>):

- /products
  - GET — listar productos (autenticación requerida)
  - POST — crear producto (autenticación requerida + validación)
- /products/:id
  - PUT/PATCH/DELETE — operaciones protegidas por JWT
- /orders
  - POST — crear orden (autenticación requerida + validación)
- /orders/:id
  - GET/PUT/DELETE — protegidas por JWT

Nota: auth.js considera públicas las rutas POST /login y POST /register (aunque no hay implementación de /register en el repo por defecto).

## Validaciones aplicadas

middleware: middlewares/validation.js

- POST /products

  - name: requerido y no vacío
  - price: requerido, número positivo (entero o decimal)
  - Si falla, se devuelve 400 con mensaje explicativo.

- POST /orders
  - userId: requerido
  - items: array no vacío; cada item debe tener productId, quantity (>0) y price (>0)
  - totalAmount: requerido > 0 y se verifica que coincida con la suma items (tolerancia 0.01)
  - Errores devuelven 400 con descripción.

## Autenticación / Seguridad

middleware: middlewares/auth.js

- Espera header Authorization: Bearer <token>.
- Verifica token con JWT_SECRET (desde env).
- Al decodificar agrega req.user con el payload.
- Si falta/expira/ es inválido devuelve 401 (o 403 para usuarios marcados como locked en login).

Login (server.js)

- Lee usuarios desde db.json y busca por email.
- Si user.status === 'locked' -> devuelve 403.
- Si la password almacenada parece un hash bcrypt (prefijos $2a$/$2b$/$2y$) usa bcrypt.compare; en caso contrario compara texto plano (comportamiento para facilitar migración).
- Respuesta: { "token": "<jwt>" } (token firmado con JWT_SECRET). TTL en código = '1m'.

## Hasheo de contraseñas

- Script: scripts/hash-passwords.js
- Uso recomendado antes de publicar: respaldar db.json y ejecutar npm run hash-passwords para reemplazar passwords en claro por hashes bcrypt.
- docker-compose incluye servicio `migrate` que ejecuta el script si deseas usarlo vía contenedor.

## Docker / Healthcheck

- Dockerfile incluye HEALTHCHECK que solicita http://localhost:3000/.
- docker-compose monta el repo en el contenedor y expone 3000:3000.
- Comando para construir el contenedor: docker-compose run --rm -e BCRYPT_SALT_ROUNDS=10 json-server sh -c "npm install && node scripts/hash-passwords.js"
- Comando para levantar el contenedor: docker-compose up -d

## Ejemplos rápidos (curl)

1. Login
   curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{"email":"standard_user@sauce.com","password":"secret_sauce"}'

Respuesta esperada:
{ "token": "<jwt>" }

2. Obtener productos (con token)
   curl -H "Authorization: Bearer <token>" http://localhost:3000/products

3. Crear producto (validación aplicada)
   curl -X POST http://localhost:3000/products \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Nuevo Producto","price":19.99,"inventory":5}'

## Notas para integración de pruebas

- Guardar el token devuelto por /login y usarlo en Authorization: Bearer <token>.
- Verificar respuestas 401 para tokens inválidos/expirados.
- Verificar respuestas 403 para usuarios con status locked.
- Verificar respuestas 400 para payloads inválidos en POST /products y POST /orders.

## Qué revisar / posibles mejoras futuras

- Exponer expiración de token mediante variable de entorno (actualmente hardcodeada en server.js).
- Implementar control de rate-limit y CORS si se requiere (hay variables RATE*LIMIT*\* en .env como pista de configuración).
- Implementar endpoints de registro (/register) y roles/permiso por usuario (ej. role: admin) si necesitas control de acceso por rol.
