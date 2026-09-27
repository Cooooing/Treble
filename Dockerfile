FROM node:25-alpine
WORKDIR /app

COPY dist ./dist
COPY package.json pnpm-lock.yaml ./

ENV NODE_ENV=production
RUN corepack enable && pnpm install --prod --frozen-lockfile && pnpm store prune

ENV PORT=2324
ENV TZ=Asia/Shanghai

EXPOSE 2324

CMD ["node", "dist/server/index.mjs"]
