# Avizor

> La señal antes del problema.

Avizor es una plataforma de monitoreo agrícola para productores y asesores agronómicos de Argentina. Convierte información climática reciente en señales simples que ayudan a observar condiciones que pueden favorecer enfermedades foliares, heladas, estrés hídrico o exceso hídrico.

Avizor no predice ni diagnostica. La información es orientativa y debe complementarse con observación a campo y asesoramiento profesional.

## Estado actual

- Sitio público responsive para escritorio y mobile.
- Consulta rápida por localidad y cultivo.
- Consulta opcional enriquecida con fecha de siembra, grupo de madurez y cultivar.
- Resumen general posterior a la consulta.
- Detalle independiente para cada categoría.
- Estimación fenológica separada del motor de reglas.
- Historial local sin inicio de sesión.
- API interna, Open-Meteo y persistencia PostgreSQL.
- Metodología, bibliografía, privacidad, alcance, contacto y estado del sistema.

## Principios del producto

- Claro y simple.
- Prudente y no alarmista.
- Basado en evidencia.
- Orientativo, no diagnóstico.
- Transparente sobre datos, reglas y limitaciones.

| Evitar | Usar |
| --- | --- |
| “Tu cultivo está en riesgo” | “Las condiciones actuales merecen atención” |
| “Riesgo alto de enfermedad” | “Condiciones favorables para enfermedades foliares” |
| “El cultivo está en R3” | “Estado fenológico estimado: R3” |

## Evolución entre versiones

### 1. Primera versión pública

El producto comenzó con Inicio, Consulta, Metodología y Sobre Avizor. La pantalla inicial explicaba qué hacía Avizor, cómo funcionaba y qué señal entregaba.

Se definieron cuatro categorías:

- Enfermedades foliares.
- Heladas.
- Estrés hídrico.
- Exceso hídrico.

### 2. Ampliación del sitio

Se incorporaron:

- Historial de consultas.
- Bibliografía.
- Explicación del resultado.
- Privacidad.
- Alcance y limitaciones.
- Novedades.
- Contacto.
- Estado del sistema.

La página independiente “Quiénes hacen Avizor” fue eliminada. La información del equipo quedó integrada en “Sobre Avizor” y se retiró esa opción del footer.

### 3. Identidad y navegación

Se unificaron header, navegación y footer:

- Header fijo y translúcido durante el desplazamiento.
- Menú hamburguesa desplegable en mobile.
- Footer mobile común con información expandible.
- Navegación inferior mobile.
- Logo consistente en header y footer.

El recurso vigente es `public/logo-mod-avizor.png`. La URL se cambió respecto de versiones anteriores para evitar que el navegador muestre un logo almacenado en caché.

### 4. Inicio, Metodología y Sobre Avizor

Inicio pasó a enfocarse en el problema de la información climática dispersa, el proceso de Avizor y el acceso directo a la consulta. Se eliminó de Inicio la sección antigua del equipo.

Metodología incorporó:

- Proceso de generación de señales.
- Cómo leer los resultados.
- Qué es y qué no es Avizor.
- Mejora continua.
- Principios de comunicación.

Sobre Avizor incorporó historia, principios, métricas, equipo y enlaces personales.

### 5. Equipo y LinkedIn

- **Andrea Alvarez Zunino** — Fundadora · Producto & Desarrollo.
- **Ezequiel Romeo** — Arquitectura de Software & IA.
- **Natali Lazzaro** — Especialista Agronómica.

Cada integrante tiene una descripción ampliada y un enlace personal a LinkedIn.

LinkedIn oficial: https://www.linkedin.com/company/avizor-agtech

### 6. Resultados en dos niveles

#### Resumen general

Es la primera pantalla posterior a la consulta e incluye:

- Estado general y metadatos.
- Resumen por categoría.
- Variables climáticas.
- Gráfico de evolución.
- Comparación con reglas.
- Recomendación general.
- Fuente, limitaciones y calidad de datos.
- Contexto fenológico cuando está disponible.

Cada categoría permite ingresar a su detalle.

#### Detalle por categoría

- `/resultado/heladas`
- `/resultado/enfermedades_foliares`
- `/resultado/estres_hidrico`
- `/resultado/exceso_hidrico`

Cada detalle conserva variables, gráfico, comparación con la regla, evidencia, recomendaciones, limitaciones y calidad de datos.

### 7. Versión mobile

Todas las pantallas se adaptaron a mobile:

- Header compacto y menú desplegable.
- Tarjetas apiladas y controles táctiles.
- Categorías desplazables horizontalmente cuando corresponde.
- Gráficos adaptados al ancho disponible.
- Footer común en todas las pantallas.
- Biografías compactas con nombres completos.
- Eliminación del desbordamiento horizontal.

La validación habitual usa un viewport de 390 × 844 px.

### 8. Fenología estimada

La consulta rápida sigue solicitando localidad y cultivo. El usuario puede desplegar “Quiero mejorar la precisión” y agregar:

- Fecha de siembra.
- Grupo de madurez: III, IV corto, IV largo o V.
- Cultivar opcional.

El resultado puede mostrar:

- Estadio actual estimado.
- Fecha y margen estimados.
- Nivel de confianza.
- Modelo y versión.
- Línea temporal E, R1, R3, R5 y R7.

El detalle se encuentra en `/resultado/fenologia`. La estimación también aparece como contexto dentro de cada categoría.

La fenología todavía no modifica las señales ni el Estado General. La relación categoría × estadio requiere validación agronómica.

El proveedor actual es `lib/phenology/provider.ts` y usa un modelo calendario por grupo de madurez. Es orientativo y no debe presentarse como modelo termo-fotoperiódico validado.

## Flujo de usuario

```text
Inicio
  └── Consulta
        ├── Localidad + cultivo
        └── Datos opcionales
              ├── Fecha de siembra
              ├── Grupo de madurez
              └── Cultivar
                    ↓
              Resumen general
              ├── Heladas
              ├── Enfermedades foliares
              ├── Estrés hídrico
              ├── Exceso hídrico
              └── Fenología estimada
```

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/` | Inicio |
| `/consultar` | Consulta |
| `/resultado` | Resumen general |
| `/resultado/[categoria]` | Detalle de categoría |
| `/resultado/fenologia` | Detalle fenológico |
| `/historial` | Historial local |
| `/metodologia` | Metodología |
| `/bibliografia` | Bibliografía |
| `/explicacion-resultado` | Explicación del resultado |
| `/sobre-avizor` | Proyecto y equipo |
| `/contacto` | Contacto |
| `/privacidad` | Privacidad |
| `/alcance-limitaciones` | Alcance y limitaciones |
| `/estado-sistema` | Estado del sistema |

## Arquitectura

| Capa | Tecnología |
| --- | --- |
| Frontend | Next.js 14, React y TypeScript |
| Estilos | Tailwind CSS |
| Backend | Next.js API Routes |
| Base de datos | PostgreSQL |
| Clima | Open-Meteo mediante `ClimateProvider` |
| Reglas | `RulesEngine` + `ScoreEngine` |
| Fenología | `PhenologyProvider` |

Reglas arquitectónicas:

- El frontend nunca llama a Open-Meteo directamente.
- Las reglas agronómicas se obtienen desde PostgreSQL.
- `RulesEngine` evalúa categorías y `ScoreEngine` calcula el Estado General.
- El clima usa caché de tres horas.
- Las localidades se normalizan antes de consultar.
- La fenología permanece separada del score.

## API

`POST /api/consulta`

Consulta rápida:

```json
{
  "localidad": "Tandil, Buenos Aires",
  "cultivo": "soja",
  "session_id": "abc123"
}
```

Consulta enriquecida:

```json
{
  "localidad": "Tandil, Buenos Aires",
  "cultivo": "soja",
  "session_id": "abc123",
  "fecha_siembra": "2026-11-10",
  "grupo_madurez": "IV corto",
  "cultivar_id": "DM 40R16"
}
```

La respuesta puede incluir `fenologia` además del resultado climático y agronómico.

## Base de datos

Las migraciones se encuentran en `db/migrations`.

`006_fenologia_consultas.sql` agrega a consultas y logs:

- Grupo de madurez.
- Cultivar.
- Estadio estimado.
- Inicio y fin del rango.
- Confianza fenológica.
- Versión del modelo.

Esta migración debe aplicarse antes de desplegar la funcionalidad en producción.

## Desarrollo local

```bash
npm install
npm run dev
```

Producción local:

```bash
npm run build
npm start
```

Variables esperadas:

```env
DATABASE_URL=
ENABLE_MAIZ=false
ENABLE_ALERTAS=false
ENABLE_OBSERVACIONES=true
ENABLE_MODO_EXPERIMENTAL=false
```

Las variables productivas se configuran en Railway y no deben subirse al repositorio.

## Verificación

```bash
npx tsc --noEmit
npm run build
```

En `scripts/` existen pruebas Playwright de smoke para Inicio, menú, footer, consulta, páginas públicas, resultados, categorías, logo, equipo, LinkedIn y fenología.

## Pendientes

- Aplicar la migración fenológica en producción.
- Validar los parámetros del modelo fenológico.
- Incorporar temperatura histórica y fotoperíodo antes de declarar un modelo termo-fotoperiódico.
- Validar la matriz categoría × estadio.
- Mantener la fenología fuera del score hasta completar esa validación.
- Ejecutar QA en Railway Preview antes de fusionar a `main`.

## Equipo

- Andrea Alvarez Zunino — producto, análisis funcional y desarrollo.
- Ezequiel Romeo — arquitectura de software e inteligencia artificial.
- Natali Lazzaro — validación técnica agronómica.

© 2026 Avizor. Todos los derechos reservados.

## Backend v2

El backend principal se organiza alrededor de `ConsultaService`, reutilizado por web, API empresarial, simulaciones administrativas y el gateway preparado para WhatsApp.

- API pública: `POST /api/public/consultas` y recursos asociados por consulta.
- API empresarial: `POST /api/v1/consultas`, autenticada con `x-api-key`.
- API interna: `/api/admin`, autenticada con `Authorization: Bearer $AVIZOR_INTERNAL_TOKEN`.
- Contrato OpenAPI: `docs/openapi.yaml`.
- Relevamiento y decisiones: `docs/backend-gap-analysis.md`.
- Migración y seeds v2: `db/migrations/007_backend_v2.sql`.
- Golden dataset: `npm test`.

La fenología es contexto opcional. Mientras no exista un proveedor oficial o modelo propio validado, devuelve `proveedor_no_configurado` o `entradas_insuficientes`, y siempre `modifica_reglas: false`.

### Variables nuevas

```env
CLIMATE_CACHE_TTL_SECONDS=10800
AVIZOR_INTERNAL_TOKEN=
```

Para crear una API key empresarial, generar un secreto aleatorio, guardar únicamente su SHA-256 en `api_keys.key_hash` y entregar el valor original una sola vez al consumidor.
