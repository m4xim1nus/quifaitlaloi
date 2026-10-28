// Liens vers les sources primaires d'un scrutin.

/** VTANR5L17V2957 → page du scrutin sur le site de l'AN ; SN2024-335 → page du Sénat. */
export function lienScrutin(id: string): string | null {
  const an = /^VTANR5L(\d+)V(\d+)$/.exec(id);
  if (an) return `https://www.assemblee-nationale.fr/dyn/${an[1]}/scrutins/${an[2]}`;
  const sn = /^SN(\d{4})-(\d+)$/.exec(id);
  if (sn) return `https://www.senat.fr/scrutin-public/${sn[1]}/scr${sn[1]}-${sn[2]}.html`;
  return null;
}

/** Numéro lisible d'un scrutin : « scrutin n° 2957 ». */
export function numeroScrutin(id: string): string {
  const m = /(\d+)$/.exec(id);
  return m ? `scrutin n° ${m[1]}` : id;
}
