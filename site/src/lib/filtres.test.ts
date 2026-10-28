import { describe, expect, it } from 'vitest';
import { appliquer, ecrireFiltres, lireFiltres, VIDES, type Filtrable } from './filtres';

const lois: Filtrable[] = [
  {
    id: '2025-794',
    titre_court: 'Métier d’agriculteur (loi Duplomb)',
    type: 'ordinaire',
    date_adoption: '2025-07-08',
    chemin: 'rejet_inverse',
    classe_an: 'socle_rn',
    pivots: ['RN']
  },
  {
    id: '2025-273',
    titre_court: 'Convention d’extradition avec le Cambodge',
    type: 'convention',
    date_adoption: '2025-03-20',
    chemin: 'sans_scrutin',
    classe_an: null,
    pivots: []
  }
];
const periodes = [
  { code: 'avant_censure', debut: '2024-07-18' },
  { code: 'apres_censure', debut: '2024-12-05' }
];

describe('filtres', () => {
  it('aller-retour par l’URL', () => {
    const f = { ...VIDES, chemin: 'art_49_3' as const, texte: 'budget' };
    expect(lireFiltres(new URLSearchParams(ecrireFiltres(f).slice(1)))).toEqual(f);
    expect(ecrireFiltres(VIDES)).toBe('');
  });
  it('exclut les accords internationaux par défaut', () => {
    expect(appliquer(lois, VIDES, periodes).map((l) => l.id)).toEqual(['2025-794']);
    expect(appliquer(lois, { ...VIDES, conventions: true }, periodes)).toHaveLength(2);
  });
  it('cherche sans accents et filtre par groupe décisif', () => {
    expect(appliquer(lois, { ...VIDES, texte: 'metier duplomb' }, periodes)).toHaveLength(1);
    expect(appliquer(lois, { ...VIDES, decisif: 'SOC' }, periodes)).toHaveLength(0);
    expect(
      appliquer(lois, { ...VIDES, coalition: 'aucune', conventions: true }, periodes)
    ).toHaveLength(1);
  });
});
