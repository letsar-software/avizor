/**
 * Valor para <input type="datetime-local"> en hora LOCAL del navegador.
 * `toISOString().slice(0, 16)` da la hora UTC, que el input vuelve a leer como local:
 * en Argentina (UTC-3) eso corría 3 horas hacia el futuro el inicio de las alertas.
 */
export function localDateTimeInputValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
