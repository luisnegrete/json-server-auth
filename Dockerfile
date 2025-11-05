# Dockerfile optimizado (Debian base)
FROM node:18-slim

# Instalar herramientas necesarias solo si se requieren para compilar paquetes nativos
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential python3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copiar package.json y package-lock.json para cachear npm install
COPY package*.json ./

# Instalar dependencias (usa npm ci si tienes package-lock.json)
RUN npm install --production

# Copiar el resto del código
COPY . .

# Crear usuario no-root
RUN useradd --user-group --create-home --shell /bin/false appuser && \
    chown -R appuser:appuser /usr/src/app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD curl -f http://localhost:3000/ || exit 1

CMD ["npm", "start"]