# WayAcademyValidator

Aplicación Nuxt para importar y auditar certificados académicos de Moodle y ofrecer una consulta pública. Autenticación, cursos, importaciones y auditoría usan backend real con **Neon PostgreSQL**. La consulta pública de certificados permanece en **mock** y no refleja todavía los certificados creados por las importaciones reales.

La migración `0001_*` aplica el schema operativo de certificados/importación/auditoría (`certificates`, `import_batches`, `import_rows`, `audit_conflicts`). El backend procesa CSV, persiste previews, crea certificados y conflictos, y protege documentos con AES-256-GCM + HMAC server-only. Las migraciones nunca se ejecutan durante build ni al arrancar la aplicación.

## Requisitos

- Node.js 22 (consulta `.nvmrc`)
- npm 10.9.8, la misma versión usada para generar `package-lock.json`
- Proyecto Neon con rama **`dev`**
- Rama Neon **`test`** separada para integración
- Variables locales en `.env` (nunca committed):

```env
DATABASE_URL=           # connection string de la rama Neon "dev"
DATABASE_URL_TEST=      # connection string de una rama Neon "test" separada
NUXT_SESSION_PASSWORD=  # ≥ 32 caracteres
DOCUMENT_ENCRYPTION_KEY=
DOCUMENT_ENCRYPTION_KEY_VERSION=
DOCUMENT_LOOKUP_HMAC_KEY=
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
| Certificados persistidos por importación | Real (Neon, cifrados) |
| Importaciones / preview / confirmación | Real (Nitro + Neon) |
| Auditoría / decisiones | Real (Nitro + Neon) |
| Consulta pública de certificados | Mock (fuera de alcance) |
| Dashboard | Híbrido (operación admin real; consulta pública demo) |

## Arquitectura

```
Páginas → Composables → Repositorios cliente
                           ├─ auth/cursos/imports/audit → /api/* → services → Drizzle → Neon
                           └─ consulta pública de certificados → useMockStore (mock)
```

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo |
| `npm run build` | Build (sin requerir Neon; cliente DB lazy) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Tipos |
| `npm run test:unit` | Pruebas unitarias (sin Neon) |
| `npm run test:integration` | Flujo real importación/auditoría; exige rama `DATABASE_URL_TEST` separada |
| `npm run db:generate` | Generar migración SQL |
| `npm run db:migrate` | Migrar Neon `dev` (`MIGRATION_TARGET=dev` + confirmación `YES`) |
| `npm run create-admin` | Crear administrador |

## Verificación antes de commit

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
git diff --check
```

### Integración segura

La rama indicada por `DATABASE_URL_TEST` debe tener las migraciones ya aplicadas. El script no migra, no hace `drop`/`truncate` y rechaza el destino si coincide con `DATABASE_URL`. Crea un admin y curso únicos, ejecuta dos importaciones para comprobar certificado nuevo y conflicto, decide el conflicto y elimina únicamente esos datos mediante IDs rastreados.

```bash
# Interactivo: exige escribir YES
npm run test:integration

# Automatización explícitamente autorizada
INTEGRATION_TEST_CONFIRM=YES npm run test:integration
```

## Estrategia de ramas

- Las ramas `dev` y `test` de Neon deben permanecer separadas.
- Ningún script de pruebas de integración debe apuntar a Neon `dev`.

## Documentación adicional

- [`docs/DATA-MODEL-FUTURE.md`](docs/DATA-MODEL-FUTURE.md) — modelo aplicado de importación/auditoría y extensiones futuras
- [`docs/SECURITY-FUTURE.md`](docs/SECURITY-FUTURE.md) — controles previos a producción

## Stack

Nuxt 4, Nuxt UI / Tailwind 4, TypeScript, Neon, Drizzle (`neon-http`), Zod, Nuxt Auth Utils, bcryptjs, Vitest.
