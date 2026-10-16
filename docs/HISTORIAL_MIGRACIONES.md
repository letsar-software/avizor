# Historial de migraciones de PostgreSQL

Inventario de las 28 migraciones presentes en `db/migrations`, actualizado el 2026-10-16.

## Qué significa cada fecha

La **fecha de Git** corresponde al primer commit que agregó el archivo, obtenida con `git log --follow --diff-filter=A --format="%as %h" -- db/migrations/<archivo>`. No es la fecha de creación original ni de ejecución en una base. La migración de seguridad `027_consulta_interaction_token.sql` se incorpora a Git el 2026-10-16, aunque se implementó y probó localmente el 2026-10-10.

El registro técnico de cada ambiente está en **`public.schema_migrations`**, creado por la migración 021. Contiene `filename` y `applied_at`. Para consultar las fechas registradas en la base conectada:

```sql
SELECT filename,
       applied_at AT TIME ZONE 'America/Argentina/Buenos_Aires' AS registrado_en_argentina
FROM public.schema_migrations
ORDER BY applied_at, filename;
```

En bases anteriores a la adopción del runner, `applied_at` puede representar la fecha de registro de una migración previamente ejecutada. No debe interpretarse como evidencia de su primera ejecución histórica. Cada base tiene su propio registro: aplicar una migración localmente no actualiza Railway.

## Inventario

| Archivo | Fecha de Git | Commit de incorporación | Cambios incluidos |
| --- | --- | --- | --- |
| [001_mvp_schema.sql](../db/migrations/001_mvp_schema.sql) | 2026-06-30 | 7803632 | Esquema inicial: extensión pgcrypto, reglas agronómicas, logs de consultas e índices; carga inicial de reglas del MVP. |
| [002_consultas_interacciones.sql](../db/migrations/002_consultas_interacciones.sql) | 2026-07-01 | 7e10f5f | Persistencia de consultas con share_token y snapshots; tablas de interesados, observaciones y feedback con sus relaciones e índices. |
| [003_dedupe_reglas_agronomicas.sql](../db/migrations/003_dedupe_reglas_agronomicas.sql) | 2026-07-01 | 7e10f5f | Elimina reglas duplicadas y asegura unicidad por cultivo, categoría, condición y versión. |
| [004_reglas_estado_experimental.sql](../db/migrations/004_reglas_estado_experimental.sql) | 2026-07-02 | 1c20ff3 | Clasifica reglas como validadas, experimentales o pendientes; valida el JSON de condiciones y agrega un índice de búsqueda. |
| [005_interesados_consentimiento.sql](../db/migrations/005_interesados_consentimiento.sql) | 2026-07-25 | da11642 | Agrega nombre del lote y datos de consentimiento; exige versión y fecha cuando el consentimiento está otorgado. |
| [006_fenologia_consultas.sql](../db/migrations/006_fenologia_consultas.sql) | 2026-08-03 | c8ee543 | Incorpora grupo de madurez, cultivar, estadio, fechas estimadas, confianza y versión del modelo en consultas y logs. |
| [007_backend_v2.sql](../db/migrations/007_backend_v2.sql) | 2026-08-05 | c22b674 | Versionado y definiciones JSON de reglas V2; snapshots y metadatos extendidos de consultas; tablas de cultivos, API keys, uso de API y auditoría. |
| [008_security_rate_limits.sql](../db/migrations/008_security_rate_limits.sql) | 2026-08-24 | 320741d | Crea contadores distribuidos de solicitudes por ámbito, identidad hasheada y ventana temporal, con vencimiento e índice de limpieza. |
| [009_soja_enfermedades_v2.sql](../db/migrations/009_soja_enfermedades_v2.sql) | 2026-08-24 | a4d8ed0 | Crea el catálogo de enfermedades de soja y reglas específicas con evidencia y evaluabilidad; retira la regla foliar genérica para evitar señales duplicadas. |
| [010_usuarios_admin.sql](../db/migrations/010_usuarios_admin.sql) | 2026-08-25 | bad3f9b | Crea usuarios y sesiones de administración, con roles, estado, hash de contraseña y tokens de sesión hasheados con vencimiento. |
| [011_reglas_aplicabilidad.sql](../db/migrations/011_reglas_aplicabilidad.sql) | 2026-08-25 | 706121c | Extiende temporalmente reglas agronómicas con tipo de regla, grupo de plaga, especie y nivel de evidencia climática; esas columnas se retiran en 016. |
| [012_plagas.sql](../db/migrations/012_plagas.sql) | 2026-08-25 | 706121c | Crea zonas agronómicas, catálogo de plagas y regionalización de plagas, separando sus relaciones del motor de reglas climáticas. |
| [013_soja_plagas_rules.sql](../db/migrations/013_soja_plagas_rules.sql) | 2026-08-25 | bd66ed7 | Crea reglas de plagas y fuentes agronómicas con sus relaciones; carga fuentes, zonas, catálogo y reglas de soja, manteniendo pendientes sin activar. |
| [014_empresas_api_keys.sql](../db/migrations/014_empresas_api_keys.sql) | 2026-08-25 | c77ca47 | Crea empresas y vincula API keys a empresas; incorpora scopes de autorización e índice por empresa. |
| [015_modelos_fenologicos.sql](../db/migrations/015_modelos_fenologicos.sql) | 2026-08-25 | 785c999 | Crea modelos fenológicos parametrizados y versionados; migra a datos el modelo de soja vigente sin cambiar su comportamiento. |
| [016_retira_columnas_plagas_reglas_agronomicas.sql](../db/migrations/016_retira_columnas_plagas_reglas_agronomicas.sql) | 2026-08-25 | a4baec5 | Retira las columnas y el índice de plagas introducidos en 011: el motor de plagas utiliza reglas_plagas de la migración 013. |
| [017_invitaciones_admin.sql](../db/migrations/017_invitaciones_admin.sql) | 2026-08-25 | f5e6ff4 | Crea invitaciones de administradores con tokens hasheados, vencimiento y fecha de aceptación para enlaces de un solo uso. |
| [018_api_key_scopes_check.sql](../db/migrations/018_api_key_scopes_check.sql) | 2026-08-26 | cc08233 | Restringe los scopes de API keys en PostgreSQL a la taxonomía autorizada: consultas:crear. |
| [019_privacy_retention.sql](../db/migrations/019_privacy_retention.sql) | 2026-09-07 | 66ef038 | Agrega índices por fecha para la limpieza de datos; incorpora baja y última interacción de interesados. La eliminación por retención se ejecuta desde la aplicación. |
| [020_novedades_suscripcion_baja.sql](../db/migrations/020_novedades_suscripcion_baja.sql) | 2026-09-07 | 66ef038 | Agrega índices para suscripciones activas y bajas; facilita el seguimiento y la limpieza de registros de supresión. |
| [021_schema_migrations.sql](../db/migrations/021_schema_migrations.sql) | 2026-09-09 | f733907 | Crea public.schema_migrations con filename único y applied_at para registrar y omitir migraciones ya aplicadas. |
| [022_trigo_catalogo_inicial.sql](../db/migrations/022_trigo_catalogo_inicial.sql) | 2026-10-09 | 391c635 | Incorpora trigo al catálogo de cultivos y sus fichas iniciales de enfermedades, sin generar señales ni modificar soja. |
| [023_trigo_reglas_preliminares.sql](../db/migrations/023_trigo_reglas_preliminares.sql) | 2026-10-09 | 391c635 | Carga reglas preliminares de enfermedades de trigo como pendientes de evidencia y no evaluables hasta la validación agronómica. |
| [024_activa_trigo_experimental.sql](../db/migrations/024_activa_trigo_experimental.sql) | 2026-10-09 | 391c635 | Habilita comparaciones meteorológicas parciales de trigo como experimentales, con limitaciones explícitas y sin incorporarlas al score. |
| [025_trigo_sin_coincidencia_incompleta.sql](../db/migrations/025_trigo_sin_coincidencia_incompleta.sql) | 2026-10-09 | 391c635 | Corrige reglas de trigo para que una temperatura fuera del rango se informe como evaluación incompleta cuando faltan mojado foliar e inóculo. |
| [026_fusariosis_resultado_incompleto.sql](../db/migrations/026_fusariosis_resultado_incompleto.sql) | 2026-10-09 | 391c635 | Corrige la salida sin coincidencia de fusariosis de trigo: informa evaluación incompleta y condiciones parciales no confirmadas. |
| [027_consulta_interaction_token.sql](../db/migrations/027_consulta_interaction_token.sql) | 2026-10-16 | Este commit | Agrega consultas.interaction_token_hash y valida hashes SHA-256 de 64 caracteres hexadecimales; permite separar la credencial privada de escritura del enlace público de lectura. |
| [027_reglas_configurables_genericas.sql](../db/migrations/027_reglas_configurables_genericas.sql) | 2026-10-12 | 3589b8a | Crea categorías, subcategorías y etapas fenológicas; amplía reglas con configuración, fuentes, vigencia y textos administrables; carga etapas de trigo y relaciones sin activar ni alterar umbrales. |

## Aplicaciones verificadas de la migración de seguridad

| Migración | Ambiente | Fecha verificada | Resultado |
| --- | --- | --- | --- |
| 027_consulta_interaction_token.sql | PostgreSQL local de desarrollo | 2026-10-10 | Aplicada durante la implementación; una ejecución posterior del runner la omitió por estar registrada. |
| 027_consulta_interaction_token.sql | Railway: proyecto avizor, ambiente production, servicio Postgres | 2026-10-16 | Aplicada en una transacción y registrada; se verificaron la columna nullable de tipo text y la restricción consultas_interaction_token_hash_check validada. |

La aplicación en Railway se verificó mediante TLS con certificado validado. Esta operación no desplegó la aplicación ni copió datos locales. Las fechas de aplicación de las demás migraciones deben consultarse en el registro del ambiente; no se infieren de Git.

## Orden y numeración

- Existen dos archivos con prefijo **027**. El identificador que usa `schema_migrations` es el nombre completo, por lo que se registran por separado. Ambos se conservan con su nombre original porque ya están aplicados en producción. La próxima migración debe usar **028** si sigue disponible al crearla.
- El orden efectivo se define en `scripts/apply-migrations.js`, no por el orden de esta tabla. El runner crea 021 primero cuando necesita inicializar el historial y puede aplicar 003 anticipadamente para sanear reglas existentes.
- Al elaborar este historial, `027_reglas_configurables_genericas.sql` existe en Git y estaba registrada en producción, pero no figura en la lista del runner. Este inventario la documenta; no modifica el runner ni afirma que una base nueva la reciba automáticamente.
- Los scripts de `db/operations` son procedimientos operativos manuales y no forman parte de este inventario de migraciones automáticas.

## Cómo mantener este historial

1. Crear una nueva migración con un nombre único y agregarla a la lista del runner.
2. Añadir una fila con la fecha de incorporación a Git y una descripción breve de los cambios. Para el commit que incorpora el propio documento puede usarse «Este commit»; Git conserva la referencia exacta.
3. Ejecutar las migraciones con la `DATABASE_URL` del ambiente correcto. El runner aplica y registra cada archivo en una misma transacción; los ya registrados se omiten.
4. Consultar `public.schema_migrations` y verificar el esquema después de aplicar. Documentar las aplicaciones relevantes con ambiente y fecha, sin incluir credenciales.
5. No editar ni renombrar una migración aplicada. Cualquier corrección requiere una migración nueva.
