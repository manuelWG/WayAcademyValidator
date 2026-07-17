# WayAcademyValidator

Prototipo visual navegable para validar públicamente certificados académicos importados desde Moodle (CSV/SQL). En esta etapa todo el procesamiento usa **datos simulados** con un store mock (`useState`); no hay base de datos, autenticación real ni parseo CSV.

## Requisitos

- Node.js 20+
- npm

## Arranque

```bash
npm install
npm run dev
```

Abre la URL que indique Nuxt (típicamente `http://localhost:3000`).

## Credenciales de demostración (admin)

| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | `demo1234` |

Acceso: `/admin/login`

## Datos de prueba (consulta pública)

### Códigos de certificado válidos (cursos publicados)

- `WAY-LDR-2025-0042` — María Fernanda Rojas · Liderazgo estratégico
- `WAY-AGL-2026-0033` — Julián Esteban Pérez · Gestión de proyectos ágiles
- `WAY-COM-2025-0155` — Ana Lucía Vargas · Comunicación efectiva

Código de curso **no publicado** (no aparece en consulta pública):

- `WAY-CUM-2026-0001`

### Cédulas con múltiples certificados

- `52.334.891` — María Fernanda Rojas (varios cursos)
- `1.024.556.778` — Carlos Andrés Mejía
- `43.221.009` — Ana Lucía Vargas

Cédula sin resultados: `00.000.000`

## Arquitectura del prototipo

```
Páginas/Componentes → Composables → Repositorios → useState (store mock) ← seeds
```

Las páginas **no** importan `app/mock/` directamente. Las mutaciones admin (crear curso, publicar, importar, decidir conflictos) persisten durante la navegación SPA.

### Fechas

| Campo | Significado |
|-------|-------------|
| `issuedAt` | Expedición en Moodle (`timecreated`) |
| `importedAt` | Incorporación a WayAcademyValidator |
| `verifiedAt` | Momento de la consulta pública actual (no persistente) |

## Stack de esta etapa

- Nuxt 4
- Vue 3
- TypeScript
- Nuxt UI (Tailwind CSS 4)

## Stack definitivo previsto (fases posteriores)

- Neon PostgreSQL
- Drizzle ORM
- Zod
- Nuxt Auth Utils
- bcryptjs
- Papa Parse
- Netlify

Ver también [`docs/SECURITY-FUTURE.md`](docs/SECURITY-FUTURE.md).

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run typecheck` | Comprobación de tipos |
