import { error } from '@sveltejs/kit';
import { groupesAN, periodes, resumes } from '$lib/server/vues';

/** La XVIIe est l'accueil ; les législatures précédentes ont leur page. */
export const entries = () => [{ num: '15' }, { num: '16' }];

export const load = ({ params }) => {
  const num = Number(params.num);
  if (num !== 15 && num !== 16) error(404, 'Législature inconnue');
  return {
    num,
    lois: resumes().filter((l) => l.legislature === num),
    periodes: periodes(),
    groupes: groupesAN(num)
  };
};
