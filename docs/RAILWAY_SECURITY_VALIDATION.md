# Validación de seguridad en Railway Production

Fecha: 2026-08-24

Proyecto: `avizor`

Servicio: `avizor`
Deployment: `d0120e18-9349-4fb5-8df4-9d94d4aa0393`

## Alcance y decisión

La validación y el despliegue se hicieron directamente en Production con autorización expresa. Se evitaron pruebas capaces de generar indisponibilidad: corte deliberado de PostgreSQL/TLS, ráfaga de 40 solicitudes y ensayo con varias réplicas.

**Decisión: NO.** La infraestructura aún no queda aprobada porque faltan los roles PostgreSQL de privilegio mínimo y el despliegue no está respaldado por un commit reproducible. Los controles técnicos indicados abajo sí fueron comprobados.

## Cambios aplicados

- Se aplicó `db/migrations/008_security_rate_limits.sql` en Production.
- Se configuraron TLS estricto, CA, nombre TLS, proxy Railway, secreto HMAC, token/actor interno y límites de caché/conexión.
- Se desplegó Next.js 15.5.23 desde el working tree validado.
- Se corrigió el fail-closed: Production rechaza `DATABASE_SSL_REJECT_UNAUTHORIZED=false` y también TLS desactivado.
- `DATABASE_TLS_SERVER_NAME` permite validar la identidad real del certificado de PostgreSQL SSL de Railway.

No se modificaron reglas agronómicas, umbrales, ScoreEngine, motores, textos funcionales, contratos, lógica climática ni límites existentes.

## Evidencia

| Control | Resultado | Evidencia |
|---|---|---|
| Deployment | PASS | `SUCCESS`; Next.js 15.5.23 |
| HTTPS y headers | PASS | HTTPS 200; redirección HTTP; HSTS, CSP, nosniff, Referrer-Policy y Permissions-Policy |
| PostgreSQL TLS | PASS | TLS 1.3, CA e identidad verificadas |
| Migración 008 | PASS | Tabla, PK compuesta, check e índice de expiración |
| JSON >32 KiB | PASS | `/api/consulta` respondió 413 |
| Zod estricto | PASS | Cuerpo vacío, campo extra y email inválido respondieron 400 |
| Consulta pública | PASS | Tandil/soja respondió 200 con 14 días; share token no se conservó en este informe |
| Logs | PASS limitado | Sin errores ni patrones evidentes de URL DB, token, CA o secreto HMAC |
| Suite local | PASS | 56/56 tests, TypeScript, ESLint y build |
| Dependencias | PASS | `npm audit`: 0 vulnerabilidades |

## Configuración confirmada

Se confirmó la presencia, sin revelar secretos, de `RATE_LIMIT_TRUSTED_PROXY=railway`, `RATE_LIMIT_HASH_SECRET`, TLS estricto, `DATABASE_CA`, `DATABASE_TLS_SERVER_NAME=localhost`, timeout de conexión, token/actor interno y límites de caché. La URL de runtime referencia el host privado de PostgreSQL. El TCP Proxy público permanece habilitado.

## Bloqueantes y pendientes

1. Crear y probar fuera de Production los roles `avizor_app` y `avizor_migrations`; hoy no existen y solo `postgres` conserva grants sobre `rate_limit_buckets`.
2. Cambiar la credencial de runtime a `avizor_app` y reservar `avizor_migrations` para migraciones.
3. Confirmar que runtime no puede ejecutar DDL ni administrar roles.
4. Publicar el estado desplegado en un commit revisado; un auto-deploy desde `main` puede revertirlo.
5. Verificar antifalsificación de `X-Real-IP` sin registrar IP en claro.
6. Probar límites exactos y atomicidad con dos o más réplicas en Preview/staging.
7. Probar fail-closed con una base o credencial descartable, no cortando Production.
8. Revisar en el panel retención/permisos de logs, alertas y separación de ambientes.
9. Evaluar y deshabilitar el TCP Proxy público si no es necesario para operación o recuperación.

## Próxima secuencia segura

Crear un Preview aislado, aplicar allí privilegio mínimo, migrar con `avizor_migrations`, arrancar con `avizor_app`, ejecutar concurrencia y fail-closed, y recién después promover credenciales/configuración a Production con rollback documentado.
