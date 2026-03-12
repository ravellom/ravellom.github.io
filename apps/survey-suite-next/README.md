# Survey Suite Next

Base nueva de la suite con arquitectura integral, ejecutable en local y desplegable en Vercel.

## Stack (sin Firebase)
- Next.js (App Router, TypeScript)
- Auth.js (credenciales)
- PostgreSQL (Prisma)
- MinIO local (S3 compatible para archivos)

## Estructura
- `app/`: rutas y API routes
- `components/`: UI reusable
- `prisma/`: modelo de datos
- `lib/`: auth, prisma y servicios
- `docker-compose.yml`: Postgres + MinIO

## 1) Requisitos
- Node.js 20+
- npm 10+
- Docker Desktop

## 2) Configuración inicial
```bash
cd apps/survey-suite-next
cp .env.example .env.local
npm install
```

## 3) Levantar infraestructura local
```bash
docker compose up -d
```

## 4) Base de datos
```bash
npm run db:generate
npm run db:push
```

## 5) Ejecutar app
```bash
npm run dev
```

## Endpoints útiles
- `GET /api/health` -> health check
- `POST /api/auth/register` -> registro usuario
- `POST /api/auth/[...nextauth]` -> login Auth.js
- `GET /api/datasets` -> listar datasets del workspace
- `POST /api/datasets` -> crear dataset desde CSV
- `GET /api/active-dataset` -> consultar dataset activo
- `POST /api/active-dataset` -> seleccionar dataset activo

## Páginas clave
- `/dashboard` -> resumen de sesión y workspace
- `/datasets` -> carga/listado/selección de dataset activo
- `/likert` -> vista inicial del módulo Likert usando dataset activo

## Deploy en Vercel
1. Importa `apps/survey-suite-next` como proyecto.
2. Crea base Postgres gestionada (Vercel Postgres/Neon).
3. Configura variables (`DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, y S3 si aplica).
4. Ejecuta migraciones Prisma en pipeline.
