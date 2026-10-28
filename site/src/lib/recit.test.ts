import { describe, expect, it } from 'vitest';
import { enumeration, phrasesChemin, phrasesScrutin } from './recit';
import type { PositionGroupe, ScrutinDetaille } from './types';

const pos = (sigle: string, position: PositionGroupe['position']): PositionGroupe => ({
  groupe_id: sigle,
  sigle,
  nom: sigle,
  bloc: 'centre',
  membres: 10,
  pour: 0,
  contre: 0,
  abstention: 0,
  non_votants: 0,
  position,
  cohesion: 1,
  pivot: false,
  pivot_abstention: false
});

const base: Omit<ScrutinDetaille, 'positions' | 'signature' | 'objet' | 'sort'> = {
  id: 'V1',
  chambre: 'AN',
  legislature: 17,
  numero: 1,
  date: '2025-07-08',
  type_vote: 'SPS',
  titre: '',
  pour: 316,
  contre: 223,
  abstention: 25,
  votants: 564,
  exprimes: 539,
  requis: 270,
  lecture_id: null,
  loi_id: null
};

describe('récit', () => {
  it('énumère à la française', () => {
    expect(enumeration(['A'])).toBe('A');
    expect(enumeration(['A', 'B', 'C'])).toBe('A, B et C');
  });

  it('raconte un scrutin adopté avec un pivot hors socle', () => {
    const p = phrasesScrutin({
      ...base,
      objet: 'ensemble',
      sort: 'adopte',
      positions: [
        pos('EPR', 'pour'),
        pos('RN', 'pour'),
        pos('LFI-NFP', 'contre'),
        pos('X', 'absent')
      ],
      signature: {
        scrutin_id: 'V1',
        camp: 'pour',
        classe: 'socle_rn',
        socle: 'centre+droite',
        blocs: { gauche: 'contre', centre: 'pour', droite: 'pour', rn: 'pour', autres: null },
        gagnants_hors_socle: ['RN'],
        pivots: ['RN'],
        pivots_hors_socle: ['RN'],
        pivots_abstention: []
      }
    });
    expect(p[0]).toBe('Pour : EPR et RN ; contre : LFI-NFP.');
    expect(p[1]).toBe('316 voix pour, 223 contre, 25 abstentions : adopté.');
    expect(p[2]).toBe('Si le groupe RN avait voté contre, le texte était rejeté.');
  });

  it('raconte une motion de censure rejetée', () => {
    const p = phrasesScrutin({
      ...base,
      objet: 'motion_censure',
      sort: 'rejete',
      pour: 260,
      requis: 289,
      positions: [pos('LFI-NFP', 'censure'), pos('RN', 'censure'), pos('SOC', 'pas_censure')],
      signature: {
        scrutin_id: 'V1',
        camp: 'pas_censure',
        classe: 'socle_gauche',
        socle: 'centre+droite',
        blocs: {
          gauche: 'censure',
          centre: 'pas_censure',
          droite: null,
          rn: 'censure',
          autres: null
        },
        gagnants_hors_socle: ['SOC'],
        pivots: ['SOC'],
        pivots_hors_socle: ['SOC'],
        pivots_abstention: []
      }
    });
    expect(p[0]).toBe('LFI-NFP et RN ont voté la censure ; SOC ne l’a pas votée.');
    expect(p[1]).toMatch(/260 voix, il en fallait 289 : elle est rejetée/);
    expect(p[2]).toBe('Si le groupe SOC avait voté la censure en bloc, elle était adoptée.');
  });
});

describe('phrases du chemin', () => {
  const dl = (d: string | null) => d ?? '';
  const lm = (m: string) => m;
  it('distingue le 49.3 censuré du 49.3 qui passe', () => {
    const p = phrasesChemin(
      { date_adoption: '2025-02-17', chambre_finale: 'SN', a_delai_expire: false },
      'art_49_3',
      [
        {
          chambre: 'AN',
          type_lecture: 'cmp',
          date: '2024-12-04',
          mode_adoption: 'ART_49_3',
          issue: 'rejete',
          score_rejet_inverse: null
        },
        {
          chambre: 'AN',
          type_lecture: 'nouvelle',
          date: '2025-02-12',
          mode_adoption: 'ART_49_3',
          issue: 'adopte',
          score_rejet_inverse: null
        }
      ],
      [{ date: '2024-12-04', sort: 'adopte' }],
      dl,
      lm
    );
    expect(p[1]).toMatch(
      /^Le Gouvernement a engagé sa responsabilité \(49\.3\) en nouvelle lecture :/
    );
    expect(p[2]).toMatch(/motion de censure a été adoptée/);
  });
});
