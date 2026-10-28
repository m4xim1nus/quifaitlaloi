import { expect, it } from 'vitest';
import { censureAvec, siContre } from './majorite';

it('fait voter contre les « pour » d’un groupe', () => {
  expect(siContre({ pour: 316, contre: 223, requis: 270, sort: 'adopte' }, { pour: 120 })).toEqual({
    pour: 196,
    contre: 343,
    adopte: false
  });
});

it('ajoute à la censure les membres qui ne l’ont pas votée', () => {
  expect(
    censureAvec({ pour: 260, contre: 0, requis: 289, sort: 'rejete' }, { pour: 5, membres: 69 })
  ).toEqual({ pour: 324, requis: 289, adoptee: true });
});
