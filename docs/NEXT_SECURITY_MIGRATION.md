# Plan de migración de seguridad de Next.js

Fecha del análisis: 2026-08-24. No se modificó Next.js en esta tarea.

Fuentes:

- [`npm audit` sobre el lockfile actual](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [Advisories oficiales de `vercel/next.js`](https://github.com/vercel/next.js/security/advisories)
- [Next.js July 2026 Security Release](https://nextjs.org/blog)
- [Next.js 15.5 y cambios/deprecaciones](https://nextjs.org/blog/next-15-5)
- [Next.js 15 y compatibilidad](https://nextjs.org/blog/next-15)

## Recomendación

Versión mínima segura identificada hoy: **Next.js 15.5.21**, junto con `eslint-config-next@15.5.21`.

Razones:

- La publicación oficial de seguridad recomienda 15.5.21 como Maintenance LTS o 16.2.11 como Active LTS.
- Es el salto seguro más cercano desde 14.2.35; no es necesario saltar directamente a Next 16.
- Los metadatos npm de 15.5.21 permiten React 18.2 o React 19, por lo que Avizor puede conservar inicialmente React 18 y reducir el alcance.
- `eslint-config-next@15.5.21` usa `@next/eslint-plugin-next@15.5.21`, cuyo árbol usa `fast-glob` en lugar del `glob@10.3.10` vulnerable actual.

Advertencia temporal: Next anunció una publicación de seguridad programada para el **26 de agosto de 2026**. Antes de ejecutar esta migración o publicar Avizor, volver a consultar la versión parcheada vigente; 15.5.21 es la mínima segura según la información disponible el 24 de agosto, no una garantía futura.

## Estado de los siete paquetes HIGH

| Paquete | Versión instalada | Directa | Advisory/rango informado | Alcance probable en Avizor | Mínima corregida / resolución | Breaking change |
|---|---:|---|---|---|---|---|
| `next` | 14.2.35 | Sí | Múltiples advisories de DoS/RSC, cache confusion, request smuggling, SSRF y XSS; npm mantiene 14.2.35 dentro de rangos vulnerables hasta 15.5.21 según el advisory | **Sí para la familia RSC/DoS**: Avizor usa App Router. No se hallaron Server Actions, rewrites, middleware, nonces ni custom server; esos vectores concretos parecen no alcanzados. `next/image` se usa solo con assets locales. | 15.5.21 según release oficial actual | Sí, salto 14→15, aunque React 18 puede conservarse |
| `eslint-config-next` | 14.2.35 | Sí, dev | Rango npm `14.0.5-canary.0 - 15.0.0-rc.1`, afectado vía plugin/glob | Solo build/lint; no entra al runtime de producción | 15.5.21 recomendado para alinear con Next | Cambio mayor de configuración/deprecaciones |
| `@next/eslint-plugin-next` | 14.2.35 | Transitiva | Afectado vía `glob` | Solo lint local/CI; Avizor no expone el CLI a usuarios | 15.5.21; usa `fast-glob@3.3.1` | Viene con config 15 |
| `glob` | 10.3.10 y 7.2.3 | Transitiva | [GHSA-5j98-mcp5-4vw2](https://github.com/advisories/GHSA-5j98-mcp5-4vw2), vulnerable 10.2.0–10.4.5; command injection en CLI `-c/--cmd` | No alcanzado por requests; no se invoca glob CLI con input externo. Riesgo de toolchain | 10.5.0 para esa rama; se elimina la ruta principal al migrar config 15 | No directo |
| `brace-expansion` | 1.1.15, 2.1.1, 5.0.6 | Transitiva | [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp), [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg), [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | Inputs son patrones internos de lint/build, no datos HTTP. No alcanzado en runtime | 1.1.18, 2.1.4 y 5.0.9 según rama | No directo; resolver mediante árbol actualizado |
| `js-yaml` | 4.3.0 | Transitiva | [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj), consumo cuadrático en `!!omap`, rango 4.0.0–4.3.0 | ESLint/configuración local; Avizor no parsea YAML enviado por usuarios | 4.3.1 | No directo |
| `postcss` | 8.5.23 directo; 8.4.31 dentro de Next | Directa y transitiva | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93), [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q), [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp), [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) | El directo quedó corregido. La copia 8.4.31 está embebida en Next. Avizor no procesa CSS controlado por usuarios, pero el árbol sigue auditado | >8.5.22 para la rama actual; copia transitiva se resuelve migrando Next | No para directo; sí dentro del salto Next |

## Cambios esperables 14 → 15.5.21

- Revisar APIs asincrónicas de request (`params`, `searchParams`, cookies/headers) y ejecutar codemods solo en la rama de migración.
- Validar cambios de caché por defecto de `fetch`, Route Handlers y navegación cliente.
- Mantener React/ReactDOM inicialmente en 18.2+ para reducir variables; evaluar React 19 después.
- `next lint` está deprecado en 15.5. Cambiar el script a ESLint CLI siguiendo la guía oficial.
- Revisar configuración de imágenes. Avizor usa `next/image` con assets locales y no define `remotePatterns`.
- Probar params dinámicos en `app/api/**/[id]` y `app/resultado/[categoria]`.
- Revisar headers/CSP, generación estática y comportamiento self-hosted en Railway.

## Archivos previsiblemente afectados

- `package.json`, `package-lock.json`.
- Script `lint` y configuración ESLint.
- Route handlers con `params` dinámicos.
- Páginas dinámicas `app/resultado/[categoria]/page.tsx`.
- Posibles usos de APIs de request que detecten los codemods.
- `next.config.js` para compatibilidad de headers e imágenes.

## Plan de ejecución

1. Esperar/validar la publicación de seguridad anunciada para 2026-08-26 y recalcular la mínima segura.
2. Crear rama dedicada y etiqueta/commit de rollback.
3. Instalar exactamente `next@15.5.x` y `eslint-config-next@15.5.x` en la última versión segura; no usar `latest` sin revisar.
4. Mantener React 18 durante la primera migración.
5. Ejecutar el codemod de upgrade en modo revisable y auditar cada cambio.
6. Adaptar ESLint CLI sin relajar reglas.
7. Ejecutar typecheck, lint, 52+ tests, build y `npm audit`.
8. Ejecutar smoke/e2e sobre consulta, resultado compartido, detalle, metodología y todas las APIs.
9. Desplegar Railway Preview, verificar headers/caché/imágenes y observar logs/429/5xx.
10. Promover únicamente si no quedan HIGH explotables en runtime.

## Plan de rollback

1. Conservar lockfile y artefacto/deploy de la versión 14 anterior.
2. La migración no debe incluir cambios de schema de negocio.
3. Si Preview o producción falla, revertir el commit de dependencias/codemods y redeployar el artefacto previo.
4. No revertir `008_security_rate_limits.sql`: es compatible hacia atrás y no afecta la lógica agronómica.
5. Mantener monitoreo de 5xx, tiempos de respuesta, caché y rutas dinámicas durante la ventana de rollback.

## Resultado real de la migración — 2026-08-24

Estado: **MIGRACIÓN EJECUTADA Y VALIDADA LOCALMENTE**.

La recomendación original de 15.5.21 fue recalculada antes de modificar dependencias. El registro npm ya publicaba `15.5.23` como último backport de la rama Maintenance LTS, por lo que se instaló esa versión en lugar de 15.5.21. Se mantuvo React 18 para reducir el alcance y no se migró a Next 16.

Fuentes verificadas el día de ejecución:

- [Listado oficial de advisories de Next.js](https://github.com/vercel/next.js/security/advisories).
- [Blog oficial de Next.js](https://nextjs.org/blog): el release de julio establece 15.5.21 como piso corregido y el aviso del 20 de agosto anticipa un parche crítico para 15.5/16.3 el 26 de agosto.
- Metadatos publicados en npm: `next@15.5.23`, `eslint-config-next@15.5.23` y Node.js compatible `^18.18 || ^19.8 || >=20` para Next 15.5.

### Versiones resultantes

| Dependencia | Antes | Después | Motivo |
|---|---:|---:|---|
| `next` | 14.2.35 | 15.5.23 | Último backport publicado de Maintenance LTS; supera el piso de seguridad 15.5.21 |
| `eslint-config-next` | 14.2.35 | 15.5.23 | Alineación exacta con Next |
| `@next/eslint-plugin-next` | 14.2.35 | 15.5.23 | Transitiva de la configuración |
| `postcss` | 8.5.23 directo + 8.4.31 anidado | 8.5.26 único | Elimina las copias afectadas; override al paquete directo |
| `sharp` | 0.35.2 directo + versión vulnerable anidada | 0.35.3 único | Elimina la copia transitiva afectada; override al paquete directo |
| `brace-expansion` | ramas vulnerables | 1.1.18 y 5.0.9 | Actualización compatible de auditoría |
| `js-yaml` | 4.3.0 | 4.3.1 | Actualización compatible de auditoría |

No se usó `npm audit fix --force`. `npm audit fix` sólo actualizó paquetes transitivos dentro de rangos compatibles.

### Breaking changes encontrados y adaptación

- Next 15 tipa `params` de páginas y Route Handlers dinámicos como `Promise`. Se actualizaron seis Route Handlers y `app/resultado/[categoria]/page.tsx` para esperar esos parámetros. No cambió ningún body, status, validación o contrato de respuesta.
- `next lint` está deprecado. El script se cambió a `eslint . --max-warnings 0`, conservando `next/core-web-vitals` y sin relajar reglas.
- Next 15 agregó `target: ES2017` a TypeScript para sus requisitos de compilación.
- La detección de workspace eligió por error un lockfile fuera del repositorio y causó `EPERM` durante el trazado. `outputFileTracingRoot: __dirname` limita el build a Avizor; no altera rutas ni comportamiento HTTP.
- No se requirieron cambios de React, App Router, cache, imágenes, reglas agronómicas, clima, rate limiting, Zod ni contratos.

### Evidencia final

| Verificación | Resultado |
|---|---|
| `npm test` | PASS — 56/56, 0 deshabilitados |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS — 0 warnings, 0 errores |
| `npm run build` | PASS — Next 15.5.23, 30 páginas generadas y rutas API dinámicas compiladas |
| `npm audit` | PASS — 0 vulnerabilidades conocidas |
| Headers en servidor compilado | PASS — CSP, `nosniff` y HSTS presentes; home 200 |
| Body >32 KiB | PASS en tests 37/38 — 413 antes de parseo y contrato de error preservado |
| Zod y rate limiter | PASS en tests 31–43 |

El smoke local del endpoint protegido devolvió 503 fail-closed por ausencia deliberada de configuración PostgreSQL/rate-limit de producción; por eso la evidencia 413 proviene de los tests directos del helper y del Route Handler, que ejercitan el streaming completo sin depender de Railway.

### Riesgo temporal y decisión

La auditoría npm queda limpia contra la base publicada al ejecutar esta tarea. Sin embargo, Next.js anunció que el **26 de agosto de 2026** publicará un parche para una vulnerabilidad crítica que afecta las ramas 15.5 y 16.3. Todavía no existe una versión corregida públicamente identificada en ese aviso. Antes de cualquier publicación se debe instalar el nuevo patch 15.5, repetir toda esta matriz y volver a consultar advisories.

La migración queda técnicamente aprobada **con observaciones**; Avizor no queda aprobado para producción por el parche anunciado y por los controles operativos pendientes de `RAILWAY_SECURITY_CHECKLIST.md`.
