# Relevamiento del backend principal

Fecha: 2026-08-04

## Estado encontrado

- Next.js 14, TypeScript y PostgreSQL ya configurados.
- `ClimateProvider` encapsula Open-Meteo y existe una caché en memoria de tres horas.
- La consulta actual normaliza localidades, carga reglas desde PostgreSQL, calcula un estado general y persiste snapshots.
- Existen endpoints heredados para consulta, observaciones, feedback y guardado por email.
- La fenología actual usa offsets calendario fijos sin respaldo suficiente para presentarse como estimación validada.

## Brechas respecto del contrato v2

- Las reglas existentes no respetan las ventanas, bordes ni cobertura por agregador del spec v2.
- La precipitación faltante se suma como cero; esto viola `null !== 0`.
- El Route Handler concentra orquestación y no hay un `ConsultaService` reutilizable.
- Faltan `IndicatorEngine`, errores uniformes, request ID, API pública por recurso, API empresarial y API administrativa protegida.
- Faltan trazabilidad ampliada, API keys, límites de uso, auditoría y OpenAPI.
- La caché no permite inyectar `fechaRef` y su TTL no es configurable.
- El proveedor fenológico inventa una salida aun sin proveedor o modelo validado.

## Decisiones de implementación

1. Mantener los endpoints actuales como compatibilidad para la UI.
2. Incorporar `/api/public`, `/api/v1` y `/api/admin` sobre un único `ConsultaService`.
3. Usar las reglas del spec v2 como única fuente de verdad en PostgreSQL.
4. Sembrar las reglas como `vigente`, porque el prompt principal declara la validación concluida. El seed completa trazabilidad y documenta el rango 18–28 °C del nivel moderado.
5. Implementar el motor base y los 18 casos bloqueantes. El cierre monótono queda para fase 2.
6. Reemplazar la estimación calendario por un provider desacoplado que no inventa resultados y nunca modifica reglas o score.
7. Proteger `/api/admin` con `AVIZOR_INTERNAL_TOKEN` y `/api/v1` con API keys almacenadas como hash.

## Riesgos

- Sin `DATABASE_URL` se pueden probar motores puros, pero no cargar reglas vigentes ni persistir una consulta integrada.
- Promover reglas sin completar fuente, limitaciones, validadora y decisiones pendientes rompería el gate del spec.
- El soporte de localidades sigue siendo un catálogo MVP; una geocodificación externa requerirá otro adapter.
