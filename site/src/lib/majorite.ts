// Contre-factuels du groupe décisif (docs/METHODO.md §10, règle du basculement), pour la barre
// de majorité de la fiche. Au scrutin public, un texte est adopté si les « pour » dépassent la
// moitié des suffrages exprimés, c'est-à-dire s'ils dépassent les « contre » : on fait voter
// contre les « pour » du groupe, les exprimés ne changent pas.
import type { PositionGroupe, Scrutin } from './types';

type Decompte = Pick<Scrutin, 'pour' | 'contre' | 'requis' | 'sort'>;

/** Le texte si les « pour » du groupe avaient voté contre : nouveaux totaux et issue. */
export function siContre(s: Decompte, g: Pick<PositionGroupe, 'pour'>) {
  const pour = s.pour - g.pour;
  const contre = s.contre + g.pour;
  return { pour, contre, adopte: pour > contre };
}

/** La censure si tout le groupe l'avait votée : voix obtenues face à la majorité requise. */
export function censureAvec(s: Decompte, g: Pick<PositionGroupe, 'pour' | 'membres'>) {
  const pour = s.pour + (g.membres - g.pour);
  return { pour, requis: s.requis, adoptee: pour >= s.requis };
}
