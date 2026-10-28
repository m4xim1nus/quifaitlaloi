// Géométrie de la frise : une colonne par mois, un carré par loi, empilés par chemin
// (contournements en haut, pour qu'on les voie et qu'on puisse les nommer).
import { CHEMINS, type Chemin } from './libelles';

export interface Marque<T> {
  loi: T;
  colonne: number;
  rang: number; // 0 = en bas (horizontal) ou à gauche (vertical)
}

export interface Mois {
  cle: string; // AAAA-MM
  index: number;
}

/** Tous les mois entre deux dates incluses, même vides. */
export function moisEntre(debut: string, fin: string): Mois[] {
  const out: Mois[] = [];
  let [a, m] = debut.slice(0, 7).split('-').map(Number);
  const [af, mf] = fin.slice(0, 7).split('-').map(Number);
  while (a < af || (a === af && m <= mf)) {
    out.push({ cle: `${a}-${String(m).padStart(2, '0')}`, index: out.length });
    m++;
    if (m > 12) {
      m = 1;
      a++;
    }
  }
  return out;
}

const ORDRE = new Map(CHEMINS.map((c, i) => [c, i]));

export function empiler<T extends { date_adoption: string; chemin: Chemin; id: string }>(
  lois: T[],
  mois: Mois[]
): Marque<T>[] {
  const index = new Map(mois.map((m) => [m.cle, m.index]));
  const parMois = new Map<number, T[]>();
  for (const l of lois) {
    const c = index.get(l.date_adoption.slice(0, 7));
    if (c === undefined) continue;
    parMois.set(c, [...(parMois.get(c) ?? []), l]);
  }
  const out: Marque<T>[] = [];
  for (const [colonne, ls] of parMois) {
    ls.sort(
      (x, y) =>
        ORDRE.get(x.chemin)! - ORDRE.get(y.chemin)! ||
        x.date_adoption.localeCompare(y.date_adoption) ||
        x.id.localeCompare(y.id)
    );
    ls.forEach((loi, rang) => out.push({ loi, colonne, rang }));
  }
  return out;
}

/** Position d'une date dans la suite des mois, en colonnes (fractionnaire). */
export function positionDate(date: string, mois: Mois[]): number {
  const [a, m, j] = date.split('-').map(Number);
  const i = mois.findIndex((x) => x.cle === `${a}-${String(m).padStart(2, '0')}`);
  const jours = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return (i < 0 ? 0 : i) + (j - 1) / jours;
}

/**
 * Étiquettes sans chevauchement : chaque étiquette prend la première ligne où elle ne touche
 * pas la précédente (x croissants, largeur estimée).
 */
export function lignesEtiquettes(items: { x: number; largeur: number }[], marge = 8): number[] {
  const fins: number[] = [];
  return items.map(({ x, largeur }) => {
    let l = fins.findIndex((f) => x >= f + marge);
    if (l < 0) {
      l = fins.length;
      fins.push(0);
    }
    fins[l] = x + largeur;
    return l;
  });
}
