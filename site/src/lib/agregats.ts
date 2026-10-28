// Agrégats de l'accueil, calculés dans le navigateur depuis les résumés de lois, pour suivre
// l'interrupteur « avec ou sans conventions ». Ils redonnent data/export/metriques.json
// (vérifié par agregats.test.ts).
import { CHEMINS, CLASSES, type Chemin } from './libelles';
import type { Classe, TypeLoi } from './types';

export interface LoiAgregeable {
  id: string;
  type: TypeLoi;
  date_adoption: string;
  chemin: Chemin;
  classe_an: Classe | null;
  pivots: string[];
}

export interface PeriodeRef {
  code: string;
  debut: string;
}

/** Code de la période qui contient la date (chaque période court jusqu'à la suivante). */
export function periodeDe(date: string, periodes: PeriodeRef[]): string {
  let code = periodes[0].code;
  for (const p of periodes) if (date >= p.debut) code = p.code;
  return code;
}

export const filtrer = <T extends { type: TypeLoi }>(lois: T[], conventions: boolean) =>
  conventions ? lois : lois.filter((l) => l.type !== 'convention');

export function parChemin<T extends Pick<LoiAgregeable, 'chemin'>>(lois: T[]): Record<Chemin, T[]> {
  const r = Object.fromEntries(CHEMINS.map((c) => [c, []])) as unknown as Record<Chemin, T[]>;
  for (const l of lois) r[l.chemin].push(l);
  return r;
}

/** Coalitions par période : comptes par classe, plus les lois sans scrutin AN (« sans_scrutin »). */
export function coalitionsParPeriode(lois: LoiAgregeable[], periodes: PeriodeRef[]) {
  return periodes.map((p) => {
    const ici = lois.filter((l) => periodeDe(l.date_adoption, periodes) === p.code);
    const comptes = Object.fromEntries(CLASSES.map((c) => [c, 0])) as Record<Classe, number>;
    let sansScrutin = 0;
    for (const l of ici) {
      if (l.classe_an) comptes[l.classe_an]++;
      else sansScrutin++;
    }
    return { code: p.code, total: ici.length, comptes, sansScrutin };
  });
}

/** Pivots hors socle : pour chaque groupe, les lois où il a fait la différence. */
export function pivots<T extends Pick<LoiAgregeable, 'pivots'>>(
  lois: T[]
): { groupe: string; lois: T[] }[] {
  const m = new Map<string, T[]>();
  for (const l of lois) for (const g of l.pivots) m.set(g, [...(m.get(g) ?? []), l]);
  return [...m]
    .map(([groupe, ls]) => ({ groupe, lois: ls }))
    .sort((a, b) => b.lois.length - a.lois.length || a.groupe.localeCompare(b.groupe));
}

/** Comptes par coalition (classes dans l'ordre d'affichage), plus les lois sans vote nominatif. */
export function comptesCoalitions<T extends Pick<LoiAgregeable, 'classe_an'>>(lois: T[]) {
  const parClasse = new Map<Classe, T[]>(CLASSES.map((c) => [c, []]));
  const sans: T[] = [];
  for (const l of lois) {
    if (l.classe_an) parClasse.get(l.classe_an)!.push(l);
    else sans.push(l);
  }
  return { parClasse, sans };
}

export type Vote =
  'pour' | 'abstention' | 'contre' | 'partage' | 'absent' | 'pas_censure' | 'censure';
export const VOTES: Vote[] = [
  'pour',
  'pas_censure',
  'abstention',
  'partage',
  'contre',
  'censure',
  'absent'
];

/**
 * Votes de chaque groupe sur les votes décisifs d'une législature : pour chaque sigle, le nombre
 * de lois par position. Les votes décisifs tenus sous une autre législature sont écartés (autres
 * groupes : une loi de la XVIIe votée à l'AN avant la dissolution).
 */
export function votesParGroupe(
  lois: { votes: Record<string, string>; leg_an: number | null }[],
  sigles: string[],
  legislature: number
) {
  return sigles
    .map((sigle) => {
      const comptes = Object.fromEntries(VOTES.map((v) => [v, 0])) as Record<Vote, number>;
      let n = 0;
      for (const l of lois) {
        if (l.leg_an !== legislature) continue;
        const v = l.votes[sigle] as Vote | undefined;
        if (!v) continue;
        comptes[v]++;
        n++;
      }
      return { sigle, comptes, n };
    })
    .filter((g) => g.n > 0);
}
