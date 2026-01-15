FROM node:25-alpine AS builder
WORKDIR /app

COPY . .
RUN npm ci
RUN npm run build

FROM node:25-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force

ENV PORT=2324
ENV TZ=Asia/Shanghai

EXPOSE 2324

CMD ["node", "dist/server/index.mjs"]