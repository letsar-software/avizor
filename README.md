# Avizor

> La señal antes del problema.

Avizor es una plataforma de monitoreo agrícola para productores y asesores de Argentina. Traduce datos climáticos recientes y reglas agronómicas en señales claras para orientar el monitoreo del lote de soja.

No predice ni diagnostica. Los resultados son orientativos: deben complementarse con observación a campo y asesoramiento profesional.

## Estado del proyecto

La aplicación cuenta con una experiencia pública responsive, backend de consultas, persistencia en PostgreSQL y un panel administrativo con control por roles. El MVP público está enfocado en soja; maíz, alertas automáticas y otras extensiones permanecen desactivadas mediante feature flags.

Hoy incluye:

- Consulta por localidad y cultivo, con datos opcionales de siembra, grupo de madurez y cultivar.
- Señales para enfermedades foliares, heladas, estrés hídrico y exceso hídrico.
- Resultado en dos niveles: resumen general y detalle por categoría, con variables, evidencia, comparaciones y recomendaciones prudentes.
- Calidad/cobertura del análisis, pronóstico climático y contexto fenológico estimado.
- Plagas habilitables por `ENABLE_PLAGAS`, con reglas y catálogo administrables.
- Historial local, guardado de consultas, observaciones, feedback y suscripción a novedades con consentimiento.
- Páginas públicas de metodología, bibliografía, explicación del resultado, alcance, privacidad, contacto, novedades y estado del sistema.
- Panel administrativo para reglas, simulaciones, plagas, zonas, cultivos, fenología, usuarios, empresas/API keys, auditoría y configuración.
- Retención de datos, logging seguro, rate limiting y migraciones versionadas.

## Principios de producto

- Claro, prudente y basado en evidencia.
- Sin mensajes alarmistas ni absolutos.
- Transparente respecto de fuentes, cobertura y limitaciones.
- Las condiciones ambientales se informan como señales de monitoreo, no como diagnósticos.

| Evitar | Usar |
| --- | --- |
| “Tu cultivo está en riesgo” | “Las condiciones actuales merecen atención” |
| “Riesgo alto de enfermedad” | “Condiciones favorables para enfermedades foliares” |
| “El cultivo está en R3” | “Estado fenológico estimado: R3” |

## Rutas principales

| Ruta | Función |
| --- | --- |
| `/` | Inicio |
| `/consultar` | Formulario de consulta |
| `/resultado` | Resumen de una consulta |
| `/resultado/[categoria]` | Detalle de enfermedades, heladas o estrés hídrico |
| `/resultado/plagas` | Detalle de plagas cuando la funcionalidad está habilitada |
| `/resultado/fenologia` | Contexto fenológico estimado |
| `/historial` | Historial local de consultas |
| `/metodologia`, `/bibliografia`, `/explicacion-resultado` | Fundamento y lectura de resultados |
| `/sobre-avizor`, `/contacto`, `/privacidad`, `/alcance-limitaciones`, `/novedades`, `/estado-sistema` | Información pública |
| `/admin` | Panel administrativo protegido |

## Arquitectura

| Capa | Implementación |
| --- | --- |
| Aplicación | Next.js 15, React 18 y TypeScript |
| UI | Tailwind CSS y componentes locales |
| Backend | Route Handlers de Next.js y `ConsultaService` |
| Base de datos | PostgreSQL |
| Clima | Open-Meteo, encapsulado por `ClimateProvider` |
| Reglas | `RulesEngineV2`, `IndicatorEngine` y `ScoreEngine` |
| Fenología | `PhenologyProvider` con modelos parametrizables |

Reglas de arquitectura relevantes:

- El frontend no consulta Open-Meteo directamente.
- Las reglas agronómicas se leen de PostgreSQL; los umbrales no viven hardcodeados en la UI.
- El motor de reglas y el cálculo del estado general están separados.
- El cache climático es configurable y usa tres horas por defecto.
- Las localidades se normalizan antes de consultar datos.
- Fenología y plagas no modifican el score general mientras no exista una validación agronómica que lo autorice.

## APIs

| API | Uso | Autenticación |
| --- | --- | --- |
| `POST /api/consulta` | Compatibilidad con la experiencia web | Pública, con validaciones y límites |
| `POST /api/public/consultas` | Crear consulta pública | Pública |
| `/api/public/consultas/[id]/*` | Recuperar, guardar, observar o enviar feedback | Según recurso y token de consulta |
| `POST /api/v1/consultas` | Integración empresarial | `x-api-key` con scope `consultas:crear` |
| `/api/admin/*` | Operación administrativa | Sesión por rol o token interno autorizado |

El contrato de integración está en [docs/openapi.yaml](docs/openapi.yaml). Las consultas pasan por `ConsultaService`, reutilizado por la web, las APIs y el laboratorio de reglas.

## Panel administrativo

El panel usa usuarios con roles, sesiones HTTP-only con vencimiento y permisos por módulo. Permite:

- Crear, editar y versionar reglas; las reglas vigentes son inmutables y requieren validación para promoverse.
- Ejecutar simulaciones en el Laboratorio.
- Administrar cultivos, catálogo de plagas, regionalización y zonas.
- Administrar modelos fenológicos e hitos variables.
- Gestionar usuarios mediante invitaciones de un solo uso, auditoría, empresas y API keys revocables.
- Consultar métricas, estado técnico de PostgreSQL y configuración no sensible.

Las integraciones y notificaciones no tienen implementación ficticia: quedan visibles como pendientes de configuración hasta que exista infraestructura y definición funcional.

## Base de datos y migraciones

Las migraciones viven en `db/migrations` y se aplican con:

```bash
npm run db:migrate
```

El inventario con fechas y descripciones está en [docs/HISTORIAL_MIGRACIONES.md](docs/HISTORIAL_MIGRACIONES.md).

El ejecutor registra los archivos aplicados en `public.schema_migrations`. Cada migración se ejecuta y registra dentro de su propia transacción; una migración ya registrada se omite. No edites ni renombres una migración aplicada: agregá una nueva.

Para validar la cadena completa en PostgreSQL 16 descartable (requiere Docker):

```bash
npm run db:migrate:clean
```

Esta prueba no usa el `DATABASE_URL` local ni Railway. Crea el contenedor local `avizor-pg-migrate-test`, valida aplicación, idempotencia, rollback y esquema, y deja el contenedor disponible para inspección. Más detalle en [db/operations/README.md](db/operations/README.md).

El runbook de mínimo privilegio para Railway está en [db/operations/railway_least_privilege_roles.sql](db/operations/railway_least_privilege_roles.sql). Debe usarse una credencial de runtime distinta de la credencial que ejecuta migraciones.

## Desarrollo local

Requisitos: Node.js, npm y PostgreSQL accesible mediante `DATABASE_URL`. Docker es opcional para la prueba limpia de migraciones.

```bash
npm install
npm run dev
```

Para probar el build de producción:

```bash
npm run build
npm start
```

Copiá `.env.example` a tu archivo local de entorno y completá únicamente los valores necesarios. Nunca subas secretos.

Variables principales:

```env
DATABASE_URL=
DATABASE_SSL=true
ENABLE_MAIZ=false
ENABLE_ALERTAS=false
ENABLE_OBSERVACIONES=true
ENABLE_PLAGAS=false
CLIMATE_CACHE_TTL_SECONDS=10800
CLIMATE_CACHE_MAX_ENTRIES=500
AVIZOR_INTERNAL_TOKEN=
RATE_LIMIT_HASH_SECRET=
```

Las API keys empresariales se guardan exclusivamente como SHA-256. El secreto original se entrega una sola vez al crearla.

## Verificación

```bash
npx tsc --noEmit
npm test
npm run build
```

La suite cubre, entre otros, reglas, indicadores, plagas, fenología, seguridad, privacidad/retención, resultados, contratos de clima y migraciones. En `scripts/` hay smoke tests visuales y de flujos públicos para desktop y mobile.

## Seguridad y privacidad

- Validación de entradas y respuestas de error seguras.
- Límites de tasa para flujos sensibles, como login e invitaciones.
- Cookies de administración `httpOnly`, `sameSite=lax` y `secure` en producción.
- Auditoría de operaciones administrativas y logging sin datos sensibles.
- Políticas de retención y endpoint interno de mantenimiento.

Antes de desplegar, revisar [docs/RAILWAY_SECURITY_CHECKLIST.md](docs/RAILWAY_SECURITY_CHECKLIST.md) y ejecutar QA en Railway Preview.

## Pendientes conocidos

- Validar agronómicamente modelos fenológicos y la matriz categoría × estadio antes de usarla en el score.
- Mantener fenología fuera del score hasta contar con esa validación.
- Completar decisiones agronómicas y datos geográficos para ampliar la aplicabilidad de plagas.
- Definir infraestructura y eventos antes de implementar notificaciones o integraciones externas.
- Aplicar y verificar las migraciones pendientes en cada ambiente antes de habilitar funciones que dependan de ellas.

## Equipo

- Andrea Alvarez Zunino — Producto, análisis funcional y desarrollo.
- Ezequiel Romeo — Arquitectura de software e inteligencia artificial.
- Natali Lazzaro — Validación técnica agronómica.

© 2026 Avizor. Todos los derechos reservados.
