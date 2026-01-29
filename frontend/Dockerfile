FROM node:20

WORKDIR /app

# Kopírování package files
COPY package*.json  ./

# Použití npm ci - rychlejší a smaže předchozí node_modules
RUN npm ci

# Start Vite serveru
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
