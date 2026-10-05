# Gestor de crédito

Aplicación web multi-usuario (React + Express + Postgres) para gestionar tarjetas de crédito y proyectar salidas de deuda.

Prioridad: **correctitud financiera**. Valores del banco = `REAL`; proyecciones = `ESTIMADO`.

## Stack

- React + Vite + TypeScript
- [glubox](https://github.com/solivoo/gluebox)
- Express API + JWT (cookie `httpOnly`)
- Sequelize + Postgres
- Decimal.js / Vitest (motor financiero)
- Docker Compose (Portainer)

## Desarrollo local

```bash
# Postgres (puerto host 5433 → evita choque con un Postgres local en 5432)
docker compose up -d db

cp .env.example .env
pnpm install
pnpm dev
```

- Web: http://localhost:5173  
- API: http://localhost:3000  
- Postgres local: `localhost:5433`

## Portainer / producción

```bash
export JWT_SECRET='un-secreto-largo'
docker compose up -d --build
```

Abre `http://<host>:3000`, registra un usuario e inicia sesión.

Variables:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión Postgres |
| `JWT_SECRET` | Firma de sesión |
| `PORT` | Puerto HTTP (default 3000) |

## Estructura

```
src/server     API Express, auth, Sequelize, importadores
src/renderer   SPA React
src/shared     tipos y schemas
src/domain     motor financiero puro
```

## Auth

- `POST /api/auth/register` — nombre, email, contraseña (≥8)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Cada usuario solo ve sus tarjetas, estados e importaciones (`userId`).
