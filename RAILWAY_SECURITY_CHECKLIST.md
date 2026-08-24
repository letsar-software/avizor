# Checklist de seguridad para Railway

Fecha de preparación: 2026-08-24.

## Resultado de validación en Railway Production — 2026-08-24

La ejecución se realizó en **Production** por autorización expresa del usuario. Esta sección prevalece como estado real sobre los ítems de preparación que siguen debajo.

- [x] Deployment `d0120e18-9349-4fb5-8df4-9d94d4aa0393` finalizó en `SUCCESS` y ejecuta Next.js 15.5.23.
- [x] El dominio público responde por HTTPS y HTTP redirige a HTTPS.
- [x] HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy` están presentes.
- [x] Proxy confiable, secreto HMAC, token interno, actor interno, TLS estricto, CA y límites de caché quedaron configurados; los secretos no se imprimieron.
- [x] La aplicación usa la referencia privada de Railway para PostgreSQL.
- [x] PostgreSQL fue comprobado con TLS 1.3, validación de CA y nombre de certificado explícito.
- [x] Se aplicó `008_security_rate_limits.sql`; tabla, PK, check e índice de expiración existen.
- [x] Producción responde 413 a JSON mayor de 32 KiB y 400 a entradas inválidas.
- [x] Una consulta real de Tandil respondió 200 y atravesó rate limiter, PostgreSQL y ClimateProvider.
- [x] Los logs de arranque revisados no mostraron errores ni patrones evidentes de secretos.
- [ ] **Bloqueante:** `avizor_app` y `avizor_migrations` no existen; runtime continúa con la credencial PostgreSQL propietaria/superusuario.
- [ ] **Pendiente:** evaluar y deshabilitar el TCP Proxy público de PostgreSQL cuando exista una vía operativa segura.
- [ ] **No verificado:** antifalsificación de `X-Real-IP`; no se agregó logging sensible ni se agotó el límite en Production.
- [ ] **No verificado:** límites exactos bajo concurrencia/varias réplicas y fail-closed mediante corte real; se excluyeron por ser disruptivos.
- [ ] **Pendiente:** revisar retención, permisos y alertas de Railway desde el panel.
- [ ] **Riesgo operativo:** se desplegó desde un working tree sin commit; un auto-deploy posterior desde `main` puede reemplazarlo con código anterior.

Decisión de infraestructura: **NO APROBADA** hasta cerrar privilegio mínimo de PostgreSQL y asegurar la reproducibilidad del despliegue.

Fuentes primarias consultadas:

- [Railway: Public Networking — Specs & Limits](https://docs.railway.com/networking/public-networking/specs-and-limits)
- [Railway: PostgreSQL](https://docs.railway.com/databases/postgresql)
- [Railway: Private Networking](https://docs.railway.com/networking/private-networking)
- [Railway: Best Practices](https://docs.railway.com/overview/best-practices)

## VERIFICADO EN CÓDIGO

- [x] Rate limiting distribuido en PostgreSQL mediante `rate_limit_buckets`.
- [x] UPSERT atómico condicionado; no usa `SELECT count → INSERT`.
- [x] Ventanas: consultas públicas 20/h por IP; guardados 3/h por email; API empresarial 30/min por API key además de la cuota mensual.
- [x] Identidades almacenadas como HMAC-SHA-256, no IP/email en claro.
- [x] Limpieza oportunista de buckets expirados e índice sobre `expires_at`.
- [x] La aplicación solo lee `X-Real-IP` cuando `RATE_LIMIT_TRUSTED_PROXY=railway`.
- [x] No se utiliza `X-Forwarded-For` para identificar al cliente.
- [x] Sin configuración de proxy, secreto HMAC o PostgreSQL en producción, los endpoints protegidos fallan cerrados.
- [x] JSON limitado a 32 KiB antes de parsearlo.
- [x] Validación server-side estricta y centralizada.
- [x] TLS PostgreSQL verifica el certificado por defecto.
- [x] Producción rechaza `DATABASE_SSL_REJECT_UNAUTHORIZED=false`.
- [x] Headers HTTP defensivos configurados en `next.config.js`.

## REQUIERE VERIFICACIÓN EN RAILWAY

### HTTPS y proxy

- [ ] Confirmar que el dominio público fuerza HTTPS y que `X-Forwarded-Proto` llega como `https`. Railway documenta ese comportamiento, pero debe comprobarse en el deployment real.
- [ ] Confirmar con una petición controlada que Railway sobrescribe `X-Real-IP` con la IP remota y que un cliente no puede imponer otro valor.
- [ ] Mantener `RATE_LIMIT_TRUSTED_PROXY=railway` únicamente cuando el servicio reciba tráfico directamente del edge de Railway.
- [ ] Si se agrega Cloudflare u otro proxy, no reutilizar el modo Railway: implementar/verificar un modo específico que solo confíe headers después de restringir el acceso al origen.
- [ ] Confirmar `X-Railway-Request-Id` y correlacionarlo con logs sin registrar IP, email, tokens o cuerpos.

Prueba sugerida desde dos redes distintas:

1. Enviar un header `X-Real-IP` falso desde el cliente.
2. Registrar temporalmente solo el resultado anonimizado de `resolveClientIp` en Preview.
3. Confirmar que Railway entrega la IP real, no la enviada por el cliente.
4. Quitar el log temporal antes de producción.

### Variables de entorno

- [ ] `NODE_ENV=production`.
- [ ] `RATE_LIMIT_TRUSTED_PROXY=railway`.
- [ ] `RATE_LIMIT_HASH_SECRET`: aleatorio, largo, distinto por ambiente y fuera de Git.
- [ ] `DATABASE_URL`: credencial de `avizor_app`, no propietario/superusuario.
- [ ] Credencial separada para `npm run db:migrate` con rol `avizor_migrations`.
- [ ] `DATABASE_SSL=true` cuando corresponda al endpoint usado.
- [ ] `DATABASE_SSL_REJECT_UNAUTHORIZED=true`.
- [ ] `DATABASE_CA` cargada si el certificado no encadena al trust store del runtime.
- [ ] `AVIZOR_INTERNAL_TOKEN` largo, aleatorio y rotado.
- [ ] `AVIZOR_INTERNAL_ACTOR_ID` identifica de forma estable la credencial/despliegue.
- [ ] Ningún secreto usa prefijo `NEXT_PUBLIC_`.

### PostgreSQL y red privada

- [ ] Preferir `postgres.railway.internal`/la URL privada del servicio. Railway documenta que PostgreSQL es privado por defecto y que el acceso público requiere habilitar TCP Proxy.
- [ ] Confirmar que Public Access/TCP Proxy de PostgreSQL está deshabilitado en producción si no es necesario.
- [ ] Aplicar `db/operations/railway_least_privilege_roles.sql` primero en Preview.
- [ ] Verificar que `avizor_app` tiene DML solo en las tablas enumeradas y no puede ejecutar DDL ni gestionar roles.
- [ ] Verificar que `avizor_migrations` es la identidad que crea/posee objetos nuevos.
- [ ] Ejecutar `008_security_rate_limits.sql` antes de desplegar código que use el limiter.
- [ ] Comprobar el índice `rate_limit_buckets_expires_idx` y que la limpieza elimina ventanas vencidas.

### Límites y varias réplicas

- [ ] Configurar al menos dos réplicas en Preview y ejecutar ráfagas simultáneas contra ambas.
- [ ] Confirmar exactamente 20 respuestas no-429 para una IP dentro de una hora y 429 en las siguientes.
- [ ] Confirmar que otra IP dispone de su propio contador.
- [ ] Confirmar `Retry-After` en respuestas 429.
- [ ] Verificar que un body mayor de 32 KiB recibe 413 desde la aplicación o antes, nunca llega a la lógica climática.
- [ ] Revisar límites de tamaño/tiempo del edge; no asumir que sustituyen el límite de aplicación.

### Logs, secretos y operación

- [ ] Revisar retención y permisos de logs en Railway.
- [ ] Confirmar ausencia de emails, tokens, cookies, Authorization y cuerpos completos.
- [ ] Alertar por incrementos de 401, 403, 413, 429 y 503.
- [ ] Alertar por cambios de reglas/cultivos y conservar `request_id`/actor auditado.
- [ ] Rotar credenciales después de aplicar roles y guardar un procedimiento de rollback.
- [ ] Verificar que Preview y Production usan bases, secretos y redes privadas separados.
