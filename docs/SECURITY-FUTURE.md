# Seguridad futura — WayAcademyValidator

Este documento describe controles que **deben** implementarse antes de producción.

## Estado actual

- Autenticación administrativa y cursos usan Neon + sesiones selladas (`nuxt-auth-utils`).
- La consulta pública **aún no** está en producción y permanece mock.
- Importación y auditoría ya usan backend real. Las primitivas server-only de
  cifrado/HMAC en `server/security/` y el schema persistente están integrados al
  staging, creación de certificados y DTOs administrativos enmascarados.
- Modelo de cifrado/HMAC: ver [`DATA-MODEL-FUTURE.md`](DATA-MODEL-FUTURE.md).
- Claves `DOCUMENT_ENCRYPTION_KEY`, `DOCUMENT_ENCRYPTION_KEY_VERSION` y
  `DOCUMENT_LOOKUP_HMAC_KEY`: server-only, lazy y fail-closed. No se leen ni
  validan al importar módulos, hacer build o ejecutar tests; solo al pedir
  material criptográfico. Son obligatorias para importaciones reales, pero no
  para build ni tests unitarios.
- `app/` y `shared/` no importan `server/security` ni `node:crypto`.

## Controles obligatorios antes de producción

1. **CAPTCHA o Cloudflare Turnstile** en consultas públicas (código y cédula).
2. **Límite de intentos por IP** en endpoints de consulta pública.
3. **Registro de consultas públicas** (auditoría de acceso, sin filtrar datos sensibles en logs).
4. **Respuestas genéricas** cuando no existan resultados (evitar enumeración).
5. **Cifrado de la cédula** en reposo (AES-GCM): implementado para importaciones;
   pendiente integrar la consulta pública real.
6. **Hash normalizado** de documento para búsqueda exacta (HMAC-SHA-256 +
   `normalizeDocument()`): implementado para persistencia/matching administrativo.
7. **Protección contra enumeración de documentos**.
8. **Validación estricta de archivos CSV** (tamaño, columnas, tipos, `course_id`
   vs curso seleccionado): implementada en el backend administrativo.
9. **Rate limiting / lockout** en login administrativo (no implementado en fase 2).

## Fail-closed en producción

La aplicación futura **debe fallar de forma segura** si las protecciones públicas no están configuradas en el entorno de producción.

- No crear un flag de configuración que permita desactivar accidentalmente CAPTCHA, rate limiting u otras protecciones en producción.
- Si faltan secretos/config de Turnstile (u equivalente) o de rate limiting en producción, el arranque o las rutas públicas deben rechazar la operación de forma explícita.
- `NUXT_SESSION_PASSWORD` y `DATABASE_URL` son obligatorios para operaciones admin reales; no reutilizar valores ficticios de CI.

## Datos mock restantes

La consulta pública de certificados continúa en memoria (`useState`) y está fuera
del alcance del backend real de importación/auditoría. Los certificados creados
por importaciones reales aún no se muestran en esa consulta.
