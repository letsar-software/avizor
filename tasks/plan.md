# Plan BE-002

Especificación: [SPEC-BE-002.md](../SPEC-BE-002.md), aprobada con autorización de implementación.

1. Validar el ejecutor original con BE-001 en PostgreSQL 16 descartable. Conservar esa base para probar la adopción del historial.
2. Crear 021 e integrar el historial en el ejecutor, con transacciones por archivo sobre un cliente dedicado. Inicializar 021 antes del recorrido y preservar la deduplicación anticipada 003.
3. Verificar adopción y repetición en la base anterior. Ampliar la prueba de integración para base vacía, repetición, duplicados y rollback/reintento de una migración fallida.
4. Actualizar documentación y expectativas de esquema. Ejecutar integración y chequeos pertinentes, revisar el diff y entregar la rama sin deploy.

Dependencias: cada paso depende del anterior. No se necesita delegación ni trabajo en paralelo entre agentes.

Riesgos: perder el registro al fallar un archivo (transacción atómica), consultar una tabla aún inexistente (bootstrap de 021), romper bases antiguas con duplicados (preservar 003 anticipada), probar contra datos compartidos (URL local explícita). Los timestamps de adopción representan la ejecución actual, no fechas históricas desconocidas.

Las skills auxiliares referidas por spec-driven-development no están instaladas en los directorios de skills consultados. Se utiliza el desglose de esa skill y ciclos de prueba de integración, cambio y verificación.
