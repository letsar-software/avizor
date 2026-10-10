const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function sharedResultPath(token: string) {
  if (!TOKEN_PATTERN.test(token)) throw new Error("Token de resultado inválido");
  return `/resultado/compartido/${token}`;
}

export function resultShareLinks(origin: string, token: string) {
  const base = new URL(origin);
  if (base.protocol !== "https:" && base.protocol !== "http:") throw new Error("Origen inválido");
  const resultUrl = new URL(sharedResultPath(token), base.origin).href;
  const whatsappText = `Te comparto este resultado de Avizor 🌱\nPodés consultarlo acá: ${resultUrl}`;
  const emailBody = `Te comparto un resultado generado en Avizor.\n\nPodés consultarlo acá: ${resultUrl}\n\nAvizor · La señal antes del problema.`;
  return {
    resultUrl,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
    email: `mailto:?subject=${encodeURIComponent("Resultado de Avizor")}&body=${encodeURIComponent(emailBody)}`,
  };
}
