FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install --global pnpm@10.28.1 \
    && pnpm install --prod --frozen-lockfile \
    && pnpm store prune

FROM node:22-alpine

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY dist ./dist

ENV PORT=2324
ENV TZ=Asia/Shanghai

EXPOSE 2324

CMD ["node", "dist/server/index.mjs"]
