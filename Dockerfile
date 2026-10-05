FROM node:22-bookworm-slim

WORKDIR /app

# Instalar pnpm por npm (más predecible que corepack en Portainer)
RUN npm install -g pnpm@10.28.0

ENV CI=true
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec vite build

EXPOSE 3000
CMD ["pnpm", "exec", "tsx", "src/server/index.ts"]
