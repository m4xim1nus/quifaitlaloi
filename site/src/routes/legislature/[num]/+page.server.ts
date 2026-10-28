import { error } from '@sveltejs/kit';
import { groupesAN, periodes, resumes } from '$lib/server/vues';
import { zooms } from '$lib/server/recits';

/** La XVIIe est l'accueil ; les législatures précédentes ont leur page. */
export const entries = () => [{ num: '15' }, { num: '16' }];

export const load = ({ params }) => {
  const num = Number(params.num);
  if (num !== 15 && num !== 16) error(404, 'Législature inconnue');
  return {
    num,
    zooms: zooms((loi) => resumes().find((l) => l.id === loi)?.legislature, num),
    lois: resumes().filter((l) => l.legislature === num),
    periodes: periodes(),
    groupes: groupesAN(num)
  };
};
