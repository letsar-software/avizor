# Spec: BE-002 — Historial de migraciones

Estado: aprobada por el usuario el 2026-09-09, con autorización para implementar en una rama independiente.

## Objetivo

Permitir que quienes desarrollan y despliegan Avizor ejecuten `npm run db:migrate` sin reaplicar archivos ya registrados. Mantener un historial consultable del nombre de archivo y del momento de aplicación exitosa.

BE-001 está incorporado en el commit `0cba079`, mergeado por `34dba20`. El README registra una prueba exitosa del 2026-09-08 con las migraciones 001–020. Antes de modificar el ejecutor se repetirá esa validación en PostgreSQL descartable y se conservará su resultado como evidencia.

## Stack

Node.js, JavaScript CommonJS y `pg` ^8.22.0. PostgreSQL 16 para integración, usando la infraestructura de BE-001. La aplicación usa Next.js 15.5.23. No se requieren dependencias nuevas.

## Comportamiento y supuestos

- Agregar `db/migrations/021_schema_migrations.sql`: 019 y 020 ya existen.
- Tabla `public.schema_migrations` con `filename text primary key` y `applied_at timestamptz not null default now()`.
- La identidad es el nombre completo del archivo, por ejemplo `001_mvp_schema.sql`, sin directorios.
- Inicializar el historial mediante la migración 021 antes de procesar las anteriores cuando la tabla no exista. Registrar también 021, de manera atómica con su creación. Esta excepción de orden solo agrega infraestructura de seguimiento y no depende de tablas de negocio.
- Conservar la lista explícita y el orden actual de las otras migraciones. Antes de ejecutar cada archivo, consultar el historial y omitirlo si está registrado, incluida 021.
- En una base existente sin historial, ejecutar y registrar las migraciones pendientes una vez. No inferir que todas se aplicaron por la presencia de tablas ni inventar fechas históricas: el timestamp corresponde a esta ejecución registrada.
- Preservar la ejecución anticipada de 003 cuando existe `reglas_agronomicas`, necesaria para eliminar duplicados antes del índice único de 001. Consultar y registrar también esa ejecución, de modo que el recorrido normal la omita. En una base vacía, 003 conserva su posición posterior a 002.
- Ejecutar cada archivo y su registro dentro de una misma transacción, sobre la misma conexión. Si falla, revertir ambos, detener la corrida y salir con código distinto de cero. Los archivos anteriores exitosos conservan su historial y se omiten al reintentar.
- Informar en consola qué archivos se aplican y cuáles se omiten, preservando la comprobación final `active_soja_rules`.
- Las migraciones registradas son inmutables: cambios posteriores requieren otro archivo. No se incluyen checksums, rollback automático ni un comando para marcar archivos manualmente.
- El criterio de cierre cubre corridas secuenciales. La coordinación de ejecutores simultáneos queda fuera de este requerimiento.

## Comandos

Validación previa de BE-001, en su contenedor de prueba descartable:

```bash
npm run db:migrate:clean
```

El helper actual recrea `avizor-pg-migrate-test`. Verificar que ese contenedor sea descartable antes de ejecutar el comando.

Criterio de cierre, sobre esa misma base local, después del cambio:

```bash
DATABASE_URL=postgres://avizor:avizor@127.0.0.1:54329/avizor DATABASE_SSL=false NODE_ENV=development npm run db:migrate
DATABASE_URL=postgres://avizor:avizor@127.0.0.1:54329/avizor DATABASE_SSL=false NODE_ENV=development npm run db:migrate
docker exec avizor-pg-migrate-test psql -U avizor -d avizor -v ON_ERROR_STOP=1 -c 'SELECT filename, applied_at FROM public.schema_migrations ORDER BY applied_at, filename;'
```

Verificación general disponible: `npm test`, `npm run lint`, `npm run build`. Desarrollo: `npm run dev`. Priorizar integración PostgreSQL y los chequeos pertinentes al ejecutor, sin necesitar iniciar el frontend.

## Estructura

- `scripts/apply-migrations.js`: ejecutor e integración con el historial.
- `db/migrations/021_schema_migrations.sql`: tabla de seguimiento.
- `scripts/test-clean-migrations.js`: verificación de integración existente.
- `scripts/lib/clean-schema.js`: expectativas del esquema, incorporando la tabla nueva.
- `scripts/lib/`: utilidades existentes de PostgreSQL descartable y ejecución de comandos.
- `tests/`: pruebas automatizadas con `tsx --test` y las APIs de Node.
- `README.md`: instrucciones de ejecución y consulta del historial.
- `SPEC-BE-002.md`: especificación de esta capacidad.

## Estilo de código

Mantener CommonJS, comillas dobles, punto y coma, indentación de dos espacios y consultas parametrizadas. Ejemplo tomado del ejecutor actual:

```javascript
async function tableExists(tableName) {
  const result = await pool.query("select to_regclass($1) as table_name", [tableName]);
  return Boolean(result.rows[0].table_name);
}
```

Las transacciones nuevas usarán un cliente dedicado adquirido del pool. El SQL seguirá las convenciones existentes, con palabras clave en minúsculas.

## Estrategia de pruebas

Usar PostgreSQL real descartable para comprobar los efectos y el historial, además de pruebas focalizadas con el runner existente si aportan cobertura de fallos. No depender únicamente de mocks o mensajes de consola.

1. Repetir BE-001 antes de cambiar el ejecutor: 001–020 exitosas y esquema validado.
2. Base vacía con el nuevo ejecutor: esquema válido y 21 nombres únicos con timestamps no nulos.
3. Dos ejecuciones consecutivas: la segunda no ejecuta ningún SQL de migración, no altera filas ni timestamps del historial y reporta todas como omitidas.
4. Base con 001–020 y sin historial: adopción exitosa del seguimiento y segunda corrida sin reaplicaciones.
5. Base antigua con reglas duplicadas: 003 se ejecuta antes de 001, queda registrada una sola vez y no se repite en el recorrido.
6. Migración de prueba que modifica datos y luego falla: ni sus cambios ni su registro persisten; el proceso falla y un reintento conserva las migraciones anteriores exitosas.

## Límites

- Siempre: validar primero BE-001, usar una base descartable, preservar las migraciones existentes, cerrar conexiones y verificar historial y estado real de la BD.
- Consultar antes: ampliar el alcance, agregar dependencias o modificar CI. La tabla solicitada está autorizada por BE-002.
- Nunca: ejecutar estas pruebas contra Railway o una base compartida, publicar secretos, modificar reglas agronómicas como parte de esta tarea o desplegar sin QA aprobado.

## Criterios de cierre

- Existe la migración 021 y crea el historial con unicidad por archivo y timestamp obligatorio.
- Todos los archivos aplicados exitosamente, incluida 021 y el caso especial 003, quedan registrados una sola vez.
- Dos corridas consecutivas de `npm run db:migrate` sobre la misma base resultan en cero migraciones ejecutadas en la segunda.
- Los timestamps permanecen estables en las siguientes corridas.
- Una migración fallida no queda registrada ni deja cambios parciales propios.
- Se verifica tanto instalación desde cero como adopción en una base sin historial.
- El README explica cómo consultar el historial y el significado de las fechas al adoptar una base existente.

## Preguntas abiertas

Sin preguntas funcionales bloqueantes identificadas.
