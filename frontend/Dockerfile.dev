FROM node:20

WORKDIR /app

# Instalace závislostí
COPY package*.json  ./
RUN npm install

# Start Vite serveru
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
