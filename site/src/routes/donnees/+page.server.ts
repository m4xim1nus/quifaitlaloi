import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { base, EXPORT } from '$lib/server/donnees';
import { dateDonnees } from '$lib/server/vues';

export const load = () => {
  const b = base();
  const taille = (f: string) => statSync(resolve(EXPORT, f)).size;
  return {
    date: dateDonnees(),
    genere: b.meta.genere_le,
    sources: b.meta.sources,
    comptes: b.meta.comptes,
    tailles: Object.fromEntries(
      [
        'lois.csv',
        'lectures.csv',
        'scrutins.csv',
        'positions_groupes.csv',
        'signatures.csv',
        'groupes.csv',
        'evenements.csv',
        'en_cours.csv',
        'en_cours_lectures.csv',
        'en_cours_evenements.csv',
        'metriques.json',
        'meta.json'
      ].map((f) => [f, taille(f)])
    ),
    tailleSqlite: statSync(resolve(EXPORT, '../qfl.sqlite')).size
  };
};
