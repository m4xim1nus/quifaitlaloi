import { describe, expect, it } from 'vitest';
import { empiler, lignesEtiquettes, moisEntre, positionDate } from './frise';

describe('frise', () => {
  it('liste les mois, vides compris', () => {
    const m = moisEntre('2024-11-20', '2025-02-03');
    expect(m.map((x) => x.cle)).toEqual(['2024-11', '2024-12', '2025-01', '2025-02']);
  });
  it('empile par chemin, contournements en haut', () => {
    const m = moisEntre('2025-02-01', '2025-02-28');
    const e = empiler(
      [
        { id: 'a', date_adoption: '2025-02-14', chemin: 'art_49_3' as const },
        { id: 'b', date_adoption: '2025-02-20', chemin: 'nominatif' as const },
        { id: 'c', date_adoption: '2025-02-02', chemin: 'sans_scrutin' as const }
      ],
      m
    );
    expect(e.map((x) => [x.loi.id, x.rang])).toEqual([
      ['b', 0],
      ['c', 1],
      ['a', 2]
    ]);
  });
  it('place une date dans sa colonne', () => {
    const m = moisEntre('2024-12-01', '2025-01-31');
    expect(positionDate('2024-12-01', m)).toBe(0);
    expect(positionDate('2025-01-01', m)).toBe(1);
    expect(positionDate('2024-12-05', m)).toBeCloseTo(4 / 31);
  });
  it('répartit les étiquettes sur des lignes', () => {
    expect(
      lignesEtiquettes([
        { x: 0, largeur: 100 },
        { x: 50, largeur: 40 },
        { x: 120, largeur: 40 }
      ])
    ).toEqual([0, 1, 0]);
  });
});
