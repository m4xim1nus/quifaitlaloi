// Filtres de l'explorateur, lus et écrits dans l'URL (?chemin=art_49_3&coalition=socle_rn…).
import { periodeDe } from './agregats';
import type { Chemin } from './libelles';
import type { Classe, TypeLoi } from './types';

export interface Filtres {
  texte: string;
  chemin: Chemin | '';
  coalition: Classe | 'aucune' | '';
  periode: string;
  type: TypeLoi | '';
  decisif: string;
  conventions: boolean;
}

export const VIDES: Filtres = {
  texte: '',
  chemin: '',
  coalition: '',
  periode: '',
  type: '',
  decisif: '',
  conventions: false
};

export function lireFiltres(p: URLSearchParams): Filtres {
  return {
    texte: p.get('q') ?? '',
    chemin: (p.get('chemin') ?? '') as Filtres['chemin'],
    coalition: (p.get('coalition') ?? '') as Filtres['coalition'],
    periode: p.get('periode') ?? '',
    type: (p.get('type') ?? '') as Filtres['type'],
    decisif: p.get('decisif') ?? '',
    conventions: p.get('conventions') === '1' || p.get('type') === 'convention'
  };
}

export function ecrireFiltres(f: Filtres): string {
  const p = new URLSearchParams();
  if (f.texte) p.set('q', f.texte);
  if (f.chemin) p.set('chemin', f.chemin);
  if (f.coalition) p.set('coalition', f.coalition);
  if (f.periode) p.set('periode', f.periode);
  if (f.type) p.set('type', f.type);
  if (f.decisif) p.set('decisif', f.decisif);
  if (f.conventions) p.set('conventions', '1');
  const s = p.toString();
  return s ? `?${s}` : '';
}

const plier = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export interface Filtrable {
  id: string;
  titre_court: string;
  type: TypeLoi;
  date_adoption: string;
  chemin: Chemin;
  classe_an: Classe | null;
  pivots: string[];
}

export function appliquer<T extends Filtrable>(
  lois: T[],
  f: Filtres,
  periodes: { code: string; debut: string }[]
): T[] {
  const mots = plier(f.texte).split(/\s+/).filter(Boolean);
  return lois.filter(
    (l) =>
      (f.conventions || l.type !== 'convention') &&
      (!f.chemin || l.chemin === f.chemin) &&
      (!f.coalition || (l.classe_an ?? 'aucune') === f.coalition) &&
      (!f.periode || periodeDe(l.date_adoption, periodes) === f.periode) &&
      (!f.type || l.type === f.type) &&
      (!f.decisif || l.pivots.includes(f.decisif)) &&
      mots.every((m) => plier(`${l.titre_court} ${l.id}`).includes(m))
  );
}
