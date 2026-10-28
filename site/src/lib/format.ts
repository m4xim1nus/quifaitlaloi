// Mise en forme française des dates et des nombres.

const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre'
];
const MOIS_COURTS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.'
];

const parties = (iso: string) => iso.slice(0, 10).split('-').map(Number);

/** « 8 juillet 2025 » (« 1er » le premier du mois). */
export function dateLongue(iso: string | null): string {
  if (!iso) return '';
  const [a, m, j] = parties(iso);
  return `${j === 1 ? '1er' : j} ${MOIS[m - 1]} ${a}`;
}

/** « 08/07/2025 ». */
export function dateCourte(iso: string | null): string {
  if (!iso) return '';
  const [a, m, j] = parties(iso);
  return `${String(j).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
}

/** « juil. 2025 ». */
export function moisAnnee(iso: string): string {
  const [a, m] = parties(iso);
  return `${MOIS_COURTS[m - 1]} ${a}`;
}

const ENTIER = new Intl.NumberFormat('fr-FR');
export const entier = (n: number) => ENTIER.format(n);

/** Pourcentage arrondi à l'unité, « 3 % » (espace insécable). */
export function pourcent(part: number, decimales = 0): string {
  return `${(part * 100).toFixed(decimales).replace('.', ',')} %`;
}

/** « 5 lois sur 148 » ; accorde le nom au premier nombre. */
export function surTotal(n: number, total: number, nom: [string, string]): string {
  return `${entier(n)} ${n > 1 ? nom[1] : nom[0]} sur ${entier(total)}`;
}
