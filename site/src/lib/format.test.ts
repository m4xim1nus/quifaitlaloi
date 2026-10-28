import { describe, expect, it } from 'vitest';
import { dateCourte, dateLongue, moisAnnee, pourcent, surTotal } from './format';

describe('format', () => {
  it('écrit les dates à la française', () => {
    expect(dateLongue('2025-07-08')).toBe('8 juillet 2025');
    expect(dateLongue('2026-02-01')).toBe('1er février 2026');
    expect(dateCourte('2025-07-08')).toBe('08/07/2025');
    expect(moisAnnee('2024-12-04')).toBe('déc. 2024');
    expect(dateLongue(null)).toBe('');
  });
  it('écrit les parts et les totaux', () => {
    expect(pourcent(0.0338)).toBe('3 %');
    expect(pourcent(0.0338, 1)).toBe('3,4 %');
    expect(surTotal(5, 148, ['loi', 'lois'])).toBe('5 lois sur 148');
    expect(surTotal(1, 148, ['loi', 'lois'])).toBe('1 loi sur 148');
  });
});
