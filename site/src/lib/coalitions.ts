// Page Coalitions (cycle Coalitions, docs/CONCEPTION.md, section « Cycle Coalitions ») :
// chronologie des coalitions et des groupes décisifs, un carré par loi, par trimestre
// d'adoption définitive. Fonctions pures, testées dans coalitions.test.ts.
import { periodeDe, type PeriodeRef } from './agregats';
import type { Classe } from './types';

/** Ligne d'empilement : une classe de coalition, ou l'absence de vote nominatif. */
export type Pile = Classe | 'aucune';

/**
 * Empilement de part et d'autre de l'axe (ordre fixe, qui ne bouge pas avec les filtres).
 * Au-dessus, les textes disputés, de bas en haut : le socle sans appui au pied, puis ses
 * appuis, « socle + gauche + RN » entre la gauche et le RN pour garder côte à côte tout ce qui
 * inclut l'un ou l'autre. La hauteur au-dessus de l'axe est le nombre de textes disputés.
 */
export const DISPUTES: Pile[] = [
  'socle_seul',
  'socle_droite',
  'socle_gauche',
  'transpartisan',
  'socle_rn',
  'hors_socle'
];
/** Sous l'axe, de haut en bas : aucun bloc contre, puis les lois sans vote nominatif. */
export const DESSOUS: Pile[] = ['consensus', 'aucune'];
export const PILE: Pile[] = [...DISPUTES, ...DESSOUS];

export const pileDe = (l: { classe_an: Classe | null }): Pile => l.classe_an ?? 'aucune';

export interface Trimestre {
  /** « 2025-T2 » */
  cle: string;
  annee: number;
  /** 1 à 4 */
  t: number;
  index: number;
}

/** « 2025-T2 » pour une date ISO. */
export function trimestre(date: string): string {
  const [a, m] = date.slice(0, 7).split('-').map(Number);
  return `${a}-T${Math.floor((m - 1) / 3) + 1}`;
}

/** Tous les trimestres entre deux dates incluses, même vides. */
export function trimestresEntre(debut: string, fin: string): Trimestre[] {
  const [a0, t0] = trimestre(debut).split('-T').map(Number);
  const [a1, t1] = trimestre(fin).split('-T').map(Number);
  const out: Trimestre[] = [];
  for (let a = a0, t = t0; a < a1 || (a === a1 && t <= t1); t === 4 ? (a++, (t = 1)) : t++)
    out.push({ cle: `${a}-T${t}`, annee: a, t, index: out.length });
  return out;
}

/** Position fractionnaire d'une date dans la suite des trimestres (en colonnes). */
export function positionTrimestre(date: string, trimestres: Trimestre[]): number {
  const [a, m, j] = date.slice(0, 10).split('-').map(Number);
  const i = trimestres.findIndex((x) => x.cle === trimestre(date));
  const debut = Date.UTC(a, Math.floor((m - 1) / 3) * 3, 1);
  const fin = Date.UTC(a, Math.floor((m - 1) / 3) * 3 + 3, 1);
  return (i < 0 ? 0 : i) + (Date.UTC(a, m - 1, j) - debut) / (fin - debut);
}

export interface Marque<T> {
  loi: T;
  colonne: number;
  /** 0 = en bas de la colonne (ou à gauche, à l'horizontale). */
  rang: number;
}

export interface MarqueCoalition<T> extends Marque<T> {
  /** Au-dessus de l'axe (texte disputé) ou en dessous. */
  cote: 'haut' | 'bas';
}

/**
 * Une colonne par trimestre. Au-dessus de l'axe, les textes disputés dans l'ordre de DISPUTES
 * (rang 0 contre l'axe) ; en dessous, ceux de DESSOUS. Les lois sans vote nominatif commencent
 * une nouvelle rangée de `parRangee` carrés, pour rester séparées de « aucun bloc contre ».
 */
export function empilerCoalitions<
  T extends { id: string; date_adoption: string; classe_an: Classe | null }
>(lois: T[], trimestres: Trimestre[], parRangee = 1): MarqueCoalition<T>[] {
  const index = new Map(trimestres.map((t) => [t.cle, t.index]));
  const ordre = new Map(PILE.map((p, i) => [p, i]));
  const parCol = new Map<number, T[]>();
  for (const l of lois) {
    const c = index.get(trimestre(l.date_adoption));
    if (c !== undefined) parCol.set(c, [...(parCol.get(c) ?? []), l]);
  }
  const out: MarqueCoalition<T>[] = [];
  for (const [colonne, ls] of parCol) {
    ls.sort(
      (x, y) =>
        ordre.get(pileDe(x))! - ordre.get(pileDe(y))! ||
        x.date_adoption.localeCompare(y.date_adoption) ||
        x.id.localeCompare(y.id)
    );
    let haut = 0;
    let bas = 0;
    let sansVote = false;
    for (const loi of ls) {
      if (DISPUTES.includes(pileDe(loi))) {
        out.push({ loi, colonne, rang: haut++, cote: 'haut' });
        continue;
      }
      if (pileDe(loi) === 'aucune' && !sansVote) {
        sansVote = true;
        bas = Math.ceil(bas / parRangee) * parRangee;
      }
      out.push({ loi, colonne, rang: bas++, cote: 'bas' });
    }
  }
  return out;
}

export interface LoiDecisive {
  id: string;
  date_adoption: string;
  classe_an: Classe | null;
  /** Groupes hors socle décisifs par leur vote. */
  pivots: string[];
  /** Groupes hors socle décisifs par leur abstention. */
  pivots_abst_hors_socle: string[];
}

export type Poids = 'vote' | 'abstention';

/** Comment le groupe a été décisif sur la loi, ou null (le vote l'emporte sur l'abstention). */
export function poidsDe(l: LoiDecisive, sigle: string): Poids | null {
  if (l.pivots.includes(sigle)) return 'vote';
  if (l.pivots_abst_hors_socle.includes(sigle)) return 'abstention';
  return null;
}

/**
 * Une rangée par groupe décisif : ses lois, rangées par trimestre (les décisives par leur vote
 * d'abord, puis par date). Seuls les groupes décisifs au moins une fois, dans l'ordre donné.
 */
export function rangeesDecisives<T extends LoiDecisive>(
  lois: T[],
  sigles: string[],
  trimestres: Trimestre[]
): { sigle: string; marques: (Marque<T> & { poids: Poids })[]; vote: number; abst: number }[] {
  const index = new Map(trimestres.map((t) => [t.cle, t.index]));
  return sigles
    .map((sigle) => {
      const parCol = new Map<number, { loi: T; poids: Poids }[]>();
      for (const loi of lois) {
        const poids = poidsDe(loi, sigle);
        const c = index.get(trimestre(loi.date_adoption));
        if (!poids || c === undefined) continue;
        parCol.set(c, [...(parCol.get(c) ?? []), { loi, poids }]);
      }
      const marques: (Marque<T> & { poids: Poids })[] = [];
      for (const [colonne, ls] of parCol) {
        ls.sort(
          (x, y) =>
            Number(x.poids === 'abstention') - Number(y.poids === 'abstention') ||
            x.loi.date_adoption.localeCompare(y.loi.date_adoption) ||
            x.loi.id.localeCompare(y.loi.id)
        );
        ls.forEach((x, rang) => marques.push({ ...x, colonne, rang }));
      }
      return {
        sigle,
        marques,
        vote: marques.filter((m) => m.poids === 'vote').length,
        abst: marques.filter((m) => m.poids === 'abstention').length
      };
    })
    .filter((r) => r.marques.length > 0);
}

/** Nombre de lois votées nominativement (avec une coalition) par trimestre. */
export function voteesParTrimestre(
  lois: { date_adoption: string; classe_an: Classe | null }[],
  trimestres: Trimestre[]
): number[] {
  const n = trimestres.map(() => 0);
  const index = new Map(trimestres.map((t) => [t.cle, t.index]));
  for (const l of lois) {
    const c = index.get(trimestre(l.date_adoption));
    if (c !== undefined && l.classe_an) n[c]++;
  }
  return n;
}

export interface FrequencePeriode {
  code: string;
  /** Lois de la période. */
  lois: number;
  /** Lois votées nominativement (avec une coalition) : le dénominateur. */
  votees: number;
  /** Textes disputés : votés nominativement, avec au moins un bloc contre. */
  disputees: number;
  /** Comptes par classe (et « aucune »). */
  piles: Record<Pile, number>;
  /** Lois avec au moins un groupe hors socle décisif par son vote. */
  avecDecisif: number;
  /** Par sigle : lois où le groupe est décisif par son vote. */
  decisifs: Record<string, number>;
}

/**
 * Comptes par période charnière : coalitions, dénominateur des lois votées, groupes décisifs.
 * Les périodes sans aucune loi sont omises.
 */
export function parPeriode(lois: LoiDecisive[], periodes: PeriodeRef[]): FrequencePeriode[] {
  return periodes
    .map((p) => {
      const ici = lois.filter((l) => periodeDe(l.date_adoption, periodes) === p.code);
      const piles = Object.fromEntries(PILE.map((k) => [k, 0])) as Record<Pile, number>;
      const decisifs: Record<string, number> = {};
      for (const l of ici) {
        piles[pileDe(l)]++;
        for (const g of l.pivots) decisifs[g] = (decisifs[g] ?? 0) + 1;
      }
      const votees = ici.filter((l) => l.classe_an).length;
      return {
        code: p.code,
        lois: ici.length,
        votees,
        disputees: votees - piles.consensus,
        piles,
        avecDecisif: ici.filter((l) => l.pivots.length > 0).length,
        decisifs
      };
    })
    .filter((p) => p.lois > 0);
}
