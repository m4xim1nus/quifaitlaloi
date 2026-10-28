import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { csvParse } from 'd3-dsv';
import { describe, expect, it } from 'vitest';
import {
  PILE,
  empilerCoalitions,
  parPeriode,
  poidsDe,
  positionTrimestre,
  rangeesDecisives,
  trimestre,
  trimestresEntre,
  voteesParTrimestre,
  type LoiDecisive
} from './coalitions';
import { filtrer } from './agregats';
import type { Classe, TypeLoi } from './types';

const loi = (
  id: string,
  date_adoption: string,
  classe_an: Classe | null,
  pivots: string[] = [],
  pivots_abst_hors_socle: string[] = []
): LoiDecisive => ({ id, date_adoption, classe_an, pivots, pivots_abst_hors_socle });

describe('trimestres', () => {
  it('nomme le trimestre d’une date', () => {
    expect(trimestre('2024-12-05')).toBe('2024-T4');
    expect(trimestre('2025-01-01')).toBe('2025-T1');
    expect(trimestre('2025-06-30')).toBe('2025-T2');
  });

  it('énumère les trimestres, même vides, à cheval sur les années', () => {
    const t = trimestresEntre('2024-07-18', '2025-04-02');
    expect(t.map((x) => x.cle)).toEqual(['2024-T3', '2024-T4', '2025-T1', '2025-T2']);
    expect(t.map((x) => x.index)).toEqual([0, 1, 2, 3]);
    expect(trimestresEntre('2017-06-27', '2026-10-28')).toHaveLength(39);
  });

  it('place une date dans son trimestre', () => {
    const t = trimestresEntre('2024-07-01', '2025-12-31');
    expect(positionTrimestre('2024-07-01', t)).toBe(0);
    expect(positionTrimestre('2024-10-01', t)).toBe(1);
    const censure = positionTrimestre('2024-12-05', t);
    expect(censure).toBeGreaterThan(1.7);
    expect(censure).toBeLessThan(1.75);
  });
});

describe('empilement des coalitions', () => {
  it('empile les textes disputés au-dessus de l’axe, le reste en dessous, dans l’ordre fixe', () => {
    const t = trimestresEntre('2025-01-01', '2025-06-30');
    const m = empilerCoalitions(
      [
        loi('a', '2025-02-01', 'consensus'),
        loi('b', '2025-01-15', null),
        loi('c', '2025-03-01', 'socle_rn'),
        loi('d', '2025-01-20', 'socle_seul'),
        loi('g', '2025-01-21', 'transpartisan'),
        loi('e', '2025-05-01', 'socle_gauche'),
        loi('f', '2024-12-01', 'socle_gauche')
      ],
      t,
      2
    );
    const col0 = (cote: string) =>
      m
        .filter((x) => x.colonne === 0 && x.cote === cote)
        .sort((x, y) => x.rang - y.rang)
        .map((x) => [x.loi.id, x.rang]);
    expect(col0('haut')).toEqual([
      ['d', 0],
      ['g', 1],
      ['c', 2]
    ]);
    // les lois sans vote nominatif ouvrent une nouvelle rangée de deux carrés
    expect(col0('bas')).toEqual([
      ['a', 0],
      ['b', 2]
    ]);
    expect(m.find((x) => x.loi.id === 'e')).toMatchObject({ colonne: 1, rang: 0, cote: 'haut' });
    expect(m.find((x) => x.loi.id === 'f')).toBeUndefined();
  });

  it('couvre toutes les classes', () => {
    expect(PILE).toHaveLength(8);
  });
});

describe('groupes décisifs', () => {
  const lois = [
    loi('a', '2025-02-01', 'socle_rn', ['RN']),
    loi('b', '2025-02-10', 'transpartisan', ['RN', 'SOC']),
    loi('c', '2025-01-05', 'socle_gauche', [], ['SOC']),
    loi('d', '2025-04-01', 'socle_rn', ['RN'], ['RN']),
    loi('e', '2025-04-02', 'consensus')
  ];
  const t = trimestresEntre('2025-01-01', '2025-06-30');

  it('distingue le vote de l’abstention, le vote l’emportant', () => {
    expect(poidsDe(lois[2], 'SOC')).toBe('abstention');
    expect(poidsDe(lois[3], 'RN')).toBe('vote');
    expect(poidsDe(lois[4], 'RN')).toBeNull();
  });

  it('range les lois de chaque groupe par trimestre, votes d’abord, et omet les groupes jamais décisifs', () => {
    const r = rangeesDecisives(lois, ['LFI-NFP', 'SOC', 'RN'], t);
    expect(r.map((x) => [x.sigle, x.vote, x.abst])).toEqual([
      ['SOC', 1, 1],
      ['RN', 3, 0]
    ]);
    const soc = r[0].marques.sort((x, y) => x.rang - y.rang);
    expect(soc.map((x) => [x.loi.id, x.colonne, x.rang, x.poids])).toEqual([
      ['b', 0, 0, 'vote'],
      ['c', 0, 1, 'abstention']
    ]);
  });

  it('compte les lois votées nominativement par trimestre', () => {
    expect(voteesParTrimestre([...lois, loi('f', '2025-05-01', null)], t)).toEqual([3, 2]);
  });
});

describe('comptes par période', () => {
  const periodes = [
    { code: 'p1', debut: '2024-01-01' },
    { code: 'vide', debut: '2024-06-01' },
    { code: 'p2', debut: '2025-01-01' }
  ];
  it('compte coalitions, dénominateur et groupes décisifs, sans les périodes vides', () => {
    const r = parPeriode(
      [
        loi('a', '2024-02-01', 'socle_seul'),
        loi('b', '2024-03-01', null),
        loi('c', '2025-02-01', 'socle_rn', ['RN']),
        loi('d', '2025-03-01', 'transpartisan', ['RN', 'SOC']),
        loi('e', '2025-03-02', 'consensus')
      ],
      periodes
    );
    expect(r.map((p) => p.code)).toEqual(['p1', 'p2']);
    expect(r[0]).toMatchObject({ lois: 2, votees: 1, disputees: 1, avecDecisif: 0 });
    expect(r[0].piles.aucune).toBe(1);
    expect(r[1]).toMatchObject({ lois: 3, votees: 3, disputees: 2, avecDecisif: 2 });
    expect(r[1].decisifs).toEqual({ RN: 2, SOC: 1 });
  });
});

// Contrôle croisé avec le pipeline (metriques.json, métriques 2 et 3, grain « période »).
describe('comptes par période (données réelles)', () => {
  const EXPORT = resolve(import.meta.dirname, '../../../data/export');
  const metriques = JSON.parse(readFileSync(resolve(EXPORT, 'metriques.json'), 'utf8'));
  const toutes = csvParse(readFileSync(resolve(EXPORT, 'lois.csv'), 'utf8')).map((r) => ({
    ...loi(
      r.id!,
      r.date_adoption!,
      (r.classe_an || null) as Classe | null,
      r.pivots_hors_socle_an ? r.pivots_hors_socle_an.split(',') : []
    ),
    type: r.type as TypeLoi
  }));

  for (const [vue, conv] of [
    ['toutes', true],
    ['hors_conventions', false]
  ] as const) {
    const calc = parPeriode(filtrer(toutes, conv), metriques.periodes);

    it(`redonne les coalitions AN par période (${vue})`, () => {
      const ref = metriques.coalitions.filter(
        (r: { chambre: string; vue: string; grain: string }) =>
          r.chambre === 'AN' && r.vue === vue && r.grain === 'periode'
      ) as { cle: string; classe: string; lois: number }[];
      // « main_levee » et « sans_scrutin » (délai expiré) sont réunis en « aucune »
      const attendu = new Map<string, number>();
      for (const r of ref) {
        const k = `${r.cle} ${r.classe === 'main_levee' || r.classe === 'sans_scrutin' ? 'aucune' : r.classe}`;
        attendu.set(k, (attendu.get(k) ?? 0) + r.lois);
      }
      for (const p of calc)
        for (const k of PILE)
          expect(p.piles[k], `${p.code} ${k}`).toBe(attendu.get(`${p.code} ${k}`) ?? 0);
      expect(calc.length).toBe(new Set(ref.map((r) => r.cle)).size);
    });

    it(`redonne les groupes décisifs hors socle par période (${vue})`, () => {
      // groupes jamais dans le socle (la Droite républicaine l'est sous la XVIIe : exclue)
      const SIGLES = ['RN', 'SOC', 'LFI-NFP', 'ECOS', 'LIOT', 'NI', 'UDR', 'GDR'];
      const ref = metriques.pivots.filter(
        (r: { chambre: string; vue: string; grain: string; groupe: string }) =>
          r.chambre === 'AN' && r.vue === vue && r.grain === 'periode' && SIGLES.includes(r.groupe)
      ) as { cle: string; groupe: string; pivot: number }[];
      expect(ref.length).toBeGreaterThan(0);
      for (const r of ref) {
        const p = calc.find((x) => x.code === r.cle)!;
        expect(p.decisifs[r.groupe] ?? 0, `${r.cle} ${r.groupe}`).toBe(r.pivot);
      }
    });
  }

  // Les messages de la page Coalitions (hors accords) : s'ils échouent après une mise à jour
  // des données, relire les textes de src/routes/coalitions/+page.svelte.
  it('tient les messages de la page', () => {
    const p = Object.fromEntries(
      parPeriode(filtrer(toutes, false), metriques.periodes).map((x) => [x.code, x])
    );
    const xvii = ['avant_censure', 'apres_censure', 'accords_ps'].map((c) => p[c]);
    const somme = (ps: typeof xvii, f: (x: (typeof xvii)[number]) => number) =>
      ps.reduce((s, x) => s + f(x), 0);
    // la majorité présidentielle gagnait seule la moitié des votes disputés sous la XVe…
    expect(p.xv.piles.socle_seul / p.xv.disputees).toBeCloseTo(0.5, 1);
    // … presque plus ensuite
    expect(p.xvi.piles.socle_seul / p.xvi.disputees).toBeLessThan(0.1);
    expect(somme(xvii, (x) => x.piles.socle_seul) / somme(xvii, (x) => x.disputees)).toBeLessThan(
      0.1
    );
    // le RN plus souvent dans le camp gagnant que la gauche, sur les périodes fournies
    for (const x of [p.xvi, p.apres_censure, p.accords_ps]) {
      const rn = x.piles.socle_rn + x.piles.transpartisan;
      const gauche = x.piles.socle_gauche + x.piles.transpartisan;
      expect(rn).toBeGreaterThan(gauche);
    }
    // aucun groupe extérieur décisif sous la XVe, presque aucun sous la XVIe
    expect(p.xv.avecDecisif).toBe(0);
    expect(p.xvi.avecDecisif / p.xvi.votees).toBeLessThan(0.05);
    // depuis la censure : près d'une loi sur trois, avant comme après l'annonce de la suspension
    const apres = [p.apres_censure, p.accords_ps];
    const part = somme(apres, (x) => x.avecDecisif) / somme(apres, (x) => x.votees);
    expect(part).toBeGreaterThan(0.27);
    expect(part).toBeLessThan(0.34);
    for (const x of apres) {
      expect(x.avecDecisif / x.votees).toBeGreaterThan(0.25);
      expect(x.decisifs.RN).toBeGreaterThan(x.decisifs.SOC);
    }
  });
});
