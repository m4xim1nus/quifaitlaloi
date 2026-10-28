import { groupesAN, periodes, resumes } from '$lib/server/vues';

export const load = () => ({
  lois: resumes().filter((l) => l.legislature === 17),
  periodes: periodes(),
  groupes: groupesAN(17)
});
