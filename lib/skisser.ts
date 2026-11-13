// Inbyggda principskisser.
//
// Skissen ritas som SVG i appen och har ingen fil i bildbucketen. När ett
// uppdrag skapas från en sådan övning sparas en markör i stället för en
// bildsökväg: "lokal:<skiss-id>". Vyerna känner igen markören och ritar
// skissen direkt, så eleven slipper ladda ner något.

export type SkissId = "system-cirkulation";

export const SKISS_PREFIX = "lokal:";

export function arLokalSkiss(varde?: string | null): boolean {
  return typeof varde === "string" && varde.startsWith(SKISS_PREFIX);
}

export function skissId(varde?: string | null): SkissId | null {
  if (!arLokalSkiss(varde)) return null;
  const id = varde!.slice(SKISS_PREFIX.length);
  return id === "system-cirkulation" ? id : null;
}

export function referensForSkiss(id: SkissId): string {
  return SKISS_PREFIX + id;
}
