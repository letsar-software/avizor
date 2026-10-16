# Seguridad de resultados compartidos

El `share_token` de la URL autoriza solamente lectura durante 30 días. No permite observaciones, feedback ni asociar correos.

Al crear una consulta persistida (API actual y legacy), la respuesta incluye una `interaction_token` aleatoria de 256 bits. El creador debe enviar esa credencial en el header `x-consulta-token` para las operaciones de escritura. Se almacena únicamente su SHA-256 en una columna independiente, nunca en el snapshot ni el enlace público. No es una identidad de usuario: quien obtenga la credencial privada podrá escribir mientras la consulta esté vigente. El frontend actual conserva la respuesta de creación en sessionStorage; no hay formularios de interacción conectados actualmente.

Los resultados anteriores a la migración 027 siguen disponibles para lectura, pero no pueden recibir nuevas interacciones: carecen de credencial privada. Es necesario crear una nueva consulta para obtenerla. Los endpoints legacy también verifican la credencial cuando incluyen `share_token`; una suscripción independiente con consentimiento sigue funcionando sin asociarse a ninguna consulta.

## Límites

- Lectura de páginas compartidas (incluidos detalles) y GET público: 60 solicitudes por minuto por IP, con la misma cuota para ambas vías.
- Escrituras públicas y legacy: 10 solicitudes por minuto por IP, incluidos intentos rechazados.
- Se conservan las cuotas existentes de creación (20/hora por IP) y guardado de email (3/hora por email).

Las cuotas usan ventanas fijas y UPSERT atómico en PostgreSQL, compartidas entre réplicas. Una IP compartida también comparte la cuota. En desarrollo se usa una identidad local común. La API devuelve 429 y Retry-After; la página muestra un aviso para esperar un minuto. El límite de lectura se comprueba antes de recuperar el snapshot. Esto reduce lecturas y escrituras costosas, aunque cada intento consume una operación de rate limiting en la base; no sustituye protección contra DDoS en el proxy.

## Despliegue

Aplicar `npm run db:migrate` con la configuración de la base del ambiente antes de desplegar el código. Incluye `027_consulta_interaction_token.sql`.

Railway requiere `RATE_LIMIT_TRUSTED_PROXY=railway` y `RATE_LIMIT_HASH_SECRET` fuerte ya empleados por los límites existentes. El proxy debe sobrescribir `X-Real-IP` con la IP real y evitar acceso directo que permita falsificarlo; el servidor no confía en X-Forwarded-For. Sin una configuración válida, producción rechaza solicitudes en lugar de omitir la protección.

El resultado continúa siendo accesible a cualquiera que tenga el enlace; compartirlo implica permitir su lectura. Las protecciones no equivalen a una garantía absoluta de ausencia de vulnerabilidades.
