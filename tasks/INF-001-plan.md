# Plan INF-001

Especificación: [SPEC-INF-001.md](../SPEC-INF-001.md), aprobada para implementación.

1. Definir con una prueba de contrato el workflow, scripts npm y restricciones de base de datos.
2. Agregar los scripts portables `typecheck` y `test:e2e`; crear el runner que migra solo la base efímera, inicia Next una vez y deriva los puertos históricos de los smoke tests.
3. Crear el workflow de pull requests con Node 20, PostgreSQL 16 y Playwright Python, invocando los comandos en el orden especificado.
4. Ejecutar la validación local completa contra PostgreSQL descartable y revisar que ningún comando use Railway o producción.

Dependencias: 1 → 2 → 3 → 4. No se modifican migraciones, esquema, reglas de producto ni configuración externa de GitHub.

Riesgos y mitigación: los smoke tests usan puertos distintos; el runner los relaya a una sola instancia. Las pruebas que requieren persistencia usan `DATABASE_URL` definido exclusivamente por el entorno temporal de verificación. Todo error de subproceso se propaga al workflow.
