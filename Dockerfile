FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci \
  && npm install @css-inline/css-inline-linux-x64-gnu@0.20.0 --no-save

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:seed:demo:large && npm run build

FROM node:22-bookworm-slim AS tools
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app


ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev \
  && npm install @css-inline/css-inline-linux-x64-gnu@0.20.0 --omit=dev --no-save \
  && npm cache clean --force

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-seeds ./dist-seeds
COPY package*.json ./
COPY src/modules/mail/templates ./src/modules/mail/templates

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "const net = require('net'); const socket = net.connect(process.env.PORT || 8080, '127.0.0.1', () => process.exit(0)); socket.on('error', () => process.exit(1)); setTimeout(() => process.exit(1), 4000)"

CMD ["node", "dist/main.js"]
