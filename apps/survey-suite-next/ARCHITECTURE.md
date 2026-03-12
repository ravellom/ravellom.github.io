# Arquitectura propuesta - Survey Suite Next

## Objetivo
Construir una app integral y modular en una sola base, manteniendo `apps/survey-suite` como legado estable.

## Estructura
```
apps/
  survey-suite/        # legacy actual
  survey-suite-next/   # nueva app integral
    app/
      auth/
      dashboard/
      api/
    components/
      auth/
      dashboard/
      ui/              # siguiente fase
    prisma/
    lib/
      auth/
      db/
      datasets/
      charts/
```

## Plataforma
- Frontend + backend: Vercel (Next.js + Functions)
- DB: Postgres (local Docker, luego Vercel Postgres/Neon)
- Auth: Auth.js + Credentials
- Archivos: S3 compatible (local MinIO, luego Vercel Blob/S3)

## Fases
1. Fundaciones
- Auth completo
- Dashboard protegido
- Infra local dockerizada

2. Datos y dominio
- Modelos: users, workspaces, datasets, chart_configs
- Persistencia de datasets y metadatos

3. Migración de módulos
- Likert
- Distribution
- Processor

4. Operación
- logging, métricas, backups, QA e2e
