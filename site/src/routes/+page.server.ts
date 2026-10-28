import { groupesXVII, periodes, resumes } from '$lib/server/vues';

export const load = () => ({
  lois: resumes(),
  periodes: periodes(),
  groupes: groupesXVII()
});
