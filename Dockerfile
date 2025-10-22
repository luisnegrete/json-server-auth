# Usa la imagen oficial de Node
FROM node:18

# Crea el directorio de trabajo
WORKDIR /usr/src/app

# Copia solo los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instala dependencias dentro del contenedor
RUN npm install

# Copia el resto del código
COPY . .

# Expone el puerto
EXPOSE 3000

# Comando de arranque
CMD ["npm", "start"]
