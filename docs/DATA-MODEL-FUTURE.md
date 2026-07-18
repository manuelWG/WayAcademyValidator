# Modelo de datos futuro (schema definido en 3B, no aplicado)

Este documento describe el modelo de importación/auditoría.

**Fase 3B** añade los exports `pgTable()` de `certificates`, `import_batches`,
`import_rows` y `audit_conflicts` bajo `server/database/schema/`, junto a seis
enums SQL, y genera una migración aditiva (`0001_*`) que **no se aplica** en 3B.
Importaciones, auditoría, certificados y consulta pública **siguen en mock**: el
schema y las primitivas de cifrado existen, pero no hay flujo operativo.

Tablas reales aplicadas hoy: `admin_users`, `courses`. El resto queda definido en
schema/migración generada pero sin aplicar a Neon.

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

Añade `source_import_row_id` (uuid, `NOT NULL`, unique, FK `ON DELETE RESTRICT` a
`import_rows.id`): trazabilidad de cada certificado hasta su fila de origen. Un
lote no puede perder su procedencia, y borrar filas fuente queda bloqueado.
También `document_auth_tag` (bytea, 16 bytes) del cifrado AES-GCM.

Índices: unique código normalizado, unique issue id, unique source row, index
HMAC, index course_id.

El documento original **nunca** aparece en columnas text, JSONB, logs ni errores:
se guarda como `document_ciphertext` + `document_nonce` (12 bytes) +
`document_auth_tag` (16 bytes) + `document_key_version` (integer). La forma
normalizada tampoco se persiste; la búsqueda usa `document_lookup_hmac`.

## import_batches / import_rows

`import_batches`: trazabilidad de lotes CSV (nombre archivo, hash SHA-256, admin,
contadores por estado, estado del lote) con soporte de **intentos** y **retries**
encadenados. `attempt_number` inicia en 1; un intento `failed` puede originar un
hijo con `attempt_number = parent + 1` mediante FK compuesta self-reference
`(retry_of_batch_id, course_id, file_hash)` → `(id, course_id, file_hash)`. Un
índice unique parcial impide más de un intento activo (`pending`/`processing`/
`paused`) por `(course_id, file_hash)`. Los estados terminales y contadores se
imponen por CHECK, incluido `failed` preinicio (sin progreso) vs `failed` parcial.

`import_rows`: filas clasificadas (`new` \| `unchanged` \| `conflict` \|
`critical_conflict` \| `error`; `NULL` = staging sin clasificar). Preserva los
ocho strings exactos del parser en `raw_without_document` (sin el documento) y el
documento cifrado por fila con AAD de contexto `import-row-document`.
`matched_certificate_id` es un certificado preexistente hallado por matching, no
el certificado producido por la fila. `changed_fields` e `issue_codes` son arrays
de enums `NOT NULL` sin elementos null.

## audit_conflicts

Conflictos de snapshot/identidad vs entrantes; estados `pending` \| `accepted` \|
`rejected` y riesgo `medium` \| `high` \| `critical`. Un CHECK discriminado
null-safe impone dos formas excluyentes y alineadas con 3A: conflicto normal
(`changed_fields` no vacío, `issue_codes` vacío, un certificado + snapshot) o
`IDENTITY_COLLISION` (`changed_fields` vacío, `issue_codes` exactamente
`['IDENTITY_COLLISION']`, dos certificados distintos por código e issue id).
Aceptar/rechazar **nunca** muta certificados automáticamente (fase futura).

## public_query_logs

Auditoría de consultas públicas (sin filtrar documentos completos en logs).

## Protección de documento (primitivas disponibles en 3B, no integradas)

- AES-256-GCM del original: `document_ciphertext`, `document_nonce` (12 bytes),
  `document_auth_tag` (16 bytes) y `document_key_version` (integer, `1..2147483647`).
- AAD determinista de 46 bytes ligado a purpose (`certificate-document` /
  `import-row-document`), UUID del registro y versión de clave: impide reutilizar
  ciphertext entre staging y certificados, entre registros o cambiar la versión.
- HMAC-SHA-256 de búsqueda con clave **independiente**; `normalizeDocument()`
  antes del HMAC; salida lowercase hex de 64. Normalizado vacío se rechaza para
  certificados; staging guarda HMAC null.
- Al convertir una fila `new` en certificado (3D), se descifra con el contexto de
  la fila y se **recifra** con el contexto del certificado; nunca se copia el
  ciphertext/nonce/tag directamente.
- Claves server-only (`server/security/`), lazy y fail-closed:
  `DOCUMENT_ENCRYPTION_KEY`, `DOCUMENT_ENCRYPTION_KEY_VERSION`,
  `DOCUMENT_LOOKUP_HMAC_KEY` (no obligatorias para build/tests).
