FROM node:22-bookworm-slim
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

# pnpm-workspace.yaml debe copiarse antes del install (allowBuilds / settings)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec vite build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "exec", "tsx", "src/server/index.ts"]
