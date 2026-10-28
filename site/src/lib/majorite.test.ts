import { expect, it } from 'vitest';
import { censureAvec, sansLesVoix } from './majorite';

it('retire les voix d’un groupe et compare pour et contre', () => {
  expect(
    sansLesVoix({ pour: 316, contre: 223, requis: 270, sort: 'adopte' }, { pour: 120 })
  ).toEqual({
    pour: 196,
    contre: 223,
    adopte: false
  });
});

it('ajoute à la censure les membres qui ne l’ont pas votée', () => {
  expect(
    censureAvec({ pour: 260, contre: 0, requis: 289, sort: 'rejete' }, { pour: 5, membres: 69 })
  ).toEqual({ pour: 324, requis: 289, adoptee: true });
});
