# Auto-detected Node.js / Next.js Server build by Cyber Cloud (Optimized Multi-stage)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --if-present

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
RUN npm prune --production && npm cache clean --force
EXPOSE 3000
CMD ["sh", "-c", "if [ -f .next/standalone/server.js ]; then node .next/standalone/server.js; else npm start; fi"]
