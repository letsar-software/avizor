// Bump de versión al crear un fork de una regla (RN-004: una vigente no se edita
// in place, se versiona). Separado de la ruta para poder testearlo sin tocar la base.
export function nextVersion(version: string): string {
  const match = /^(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) return `${version}.1`;
  const [, major, minor] = match;
  return `${major}.${Number(minor) + 1}`;
}
