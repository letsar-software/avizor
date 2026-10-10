# Compartir resultado

Implementado el 10 de octubre de 2026, después de definir con el usuario la URL pública que faltaba.

## Comportamiento

La pantalla de Resultados incluye una sección compacta **Compartir resultado**, con el texto **Compartí este análisis con otra persona.** y las acciones **WhatsApp** y **Correo**.

- WhatsApp abre `https://wa.me/?text=...` con el mensaje solicitado y el enlace.
- Correo abre `mailto:` con asunto y cuerpo precompletados, sin destinatario.
- Avizor no envía mensajes ni correos desde el backend y no solicita contactos.
- Los botones tienen al menos 44 px de altura; ocupan el ancho disponible en mobile y se ajustan al contenido en desktop.

WhatsApp:

> Te comparto este resultado de Avizor 🌱
> Podés consultarlo acá: [LINK_RESULTADO]

Correo, asunto **Resultado de Avizor**:

> Te comparto un resultado generado en Avizor.
>
> Podés consultarlo acá: [LINK_RESULTADO]
>
> Avizor · La señal antes del problema.

## URL pública y persistencia

La URL canónica es `/resultado/compartido/[share_token]`.

El servicio ya persistía el resultado de cada consulta en PostgreSQL. La nueva página recupera ese snapshot mediante `lib/consultas/public-result.ts`, reutilizado también por `GET /api/public/consultas/[id]`. No se agregaron migraciones.

- El token identifica y autoriza la lectura del resultado; no se usa el ID interno como credencial.
- Se conserva el vencimiento existente de 30 días, evaluado contra `created_at` en PostgreSQL.
- La fecha de generación, el período analizado y las evaluaciones son los originales; abrir el enlace no ejecuta otra consulta climática.
- La API responde 404 para recursos inexistentes y 410 para enlaces vencidos. La página presenta estados amigables de enlace inexistente, vencido y error temporal.
- La página es dinámica, con metadata de no indexación y referencia `no-referrer`.
- Los resultados no persistidos no ofrecen enlaces de compartir.
- Se recupera el ID de la fila porque el snapshot histórico puede tener `id: null`: se serializaba antes de asignar el ID devuelto por el INSERT.

## Navegación y sesiones

Los detalles conservan la identidad del resultado:

```text
/resultado/compartido/[share_token]/enfermedades_foliares
/resultado/compartido/[share_token]/heladas
/resultado/compartido/[share_token]/estres_hidrico
/resultado/compartido/[share_token]/exceso_hidrico
/resultado/compartido/[share_token]/plagas
/resultado/compartido/[share_token]/fenologia
```

La vista compartida recibe el resultado del servidor y prevalece sobre cualquier otro resultado guardado en la pestaña. No escribe el snapshot compartido en `sessionStorage`. Se puede navegar y recargar cualquier detalle desde una sesión nueva.

La vista compartida es de solo lectura. Para actualizarla se inicia una nueva consulta. El recálculo del resultado local conserva el flujo existente: crea una consulta nueva y los botones pasan a compartir su token nuevo.

## Bloqueo inicial resuelto

Antes de este cambio, `/resultado` cargaba exclusivamente `sessionStorage.avizor_resultado`. Ese enlace no identificaba una consulta y podía mostrar otro resultado o ninguno en el dispositivo receptor. El componente heredado de compartir tampoco estaba integrado en V2.

Se documentó el bloqueo conforme al criterio 10 y el usuario autorizó crear la ruta pública antes de implementar las acciones.

## Verificación

- Suite: 191 tests aprobados, cero fallos.
- TypeScript sin emisión: aprobado.
- ESLint: aprobado.
- Build de producción: aprobado en una copia temporal del repo, sin interrumpir el servidor de desarrollo.
- Chrome con contextos aislados a 390 y 1440 px: probado contra snapshots temporales realmente persistidos en PostgreSQL local.
- Verificados: mensajes y URL exactos, sesión vacía, sesión con resultado distinto, navegación y recarga de todos los detalles, vencimiento y consulta inexistente, ausencia de enlaces para resultado no persistido, dimensiones táctiles y ausencia de desbordamiento horizontal.
- Verificado que ambos enlaces cambian al recalcular, usando una respuesta controlada con una segunda consulta persistida.
- No se enviaron mensajes ni correos reales. La apertura final depende de las aplicaciones configuradas por la persona.
- Las consultas temporales de las pruebas se eliminaron al finalizar.

## Uso local y despliegue

Realizar una consulta en `/consultar` y buscar la sección al final de Resultados. Los enlaces utilizan el origen de la aplicación: en desarrollo apuntan a `localhost`; para abrirlos desde otros dispositivos externos se necesita desplegar estos cambios en el dominio público, con acceso a la misma base donde se guardó la consulta. No se desplegó a Railway durante esta implementación.
