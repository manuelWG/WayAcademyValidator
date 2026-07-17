# WayAcademyValidator

Aplicación Nuxt para validar públicamente certificados académicos importados desde Moodle. La **fase 2** conecta autenticación administrativa y cursos a **Neon PostgreSQL** (rama `dev`); certificados, importaciones, auditoría y consulta pública siguen en **mock**.

## Requisitos

- Node.js 20+ (CI usa 22)
- npm
- Proyecto Neon con rama **`dev`**
- Variables locales en `.env` (nunca committed):

```env
DATABASE_URL=           # connection string de la rama Neon "dev"
NUXT_SESSION_PASSWORD=  # ≥ 32 caracteres
```

Copia [`.env.example`](.env.example) como plantilla. Cursor/agentes no deben inventar secretos reales.

## Arranque local

```bash
npm install
npm run dev
```

### Base de datos (Neon `dev`)

```bash
# Revisar SQL generado en server/database/migrations/ antes de aplicar
npm run db:generate

# Migrar SOLO la rama Neon "dev" (confirmación explícita obligatoria)
# Interactivo (pide YES):
MIGRATION_TARGET=dev DATABASE_URL=<neon-dev> npm run db:migrate

# No interactivo:
MIGRATION_TARGET=dev MIGRATE_CONFIRM=YES DATABASE_URL=<neon-dev> npm run db:migrate
```

No uses `drizzle-kit push` como flujo principal. No edites migraciones ya aplicadas.
Las migraciones **no** se ejecutan en build ni al arrancar la app.

### Primer administrador

```bash
npm run create-admin
```

Flujo interactivo (TTY, password oculta). Para una ejecución puntual no interactiva, pasa variables **solo en esa invocación** (no las guardes en `.env`):

```bash
ADMIN_USERNAME=... ADMIN_DISPLAY_NAME=... ADMIN_PASSWORD=... npm run create-admin
```

Acceso: `/admin/login` — **ya no** existen credenciales demo (`admin` / `demo1234`).

## Qué es real vs demo

| Módulo | Estado |
|--------|--------|
| Login / sesión admin | Real (Nuxt Auth Utils + Neon) |
| Cursos (CRUD / publicar) | Real (Neon) |
| Certificados / consulta pública | Mock |
| Importaciones / auditoría | Mock |
| Dashboard | Híbrido (cursos publicados reales; resto etiquetado Demo) |

## Arquitectura

```
Páginas → Composables → Repositorios cliente
                           ├─ auth/cursos → /api/* → services → Drizzle neon-http → Neon
                           └─ certs/imports/audit → useMockStore (mock)
```

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo |
| `npm run build` | Build (sin requerir Neon; cliente DB lazy) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Tipos |
| `npm run test:unit` | Pruebas unitarias (sin Neon) |
| `npm run test:integration` | Manual; exige `DATABASE_URL_TEST` (sin fallback a `DATABASE_URL`) |
| `npm run db:generate` | Generar migración SQL |
| `npm run db:migrate` | Migrar Neon `dev` (`MIGRATION_TARGET=dev` + confirmación `YES`) |
| `npm run create-admin` | Crear administrador |

## Verificación antes de commit

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

## Estrategia de ramas

- `main` — prototipo visual estable
- `feat/phase-2-data-auth` — esta fase (sin merge/push automático)

## Documentación adicional

- [`docs/DATA-MODEL-FUTURE.md`](docs/DATA-MODEL-FUTURE.md) — tablas futuras (solo Markdown)
- [`docs/SECURITY-FUTURE.md`](docs/SECURITY-FUTURE.md) — controles previos a producción

## Stack

Nuxt 4, Nuxt UI / Tailwind 4, TypeScript, Neon, Drizzle (`neon-http`), Zod, Nuxt Auth Utils, bcryptjs, Vitest.
