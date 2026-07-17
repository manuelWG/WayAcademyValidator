# Modelo de datos futuro (no migrado en fase 2)

Este documento describe tablas previstas para fases posteriores.
**Drizzle Kit no debe descubrir estas tablas** en la fase 2: no existen exports `pgTable()` para ellas bajo `server/database/schema/`.

Tablas activas hoy: `admin_users`, `courses`.

## certificates

Snapshot histórico por certificado (sin tabla mutable de participantes).

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | default en BD |
| `course_id` | uuid FK → courses | integridad referencial |
| `certificate_code` | text | original |
| `certificate_code_normalized` | text UNIQUE | trim; case-sensitive |
| `moodle_certificate_issue_id` | bigint UNIQUE | |
| `moodle_certificate_id` | bigint | |
| `moodle_course_id` | bigint | |
| `moodle_user_id` | bigint | |
| `participant_name` | text | snapshot |
| `document_ciphertext` | bytea | AES-GCM |
| `document_nonce` | bytea | |
| `document_key_version` | integer | rotación |
| `document_lookup_hmac` | text | HMAC-SHA-256 del normalizado |
| `issued_at` | timestamptz | |
| `imported_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

**Sin** columna `public_visible`: se deriva de `courses.is_published`.

Índices (al implementar importación): unique código normalizado, unique issue id, index HMAC, index course_id.

## import_batches / import_rows

Trazabilidad de lotes CSV (nombre archivo, hash, admin, contadores, estado) y filas clasificadas (`new` \| `unchanged` \| `updatable` \| `critical_conflict` \| `error`).

## audit_conflicts

Conflictos de identidad/snapshot vs entrantes; estados `pending` \| `accepted` \| `rejected`. Aceptar no aplica el cambio automáticamente (fase futura).

## public_query_logs

Auditoría de consultas públicas (sin filtrar documentos completos en logs).

## Protección de documento (fase correspondiente)

- AES-256-GCM del original
- HMAC-SHA-256 de búsqueda con clave distinta
- `normalizeDocument()` antes del HMAC
- Claves: `DOCUMENT_ENCRYPTION_KEY`, `DOCUMENT_LOOKUP_HMAC_KEY` (no obligatorias en fase 2)
