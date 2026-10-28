import { expect, it } from 'vitest';
import { lienScrutin, numeroScrutin } from './liens';

it('relie les scrutins à leur source', () => {
  expect(lienScrutin('VTANR5L17V2957')).toBe(
    'https://www.assemblee-nationale.fr/dyn/17/scrutins/2957'
  );
  expect(lienScrutin('SN2024-335')).toBe(
    'https://www.senat.fr/scrutin-public/2024/scr2024-335.html'
  );
  expect(lienScrutin('X')).toBeNull();
  expect(numeroScrutin('VTANR5L17V2957')).toBe('scrutin n° 2957');
});
