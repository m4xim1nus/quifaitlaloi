// Contrôle croisé avec le pipeline : les agrégats du site redonnent metriques.json.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { csvParse } from 'd3-dsv';
import { describe, expect, it } from 'vitest';
import {
  coalitionsParPeriode,
  filtrer,
  parChemin,
  periodeDe,
  votesParGroupe,
  type LoiAgregeable
} from './agregats';
import { chemin } from './libelles';
import type { Classe, ModeAdoption, TypeLoi } from './types';

const EXPORT = resolve(import.meta.dirname, '../../../data/export');
const metriques = JSON.parse(readFileSync(resolve(EXPORT, 'metriques.json'), 'utf8'));
const lois: LoiAgregeable[] = csvParse(readFileSync(resolve(EXPORT, 'lois.csv'), 'utf8')).map(
  (r) => ({
    id: r.id!,
    type: r.type as TypeLoi,
    date_adoption: r.date_adoption!,
    chemin: chemin({
      a_49_3: r.a_49_3 === 'true',
      a_rejet_inverse: r.a_rejet_inverse === 'true',
      mode_an: (r.mode_an || null) as ModeAdoption | null
    }),
    classe_an: (r.classe_an || null) as Classe | null,
    pivots: r.pivots_hors_socle_an ? r.pivots_hors_socle_an.split(',') : []
  })
);
const periodes = metriques.periodes;

describe('agrégats (données réelles)', () => {
  it('rattache une date à sa période', () => {
    expect(periodeDe('2024-12-04', periodes)).toBe('avant_censure');
    expect(periodeDe('2024-12-05', periodes)).toBe('apres_censure');
    expect(periodeDe('2025-10-14', periodes)).toBe('accords_ps');
  });

  it('compte les contournements comme le pipeline', () => {
    for (const [vue, conv] of [
      ['toutes', true],
      ['hors_conventions', false]
    ] as const) {
      const c = parChemin(filtrer(lois, conv));
      const attendu = metriques.contournement.filter(
        (r: { vue: string; grain: string }) => r.vue === vue && r.grain === 'periode'
      );
      const somme = (k: string) =>
        attendu.reduce((s: number, r: Record<string, number>) => s + r[k], 0);
      expect(c.art_49_3.length).toBe(somme('art_49_3'));
      expect(c.rejet_inverse.length).toBe(somme('rejet_inverse'));
      expect(c.art_49_3.length + c.rejet_inverse.length).toBe(somme('contournement'));
      expect(c.nominatif.length + c.sans_scrutin.length + somme('contournement')).toBe(
        somme('lois')
      );
      expect(filtrer(lois, conv).length).toBe(somme('lois'));
    }
  });

  it('compte les coalitions AN par période comme le pipeline', () => {
    const calc = coalitionsParPeriode(filtrer(lois, false), periodes);
    const ref = metriques.coalitions.filter(
      (r: { chambre: string; vue: string; grain: string }) =>
        r.chambre === 'AN' && r.vue === 'hors_conventions' && r.grain === 'periode'
    );
    for (const r of ref as { cle: string; classe: string; lois: number }[]) {
      const p = calc.find((x) => x.code === r.cle)!;
      const n = r.classe === 'main_levee' ? p.sansScrutin : p.comptes[r.classe as Classe];
      expect(n, `${r.cle} ${r.classe}`).toBe(r.lois);
    }
  });
});

describe('votes par groupe', () => {
  it('compte les positions, hors votes de la XVIe', () => {
    const r = votesParGroupe(
      [
        { votes: { RN: 'pour', SOC: 'contre' }, leg_an: 17 },
        { votes: { RN: 'pas_censure', SOC: 'pas_censure' }, leg_an: 17 },
        { votes: { SOC: 'pour' }, leg_an: 16 }
      ],
      ['SOC', 'RN', 'UDR']
    );
    expect(r.map((g) => [g.sigle, g.n, g.comptes.pour, g.comptes.pas_censure])).toEqual([
      ['SOC', 2, 0, 1],
      ['RN', 2, 1, 1]
    ]);
  });
});
