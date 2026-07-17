# Seguridad futura — WayAcademyValidator

Este documento describe controles que **deben** implementarse antes de producción. El prototipo visual actual opera **sin** CAPTCHA ni límites de intentos.

## Controles obligatorios antes de producción

1. **CAPTCHA o Cloudflare Turnstile** en consultas públicas (código y cédula).
2. **Límite de intentos por IP** en endpoints de consulta pública.
3. **Registro de consultas públicas** (auditoría de acceso, sin filtrar datos sensibles en logs).
4. **Respuestas genéricas** cuando no existan resultados (evitar enumeración).
5. **Cifrado de la cédula** en reposo.
6. **Hash normalizado** de documento para búsqueda exacta (alineado con `normalizeDocument()`).
7. **Protección contra enumeración de documentos**.
8. **Validación estricta de archivos CSV** (tamaño, columnas, tipos, `course_id` vs curso seleccionado).

## Fail-closed en producción

La aplicación futura **debe fallar de forma segura** si las protecciones públicas no están configuradas en el entorno de producción.

- No crear un flag de configuración que permita desactivar accidentalmente CAPTCHA, rate limiting u otras protecciones en producción.
- Si faltan secretos/config de Turnstile (u equivalente) o de rate limiting en `NODE_ENV=production` / entorno Netlify de producción, el arranque o las rutas públicas deben rechazar la operación de forma explícita.

## Prototipo actual

En desarrollo y en el prototipo visual:

- Las consultas simuladas funcionan **sin** CAPTCHA.
- No hay límite de intentos.
- Los datos son mock en memoria (`useState`).
