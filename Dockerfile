# Backend de Media Studio — Cloud Run
# Node 22 (requiere experimental-sqlite nativo)
FROM node:22-slim

WORKDIR /app

# Solo las dependencias del servidor (no las de Vite/React)
COPY package*.json ./
RUN npm ci --omit=dev

# Código del servidor
COPY server/ ./server/

# Cloud Run inyecta PORT, pero el server usa STUDIO_PORT
ENV STUDIO_PORT=8080
ENV NODE_ENV=production
ENV IS_PROD=true

EXPOSE 8080

CMD ["node", "--experimental-sqlite", "server/index.mjs"]
