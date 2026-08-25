# Auditoría integral de seguridad de Avizor

Fecha: 2026-08-24

Alcance: repositorio completo en su estado actual (`.`)

Método: revisión estática offline, dos revisiones independientes, validación manual de flujos, tests locales y `npm audit`
Cobertura: parcial respecto de infraestructura productiva; completa para las superficies de código servidor identificadas. No se atacó producción ni servicios externos.

## Resumen ejecutivo

Decisión de publicación: **NO**.

El código presenta buenas bases: SQL parametrizado, tokens compartibles generados con `crypto.randomUUID()`, hosts externos fijos, renderizado React sin HTML inseguro y autenticación obligatoria en todas las rutas administrativas. Se corrigieron cinco límites concretos y se agregaron headers HTTP defensivos.

No se recomienda publicar todavía porque no existe rate limiting compartido y verificable en producción para los endpoints públicos, y `npm audit` mantiene siete vulnerabilidades altas, incluida la versión directa de Next.js 14. Resolver Next exige una migración mayor que no se aplicó automáticamente. También falta verificar en el entorno real los grants/roles PostgreSQL y la cadena de proxies confiables de Railway.

Resultado validado del escaneo: 1 HIGH, 3 MEDIUM y 2 LOW. Después de los cambios: cuatro hallazgos corregidos, uno mitigado parcialmente y uno corregido con riesgo de configuración residual.

## Vulnerabilidades críticas

No se validaron vulnerabilidades CRITICAL.

## Vulnerabilidades altas

### AVZ-SEC-001 — Consumo público de recursos sin límites

- Severidad: HIGH
- Archivo/línea: `app/api/public/consultas/route.ts:5`, `app/api/consulta/route.ts:44`, `lib/localidades/normalize.ts:82`, `lib/climate/open-meteo-adapter.ts:20`, `lib/climate/cache.ts:3`, `lib/consultas/repository-v2.ts:6`
- Descripción: un cliente no autenticado puede generar geocodificación, consulta climática, evaluación y persistencia sin cuota ni límite de concurrencia.
- Vector de ataque: ráfagas con localidades diferentes hacia los POST públicos.
- Impacto: agotamiento de Open-Meteo, pool PostgreSQL, almacenamiento y memoria del proceso.
- Evidencia: no existe middleware o servicio compartido de rate limiting antes de ejecutar el pipeline.
- Corrección aplicada: se limitó el caché climático a 500 entradas configurables y se eliminan expiradas antes de insertar.
- Estado: **MITIGADO PARCIALMENTE / ABIERTO**. Falta un rate limiter distribuido. Debe definirse qué proxy de Railway puede establecer la IP y persistir contadores en PostgreSQL/Redis. No se implementó un `Map` por IP porque sería local por réplica y evadible; tampoco se confió ciegamente en `X-Forwarded-For`.

## Vulnerabilidades altas de dependencias

### AVZ-DEP-001 — Next.js 14 y toolchain con advisories altos

- Severidad: HIGH
- Archivo: `package.json`, `package-lock.json`
- Descripción: `npm audit` informa siete paquetes afectados: `next`, `eslint-config-next`, `@next/eslint-plugin-next`, `glob`, `brace-expansion`, `js-yaml` y una copia transitiva de `postcss`.
- Vector/impacto: incluye advisories de DoS, SSRF en determinadas configuraciones, request smuggling, cache poisoning y herramientas de desarrollo vulnerables.
- Evidencia: `npm audit --json`, ejecutado después de actualizar PostCSS: 0 critical, 7 high.
- Corrección aplicada: `postcss` directo actualizado a `^8.5.23`; `nanoid` quedó en 3.3.18 por resolución del lockfile.
- Estado: **ABIERTO**. npm propone Next/eslint-config-next 16.3.2, un cambio mayor potencialmente incompatible. Requiere migración planificada y QA.

## Vulnerabilidades medias

### AVZ-SEC-002 — UUID interno aceptado como capacidad pública

- Severidad: MEDIUM
- Archivo/línea: `app/api/public/consultas/[id]/route.ts:4`, `lib/consultas/interactions-v2.ts:4`, `lib/consultas/service.ts:49`
- Descripción: las rutas aceptaban `id` de base de datos o `share_token` indistintamente.
- Vector: obtener un UUID por respuesta, soporte, telemetría o exportación y usarlo para leer o adjuntar interacciones.
- Impacto: el identificador interno adquiría privilegios de lectura/escritura pública.
- Prueba: los queries contenían `id::text=$1 or share_token=$1`.
- Corrección aplicada: las rutas públicas ahora consultan exclusivamente `share_token=$1`.
- Estado: **CORREGIDO**. Test: “las rutas públicas autorizan exclusivamente mediante share_token”.

### AVZ-SEC-003 — Carrera en cuota mensual de API keys

- Severidad: MEDIUM
- Archivo/línea: `lib/security/api-keys.ts:5`, `app/api/v1/consultas/route.ts:7`
- Descripción: solicitudes concurrentes podían superar el límite entre el conteo y el registro posterior.
- Vector: ráfaga paralela con una API key válida cerca del cupo.
- Impacto: consumo por encima de la cuota comercial/defensiva.
- Prueba: el uso se insertaba en `finally`, después del trabajo.
- Corrección aplicada: transacción, bloqueo `FOR UPDATE OF k` y reserva de `api_uso` antes de ejecutar; al finalizar se actualiza estado y duración.
- Estado: **CORREGIDO POR DISEÑO Y TEST ESTÁTICO**. Falta una prueba de concurrencia contra PostgreSQL real antes del deploy.

### AVZ-SEC-004 — PostgreSQL sin validación de certificado

- Severidad: MEDIUM
- Archivo/línea: `lib/db/postgres.ts:4-25`
- Descripción: SSL usaba `rejectUnauthorized:false`.
- Vector: interceptar o redirigir la conexión a PostgreSQL.
- Impacto: robo de credenciales/datos o manipulación de consultas y reglas.
- Corrección aplicada: validación habilitada por defecto, CA configurable con `DATABASE_CA`; `.env.example` documenta el modo seguro.
- Estado: **CORREGIDO CON OBSERVACIÓN**. `DATABASE_SSL_REJECT_UNAUTHORIZED=false` queda como escape explícito; no debe usarse en producción.

## Vulnerabilidades bajas

### AVZ-SEC-005 — Actor de auditoría falsificable

- Severidad: LOW
- Archivo/línea: `lib/security/internal-auth.ts:4-10`, rutas administrativas de reglas/cultivos.
- Descripción: `x-actor-id` controlado por el cliente se persistía como identidad auditada.
- Vector: poseedor del token interno envía un actor falso.
- Impacto: pérdida de atribución forense.
- Corrección aplicada: el actor se obtiene de `AVIZOR_INTERNAL_ACTOR_ID`, asociado a la credencial/despliegue, y se ignora el header.
- Estado: **CORREGIDO**.

### AVZ-SEC-006 — Datos personales en fallbacks de logs

- Severidad: LOW
- Archivo/línea: `lib/consultas/interesados.ts:5`, `lib/consultas/repository.ts:40,103,125,149`, `lib/consultas/logs.ts:12`
- Descripción: sin base configurada se registraban objetos completos con email, sesión, consentimiento y resultados.
- Vector: entorno mal configurado y lector de logs con menos privilegios que la base.
- Impacto: expansión de exposición y retención de datos personales.
- Corrección aplicada: logs reducidos a metadatos booleanos, conteos y datos operativos no sensibles.
- Estado: **CORREGIDO**.

## Buenas prácticas ya implementadas

- SQL parametrizado en los accesos revisados; no se validó SQL Injection.
- `share_token` generado con `crypto.randomUUID()` y columna única.
- Tokens internos comparados con `timingSafeEqual`.
- API keys almacenadas como SHA-256, con estado, revocación y expiración.
- URLs de Open-Meteo definidas por el servidor; inputs codificados con `URLSearchParams`; no se validó SSRF.
- Timeouts en geocodificación y clima.
- React escapa textos y no se encontró `dangerouslySetInnerHTML`/`innerHTML`; no se validó XSS.
- Reglas evaluadas declarativamente; no se encontró `eval`, `Function` ni ejecución de comandos.
- Errores públicos normalizados sin stacks ni SQL.
- Rutas administrativas verifican bearer token del lado servidor.
- Consultas usan UUID criptográficos; no hay IDs incrementales públicos.

## Cambios realizados

- Acceso público exclusivamente por `share_token`.
- Reserva atómica de cuota mensual para API keys.
- TLS PostgreSQL seguro por defecto con CA configurable.
- Identidad de auditoría derivada de configuración confiable.
- Redacción de payloads en logs de fallback.
- Caché climático con capacidad máxima configurable.
- Headers: CSP `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, nosniff, Referrer-Policy, Permissions-Policy y HSTS.
- PostCSS directo actualizado a 8.5.23.
- Configuración ESLint reproducible.
- Siete tests de regresión de seguridad.

No se modificaron reglas agronómicas, umbrales, ScoreEngine, textos funcionales ni formatos de respuesta de API.

## Cambios recomendados pero no aplicados

1. Implementar rate limiting compartido: 20 consultas/hora por IP y 3 guardados/hora por email, con identidad IP obtenida únicamente de un proxy Railway verificado.
2. Definir límites explícitos del body antes de `request.json()` y esquemas server-side centralizados para todos los endpoints (longitudes, arrays, fechas, email, UUID y enums).
3. Migrar Next.js/eslint-config-next a una versión corregida mediante rama dedicada, revisión de breaking changes y QA.
4. Reemplazar el único token interno por credenciales individualizadas con scopes (lectura, simulación, edición y publicación de reglas).
5. Añadir workflow de doble aprobación para promover reglas a `vigente`.
6. Configurar retención, acceso y redacción centralizada de logs.
7. Añadir monitoreo y alertas por 401/403/429, cambios administrativos y fallos repetidos de proveedores.

## Dependencias vulnerables

Resultado posterior a la actualización compatible:

| Severidad | Cantidad |
|---|---:|
| Critical | 0 |
| High | 7 |
| Moderate | 0 |
| Low | 0 |

La clasificación de npm eleva paquetes transitivos por el advisory más severo de su cadena. La exposición real de cada advisory debe verificarse durante la migración, pero la versión directa de Next está dentro de rangos vulnerables y bloquea la recomendación de publicación.

## Seguridad Supabase/PostgreSQL

- El proyecto usa PostgreSQL directo (`pg`), no Supabase.
- No se encontraron consultas concatenando input externo.
- Las migraciones no crean roles mínimos, `GRANT`/`REVOKE` ni RLS. El estado real de permisos no puede deducirse del repo.
- Recomendación: usuario de aplicación sin DDL, sin creación de roles y con permisos por tabla; usuario de migraciones separado.
- Verificar que `reglas_agronomicas`, `api_keys`, `auditoria` y tablas administrativas no sean accesibles por roles públicos.
- TLS ahora verifica certificados por defecto; cargar la CA de Railway en `DATABASE_CA` si el trust store no basta.

## Seguridad de APIs

| Endpoint | Método | Auth | Validación | Rate limit | Riesgos/estado |
|---|---|---|---|---|---|
| `/api/consulta` | POST | Pública | Parcial | No | Consumo sin límites; endpoint legado |
| `/api/public/consultas` | POST | Pública | Parcial | No | Consumo sin límites |
| `/api/public/consultas/[id]` | GET | `share_token` | Parametrizado | No | UUID alternativo corregido |
| `/api/public/consultas/[id]/observaciones` | POST | `share_token` | Débil | No | Falta longitud/enums/rate limit |
| `/api/public/consultas/[id]/feedback` | POST | `share_token` | Débil | No | Falta longitud/enums/rate limit |
| `/api/public/consultas/[id]/guardar` | POST | `share_token` | Email básica | No | Falta 3/h por email |
| `/api/interesados` | POST | Pública | Parcial | No | Spam/payloads |
| `/api/observaciones` | POST | Pública | Parcial | No | Spam/arrays y strings sin máximos |
| `/api/feedback` | POST | Pública | Parcial | No | Spam/arrays y strings sin máximos |
| `/api/localidades` | GET | Pública | q 2–100 | No | Outbound geocoding; respuesta limitada a 8 |
| `/api/v1/consultas` | POST | API key | Parcial | Cuota mensual atómica | Falta límite de ráfaga |
| `/api/admin/consultas` | GET | Bearer interno | N/A | No | Token único, sin scopes |
| `/api/admin/feedback` | GET | Bearer interno | N/A | No | Token único, datos personales |
| `/api/admin/observaciones` | GET | Bearer interno | N/A | No | Token único |
| `/api/admin/simulaciones` | POST | Bearer interno | Parcial | No | Puede consumir proveedor |
| `/api/admin/reglas` | GET | Bearer interno | N/A | No | Sin scopes |
| `/api/admin/reglas/[id]` | GET/PATCH | Bearer interno | PATCH débil | No | Definición JSON sin esquema/aprobación |
| `/api/admin/cultivos` | GET/POST | Bearer interno | Débil | No | Sin scopes |
| `/api/admin/cultivos/[id]` | PATCH | Bearer interno | Débil | No | Sin scopes |

CSRF: las rutas protegidas usan headers bearer/API key, no cookies adjuntadas automáticamente; no se validó un vector CSRF clásico. CORS: no se configuran credenciales cross-origin ni `Access-Control-Allow-Origin:*`. Para navegación same-origin, los endpoints públicos siguen disponibles a cualquier cliente y requieren controles antiabuso.

## Seguridad panel admin

- No se encontró una UI administrativa separada en el repositorio; sí existen APIs admin.
- Todas las rutas admin revisadas llaman `requireInternalAuth` antes de leer o mutar.
- Un usuario sin token no puede modificar reglas según el flujo de código.
- Riesgo residual: un único token concede todas las operaciones y no existen roles/scopes.
- `definicion` de reglas se almacena como JSON y se evalúa con operadores declarativos; no hay ejecución dinámica.
- La base restringe `estado`, pero falta validar el esquema completo de `definicion` y separar edición de publicación.

## Tests de seguridad agregados

Archivo: `tests/security.test.ts`.

- Rechazo del UUID interno como capacidad pública.
- Presencia de reserva/bloqueo de cuota antes del trabajo.
- Verificación TLS segura por defecto.
- Rechazo de `x-actor-id` falsificado.
- Expulsión del caché al alcanzar capacidad.
- Ausencia de logging de objetos completos.
- Headers anti-clickjacking/nosniff/HSTS.

Ejecución: 43/43 tests pasan.

## Riesgos residuales

- Sin rate limiting distribuido ni límite de ráfaga/concurrencia.
- Siete dependencias con severidad alta según npm.
- Validación server-side incompleta y sin límite explícito de body en varios endpoints.
- Permisos reales de PostgreSQL no verificados.
- Token administrativo único, sin roles ni expiración de sesión.
- No se ejecutó prueba de concurrencia de cuota contra PostgreSQL real.
- No se probó el despliegue Railway ni los headers a través de su proxy.
- El escape `DATABASE_SSL_REJECT_UNAUTHORIZED=false` debe prohibirse en producción.

## Checklist OWASP

| Categoría | Estado | Evidencia |
|---|---|---|
| Broken Access Control | Parcial | UUID público corregido; token admin aún sin scopes |
| Cryptographic Failures | Parcial | TLS corregido; falta validar configuración real |
| Injection | Conforme en código revisado | SQL parametrizado; sin eval/shell; React escapa texto |
| Insecure Design | Pendiente | Sin rate limiting compartido y aprobación de reglas |
| Security Misconfiguration | Parcial | Headers agregados; grants/proxy no verificados |
| Vulnerable and Outdated Components | No conforme | 7 high en npm audit |
| Identification and Authentication Failures | Parcial | Bearer/API keys válidos; token admin único |
| Software and Data Integrity Failures | Parcial | Reglas declarativas; falta flujo reforzado de publicación |
| Security Logging and Monitoring Failures | Parcial | Actor/logs corregidos; falta monitoreo operativo |
| SSRF | Conforme en código revisado | Hosts Open-Meteo fijos, parámetros codificados |

## Verificación ejecutada

| Comando | Resultado |
|---|---|
| `npx tsx --test tests/security.test.ts` | PASS, 7/7 |
| `npm test` | PASS, 43/43 |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS, sin warnings/errores |
| `npm run build` | PASS, 31 páginas/rutas generadas |
| `npm audit --json` | FAIL de política: 7 high, 0 critical |

## Conclusión

**¿Considerás seguro publicar Avizor en Internet en su estado actual?**

**NO**.

Antes de publicar deben resolverse como mínimo el rate limiting distribuido, la migración fuera de las versiones vulnerables de Next.js y la validación de permisos/TLS/proxy en Railway. Las correcciones aplicadas mejoran límites concretos sin alterar la lógica agronómica ni los contratos funcionales.

## Cierre de bloqueantes — 2026-08-24

Esta sección conserva la auditoría original y registra el trabajo posterior de cierre. No se repitió el escaneo integral.

### RATE LIMITING

Estado: **IMPLEMENTADO EN CÓDIGO / REQUIERE VERIFICACIÓN EN RAILWAY**.

Implementación:

- PostgreSQL compartido mediante `rate_limit_buckets` (`008_security_rate_limits.sql`).
- UPSERT condicionado atómico por `scope + identity_hash + window_start`; no usa `SELECT count → INSERT`.
- 20 consultas/hora por IP en `/api/consulta` y `/api/public/consultas`.
- 3 guardados/hora por email en `/api/interesados` y `/api/public/consultas/[id]/guardar`.
- Ráfaga empresarial: 30 solicitudes/minuto por API key, adicional a la cuota mensual existente.
- Identidad IP centralizada: solo `X-Real-IP` válido cuando `RATE_LIMIT_TRUSTED_PROXY=railway`; `X-Forwarded-For` se ignora.
- IP/email se almacenan como HMAC-SHA-256 con `RATE_LIMIT_HASH_SECRET`.
- En producción falla cerrado si faltan proxy confiable, secreto HMAC o PostgreSQL.
- 429 conserva el formato de error y agrega `Retry-After`.
- Limpieza de ventanas expiradas e índice por `expires_at`.

Tests:

- Dentro/fuera del límite, identidades separadas, ventanas separadas, email, concurrencia 40→20 aceptadas/20 rechazadas, SQL atómico, resolución Railway y header 429.
- No existe PostgreSQL local/test ni `DATABASE_URL` en el entorno; la prueba concurrente real queda en Railway Preview.

Riesgo residual:

- Confirmar que Railway sobrescribe `X-Real-IP` y que el tráfico llega directamente desde su edge.
- Ejecutar prueba multirréplica contra PostgreSQL real antes de producción.

### PAYLOAD LIMITS

Estado: **CERRADO EN CÓDIGO**.

Implementación:

- Parser streaming compartido con máximo global de 32 KiB.
- Verifica `Content-Length` cuando existe y cuenta bytes reales al leer el stream.
- Cancela lectura y devuelve 413 antes de `JSON.parse` al superar el límite.
- Aplicado a todos los POST/PATCH actuales, públicos, empresariales y administrativos.

Tests:

- Helper y endpoint público devuelven 413; el cuerpo no alcanza la lógica climática.

Riesgo residual:

- Confirmar en Railway que el edge no transforma el comportamiento; el límite de aplicación sigue siendo autoritativo.

### VALIDACIÓN SERVER-SIDE

Estado: **CERRADO PARA LOS ENDPOINTS ACTUALES**.

Implementación:

- Zod centralizado en `lib/security/validation.ts`.
- Esquemas estrictos para consultas legacy/v2, interesados, guardado, observaciones, feedback, cultivos y reglas admin.
- Máximos explícitos: localidad 120, email 254, sesión 128, texto libre 2000, cultivar/lote 120, arrays acotados.
- Fechas, UUID, emails, enums, números finitos/rangos y campos adicionales validados.
- Los objetos SQL continúan construyéndose con columnas permitidas explícitamente.
- Definición de reglas limitada a variables, agregadores y operadores soportados; `dias_con_condicion` exige subcondición; `between` exige un par ordenado.
- Las cuatro definiciones v2 actuales de la migración 007 pasan el esquema sin cambios.

Tests:

- Localidad larga, email inválido, UUID inválido, enum inválido, mass assignment y definición inválida rechazados.
- Compatibilidad verificada con todas las definiciones vigentes codificadas en migraciones.

Riesgo residual:

- Si se agrega un nuevo campo u operador, debe actualizarse el esquema y su test en la misma migración.

### POSTGRESQL

Estado: **CERRADO EN CÓDIGO / OPERACIÓN PENDIENTE**.

Implementación:

- Runtime y script de migraciones verifican certificados por defecto.
- Producción falla cerrada si `DATABASE_SSL_REJECT_UNAUTHORIZED=false`.
- `DATABASE_CA` soporta PEM configurado como variable de entorno.
- Runbook `db/operations/railway_least_privilege_roles.sql` con roles separados `avizor_app` y `avizor_migrations` y grants por tabla/operación.
- No se crearon contraseñas, no se transfirió ownership y no se tocó la base real.

Tests:

- Configuración TLS insegura rechazada en producción y permitida únicamente para desarrollo explícito.
- Typecheck/build validan runtime y migrador; no hubo base local para integración.

Riesgo residual:

- Aplicar roles y migración 008 en Preview, probar DML/DDL denegado y luego repetir en Production.
- Confirmar CA y preferir red privada `*.railway.internal` sin TCP Proxy público.

### DEPENDENCIAS

Estado: **ABIERTO — PLAN PREPARADO**.

Plan:

- `NEXT_SECURITY_MIGRATION.md` documenta los siete paquetes, versiones, advisories, alcance y rollback.
- Mínima segura identificada al 2026-08-24: Next.js 15.5.21 + eslint-config-next 15.5.21, conservando inicialmente React 18.
- No se ejecutó la migración por restricción expresa.
- Next anunció otra publicación de seguridad para 2026-08-26; recalcular la versión mínima antes de migrar/publicar.

Riesgo residual:

- `npm audit`: 7 HIGH, 0 CRITICAL. El App Router hace relevante al menos la familia de DoS/RSC de Next en runtime.
- Hasta migrar y repetir `npm audit`, este punto bloquea publicación.

### Resultado actualizado de verificación

| Comando | Resultado |
|---|---|
| `npm test` | PASS — 56/56 |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS — sin warnings/errores |
| `npm run build` | PASS — 31 rutas/páginas |
| `npm audit` | FAIL de política — 7 HIGH, 0 CRITICAL |
| Concurrencia unitaria | PASS — límite 20 respetado con 40 operaciones simultáneas |
| Concurrencia PostgreSQL real | NO EJECUTADA — no hay DB de test disponible |

### Decisión de publicación actualizada

**¿Considerás seguro publicar Avizor en Internet?**

**NO**.

El código queda preparado para una reevaluación, pero no corresponde marcar `SÍ` mientras Next.js mantenga vulnerabilidades HIGH relevantes al runtime y no se hayan verificado el proxy/IP, la migración 008, los roles mínimos y la atomicidad multirréplica en Railway Preview.

## Migración de seguridad de Next.js — 2026-08-24

### Alcance ejecutado

- Next.js migrado de 14.2.35 a 15.5.23 Maintenance LTS; React/ReactDOM permanecen en 18.
- `eslint-config-next` y `@next/eslint-plugin-next` alineados en 15.5.23.
- Copias transitivas vulnerables sustituidas por PostCSS 8.5.26, Sharp 0.35.3, `brace-expansion` 1.1.18/5.0.9 y `js-yaml` 4.3.1.
- No se usó `npm audit fix --force`.
- Cambios de compatibilidad limitados a `params` asíncronos, ESLint CLI, target ES2017 y raíz de trazado del build.
- Headers defensivos continúan activos. Los tests preservan el límite streaming de 32 KiB, validación Zod, rate limiting, 429/`Retry-After`, TLS fail-closed y contratos de error.

### Verificación posterior

| Comando/control | Resultado |
|---|---|
| `npm test` | PASS — 56/56; ningún test deshabilitado |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS — 0 warnings/errores |
| `npm run build` | PASS — Next 15.5.23 |
| `npm audit` | PASS — 0 vulnerabilidades conocidas |
| Smoke de headers sobre build | PASS — 200, CSP, `nosniff`, HSTS |

### Vulnerabilidades y riesgos abiertos

- No quedan vulnerabilidades registradas por `npm audit` al cierre de esta ejecución.
- Next.js anunció para el 26/08/2026 un release que corregirá una vulnerabilidad crítica en 15.5 y 16.3. Al no estar publicado aún el parche, la versión instalada debe considerarse temporal y no habilita producción.
- Siguen pendientes las verificaciones reales en Railway: proxy/IP confiable, HTTPS, variables y CA, migración 008, roles PostgreSQL de mínimo privilegio, base privada y prueba de atomicidad con múltiples réplicas.

### Decisión histórica posterior a la migración

**Migración técnicamente aprobada: SÍ, CON OBSERVACIONES.**

**Publicación de Avizor en producción: NO.** Un audit npm limpio no sustituye el parche crítico anunciado ni la validación operativa exigida por `RAILWAY_SECURITY_CHECKLIST.md`.
