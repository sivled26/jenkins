# Imagen de producción de NutriBox API
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Solo dependencias de producción (sin jest, eslint, etc.)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY src ./src

# Buenas prácticas: no ejecutar como root dentro del contenedor
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
