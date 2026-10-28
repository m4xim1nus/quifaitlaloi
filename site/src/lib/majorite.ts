// Contre-factuels du groupe décisif (docs/METHODO.md §10), pour les phrases et la barre de
// majorité de la fiche. Au scrutin public, un texte est adopté si les « pour » dépassent la
// moitié des suffrages exprimés, c'est-à-dire s'ils dépassent les « contre » : retirer les
// « pour » d'un groupe (reportés en abstention) change aussi le seuil.
import type { PositionGroupe, Scrutin } from './types';

type Decompte = Pick<Scrutin, 'pour' | 'contre' | 'requis' | 'sort'>;

/** Le texte sans les « pour » du groupe : nouveaux totaux et issue. */
export function sansLesVoix(s: Decompte, g: Pick<PositionGroupe, 'pour'>) {
  const pour = s.pour - g.pour;
  return { pour, contre: s.contre, adopte: pour > s.contre };
}

/** La censure si tout le groupe l'avait votée : voix obtenues face à la majorité requise. */
export function censureAvec(s: Decompte, g: Pick<PositionGroupe, 'pour' | 'membres'>) {
  const pour = s.pour + (g.membres - g.pour);
  return { pour, requis: s.requis, adoptee: pour >= s.requis };
}
