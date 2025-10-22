# **json-server-auth: API Mock con Autenticación JWT y Validación**

Este proyecto crea una API RESTful simulada utilizando json-server que implementa flujos de Autenticación (JWT) y Validación de Datos (Middleware). Es ideal para crear un backend de prueba realista y aislado para suites de automatización de pruebas de API.

## **Arquitectura del Proyecto**

El servidor se ejecuta en un contenedor Docker y utiliza middlewares de Node.js/Express para interceptar y procesar peticiones antes de que lleguen al router de <em>json-server</em>.
Estructura de Directorios:

<code>json-server-auth/
│
├── middlewares/
│ ├── auth.js         <-- Lógica para verificar el JWT.
│ └── validation.js   <-- Lógica para validar campos (ej: price en /products).
│
├── docker-compose.yml  <-- Orquestación y mapeo de puertos.
├── Dockerfile          <-- Define el entorno Node.js para el servidor.
├── package.json        <-- Dependencias (json-server, jsonwebtoken, body-parser).
├── server.js           <-- Punto de entrada: Conecta JWT Login, Middlewares y Router.
└── db.json             <-- Base de datos simulada (datos de users, products, orders).
</code>

## **Inicio Rápido con Docker**

Asegúrate de tener Docker y Docker Compose instalados.

1. Construir e Iniciar el Contenedor
Desde el directorio raíz del proyecto:

<code>docker-compose up --build</code>

El servidor estará disponible en <code>http://localhost:3000</code>.

2. Comandos Útiles


| Comando                             | Descripción                                         |
|-|-|
| <code>docker-compose up -d</code>                | Inicia el contenedor en segundo plano.              |
| <code>docker-compose stop</code>                 | Detiene el contenedor sin eliminar los datos.       |
| <code>docker-compose down</code>                 | Detiene y elimina el contenedor y la red.           |
| <code>docker exec -it mock-json-server sh</code> | Accede a la terminal del contenedor para depuración.|

## **Servicios de API Disponibles**

La URL base para todos los servicios es http://localhost:3000.

Flujo de Autenticación (JWT)

| Endpoint | Método | Propósito | Headers | Body (JSON) |
|-|-|-|-|-|
| /login | POST | Genera un Token JWT si las credenciales son válidas. | Content-Type: application/json | {"email": "admin@example.com", "password": "123456"} |

## **Endpoints Protegidos (Catálogo y Órdenes)**

Todos los servicios a <code>/products</code>  y <code>/orders</code> requieren el Header Authorization: Bearer <code>\<token\></code> obtenido del <code>/login.</code>

| Endpoint | Método | Función | Headers Requeridos | 
|-|-|-|-| 
| <code>/products</code> | <code>GET</code> | Obtiene el catálogo de productos. | Authorization: Bearer <code>\<token\></code> |
| <code>/products</code> | <code>POST</code> | Crea un nuevo producto. | Authorization: Bearer <code>\<token\></code> |
| <code>/products/:id</code> | <code>PUT/PATCH/DELETE</code> | Actualiza o elimina un producto específico. | Authorization: Bearer <code>\<token\></code> |
| <code>/orders</code> | <code>POST</code> | Crea una nueva orden (Checkout). | Authorization: Bearer <code>\<token\></code> |
| <code>/orders/:id</code> | <code>GET/PUT/DELETE</code> | Interactúa con una orden específica. | Authorization: Bearer <code>\<token\></code> |

## **Lógica de Middlewares (Pruebas de Automatización)**

1. Autenticación (JWT)
- Implementación: Archivo <code>middlewares/auth.js</code>.
- Comportamiento:
  - Si el Header <code>Authorization: Bearer \<token\></code> falta o el token es inválido/expirado, el servidor devuelve <code>401 Unauthorized</code>.
  - La única ruta exenta de esta regla es <code>POST /login</code>.
  
2. Validación de Productos
- Implementación: Archivos <code>middlewares/validation.js</code> y <code>server.js</code>.
- Comportamiento:
  - La validación se aplica a <code>POST /products</code>.
  - Se requiere que los campos <code>name</code> y <code>price</code> estén presentes.
  - El campo <code>price</code> debe ser un número positivo (entero o flotante).
  - Si la validación falla, el servidor devuelve <code>400 Bad Request</code>.

## **Flujo Típico de Pruebas de API**

Para automatizar las pruebas contra este mock de API, el flujo siempre debe seguir esta secuencia:

1. *Login*: Ejecutar <code>POST /login</code> y guardar el <code>token</code> de la respuesta (ej., en una variable de entorno <code>{{authToken}}</code> en Bruno).
2. *Uso Protegido*: Ejecutar cualquier otra petición (<code>GET /products</code>, <code>POST /orders</code>, etc.), pasando siempre el valor <code>Bearer {{authToken}}</code> en el _Header_ <code>Authorization</code>.
3. *Pruebas de Fallo*: Verificar que las peticiones con token inválido devuelvan <code>401</code> y que las peticiones <code>POST /products</code> con datos malos devuelvan <code>400</code>.













