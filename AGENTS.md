# AGENTS.md — Avizor

Contexto para Claude Code. Leer antes de cualquier tarea.

---

## Qué es Avizor

Asistente de monitoreo agrícola para productores y asesores agronómicos de Argentina.
Identifica condiciones ambientales que pueden favorecer riesgos agrícolas (enfermedades, heladas, estrés hídrico) y las traduce en señales simples y accionables.

**No predice. No diagnostica. Identifica condiciones.**

Slogan: *La señal antes del problema.*

---

## Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | Next.js 14 (App Router) + React + TypeScript | |
| Estilos | Tailwind CSS | Sin librerías de componentes por ahora |
| Backend | Next.js API Routes | Todo en la misma app |
| Base de datos | Railway PostgreSQL | |
| API Clima | Open-Meteo | Siempre via ClimateProvider, nunca directo |
| Analítica | PostHog | |
| Hosting | Railway | Cuenta existente — mismo proyecto que otros servicios |

---

## Estructura de carpetas esperada

```
/app
  /page.tsx                  ← Home: formulario de consulta
  /resultado/page.tsx        ← Pantalla de resultado
  /metodologia/page.tsx      ← Página pública de metodología
  /api
    /consulta/route.ts       ← Endpoint principal POST /api/consulta
/lib
  /climate/
    provider.ts              ← ClimateProvider (abstracción sobre Open-Meteo)
    cache.ts                 ← Cache climático (TTL: 3hs)
  /rules/
    engine.ts                ← RulesEngine: evalúa condiciones
    score.ts                 ← ScoreEngine: combina resultados en Estado General
  /localidades/
    normalize.ts             ← Normalización: "tandil" → "Tandil", "Gral. Pico" → "General Pico"
/types
  index.ts                   ← Tipos compartidos
```

---

## Tipos centrales

```typescript
type Condicion = "favorable" | "moderada" | "desfavorable";

type Confianza = "Alta" | "Media" | "Baja";

type EstadoGeneral =
  | "Atención recomendada"
  | "Monitoreo preventivo sugerido"
  | "Sin alertas activas";

interface CategoriaResultado {
  nombre: string;              // "enfermedades_foliares"
  condicion: Condicion;
  causas: string[];            // ["humedad_82", "lluvia_42mm"]
  recomendacion: string;
  regla_version: string;       // "v1.0"
}

interface ResultadoConsulta {
  estado_general: EstadoGeneral;
  confianza: Confianza;
  dias_datos: number;
  categorias: CategoriaResultado[];
  share_token: string;
}
```

---

## API interna

### POST /api/consulta

**Request:**
```json
{
  "localidad": "Tandil",
  "cultivo": "soja",
  "session_id": "abc123",
  "fecha_siembra": "2025-04-15"
}
```

**Response:**
```json
{
  "estado_general": "Atención recomendada",
  "confianza": "Alta",
  "dias_datos": 14,
  "categorias": [
    {
      "nombre": "enfermedades_foliares",
      "condicion": "moderada",
      "causas": ["humedad_82", "lluvia_42mm", "temp_22"],
      "recomendacion": "Monitorear el lote durante los próximos 5 días.",
      "regla_version": "v1.0"
    }
  ],
  "share_token": "xyz789"
}
```

---

## Reglas de arquitectura (no negociables)

1. **El frontend nunca llama a Open-Meteo directamente.** Todo pasa por ClimateProvider.
2. **Las reglas agronómicas viven en PostgreSQL** (tabla `reglas_agronomicas`), no hardcodeadas en el código. Cambiar un umbral = cambiar un registro, no un deploy.
3. **RulesEngine y ScoreEngine son servicios separados.** RulesEngine evalúa qué condiciones se cumplen. ScoreEngine decide el Estado General combinando los resultados.
4. **Cache climático obligatorio.** Misma localidad + mismo día = una sola llamada a Open-Meteo. TTL: 3 horas.
5. **Logs completos por consulta.** Cada llamada a `/api/consulta` debe loguear en PostgreSQL: localidad, cultivo, datos climáticos usados, reglas evaluadas, resultado, versión de reglas, errores.
6. **Normalizar localidades antes de cualquier consulta a la BD.** "tandil", "TANDIL", "Tandil" son lo mismo.

---

## Lógica del ScoreEngine (MVP)

```
Si alguna categoría es "favorable"  → Estado General = "Atención recomendada"
Si ninguna es "favorable" pero alguna es "moderada" → "Monitoreo preventivo sugerido"
Si todas son "desfavorable"  → "Sin alertas activas"
```

Nivel de confianza:
```
14 días completos de datos → Alta
7–13 días → Media
< 7 días  → Baja
```

---

## Lenguaje del producto

Avizor habla así:

| ❌ No decir | ✅ Sí decir |
|---|---|
| Riesgo alto de roya | Condiciones favorables para enfermedades foliares |
| Existe riesgo severo | Las condiciones actuales merecen atención |
| Tu cultivo está en riesgo | Monitorear el lote durante los próximos 5 días |

Principios: claro · prudente · basado en evidencia · nunca alarmista · nunca absoluto.

---

## Feature flags (variables de entorno)

```env
ENABLE_MAIZ=false
ENABLE_ALERTAS=false
ENABLE_OBSERVACIONES=true
ENABLE_MODO_EXPERIMENTAL=false
```

Usar estos flags antes de condicionar funcionalidad nueva. No comentar código.

---

## Ambientes

| Ambiente | Descripción |
|---|---|
| `localhost` | Desarrollo local |
| Railway Preview | QA — cada PR puede generar un environment de preview en Railway |
| Railway Production | `main` branch — solo mergear con QA aprobado |

### Setup de Railway

Agregar en `package.json`:
```json
"scripts": {
  "build": "next build",
  "start": "next start -p $PORT"
}
```

Agregar `railway.json` en la raíz del proyecto:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

Railway detecta Next.js automáticamente con Nixpacks. Conectar el repo de GitHub desde el panel de Railway y el deploy es automático en cada push a `main`.

Las variables de entorno se configuran en el panel de Railway (no en `.env` en producción). Agregar un servicio Railway PostgreSQL y vincular `DATABASE_URL` al servicio Next.js.

---

## Scope del MVP (no agregar sin consultar)

**Dentro:**
- Consulta por localidad + cultivo (solo soja)
- Resultado con Estado General + detalle + "¿Qué está viendo Avizor?" + confianza
- Guardado sin login (email opcional)
- Compartir por WhatsApp + copiar enlace
- Observación del lote (se guarda, no afecta el score)
- Feedback del usuario
- Página de metodología

**Fuera:**
- Imágenes satelitales
- Diagnóstico por foto
- IA conversacional
- Gestión de campos o aplicaciones
- Integración con maquinaria
- Mercado de granos
- Múltiples cultivos (maíz, trigo, girasol)
- Login / panel de usuario
- Alertas automáticas

---

## Fuentes de datos climáticos

| Fuente | Uso en Avizor | Estado |
|---|---|---|
| **Open-Meteo** | Única fuente de datos en tiempo real del MVP. Temperatura, humedad, precipitaciones, viento — últimos 14 días. Gratis, sin API key. | ✅ Implementar |
| NASA POWER | Proveedor alternativo documentado para fallback. Promedio histórico de largo plazo. No implementar en MVP. | 📋 Documentado, no implementado |
| SMN | Sin API pública estable. No integrar. | ❌ Fuera del MVP |
| INTA | No tiene API de datos en tiempo real. Se usa como referencia para validar reglas agronómicas, no como fuente de datos. | 📋 Solo referencia técnica |
| FAO | Estándares agronómicos internacionales. Se usa como referencia para diseño de reglas. | 📋 Solo referencia técnica |

**Regla:** el ClimateProvider en el MVP apunta exclusivamente a Open-Meteo. NASA POWER está documentado como fallback pero no codificado. Si Open-Meteo falla, mostrar el error amigable al usuario — no intentar fallback automático en MVP.

---



Antes de cada deploy, verificar estos escenarios:

| Localidad | Condición simulada | Resultado esperado |
|---|---|---|
| Tandil | Humedad 85%, lluvia 50mm en 5 días | Condiciones favorables — Confianza Alta |
| Pergamino | Humedad 60%, sin lluvia en 7 días | Condiciones desfavorables — Confianza Alta |
| Azul | API de clima no disponible | Error amigable, sin resultado parcial |
| Localidad inexistente | — | Mensaje de localidad no encontrada |
| Tandil | Cultivo: maíz (no soportado) | Mensaje de cultivo no disponible en MVP |

---

## Errores — mensajes para el usuario

| Error técnico | Mensaje visible |
|---|---|
| API clima no disponible | "No pudimos obtener datos climáticos. Intentá nuevamente en unos minutos." |
| Localidad no reconocida | "No encontramos esa localidad. Probá con el nombre completo." |
| Cultivo no soportado | "Avizor todavía no cubre ese cultivo. Por ahora solo soja está disponible." |
| Datos insuficientes | "Los datos disponibles son limitados. El resultado se muestra con confianza Baja." |

Nunca mostrar errores técnicos (500, stack traces, mensajes de base de datos) al usuario.

---

## Equipo

- **Andy** — producto, desarrollo y estrategia
- **Eze** — desarrollo, IA

Toda decisión que amplíe el scope del MVP debe consultarse antes de implementarse.
