import { describe, expect, it } from 'vitest';
import { rangees, sieges } from './hemicycle';

describe('hémicycle', () => {
  it('place exactement n sièges', () => {
    for (const n of [1, 17, 348, 577]) expect(sieges(n)).toHaveLength(n);
  });
  it('dimensionne les rangées comme les deux chambres', () => {
    expect(rangees(577)).toBe(12);
    expect(rangees(348)).toBe(9);
  });
  it('commence à gauche et finit à droite, dans le demi-cercle', () => {
    const s = sieges(577);
    expect(s[0].x).toBeLessThan(-0.3);
    expect(s.at(-1)!.x).toBeGreaterThan(0.3);
    for (const p of s) {
      expect(p.y).toBeGreaterThanOrEqual(-1e-9);
      expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(1 + 1e-9);
    }
  });
});
