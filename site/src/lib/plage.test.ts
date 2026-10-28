import { describe, expect, it } from 'vitest';
import { bornesMois, dansPlage, ecrirePlage, lirePlage, prereglages, veille } from './plage';

const periodes = [
  { code: 'xvi', debut: '2022-06-28' },
  { code: 'dissolution', debut: '2024-06-09' },
  { code: 'avant_censure', debut: '2024-07-18' },
  { code: 'apres_censure', debut: '2024-12-05' },
  { code: 'accords_ps', debut: '2025-10-14' }
];

describe('plage', () => {
  it('calcule la veille et les bornes d’un mois', () => {
    expect(veille('2025-03-01')).toBe('2025-02-28');
    expect(bornesMois('2024-02')).toEqual({ du: '2024-02-01', au: '2024-02-29' });
  });
  it('propose les périodes nommées, chacune jusqu’à la veille de la suivante', () => {
    const p = prereglages(periodes, '2024-06-05', '2026-10-12');
    expect(p.map((x) => x.code)).toEqual(['tout', 'avant_censure', 'apres_censure', 'accords_ps']);
    expect(p[2]).toMatchObject({ du: '2024-12-05', au: '2025-10-13' });
    expect(p[3].au).toBe('2026-10-12');
  });
  it('filtre par date, bornes incluses', () => {
    const p = { du: '2024-12-05', au: '2025-10-13' };
    expect(dansPlage('2024-12-05', p)).toBe(true);
    expect(dansPlage('2024-12-04', p)).toBe(false);
  });
  it('porte la plage dans l’URL, sauf la plage complète', () => {
    const complete = { du: '2024-06-05', au: '2026-10-12' };
    const u = new URLSearchParams();
    ecrirePlage(u, { du: '2024-12-05', au: '2025-10-13' }, complete);
    expect(lirePlage(u, complete)).toEqual({ du: '2024-12-05', au: '2025-10-13' });
    ecrirePlage(u, complete, complete);
    expect(u.toString()).toBe('');
    expect(lirePlage(new URLSearchParams('du=nimporte'), complete)).toEqual(complete);
  });
});
