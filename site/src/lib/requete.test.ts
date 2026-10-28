import { expect, it } from 'vitest';
import { memeRequete } from './requete';

it('compare les requêtes à l’ordre des paramètres près', () => {
  expect(memeRequete('?type=convention&conventions=1', '?conventions=1&type=convention')).toBe(
    true
  );
  expect(memeRequete('', '?')).toBe(true);
  expect(memeRequete('?theme=Justice', '?theme=Transports')).toBe(false);
});
