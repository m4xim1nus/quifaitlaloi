import { groupesAN, periodes, resumes } from '$lib/server/vues';
import { zooms } from '$lib/server/recits';

const legislatureDe = (loi: string) => resumes().find((l) => l.id === loi)?.legislature;

export const load = () => ({
  zooms: zooms(legislatureDe, 17),
  lois: resumes().filter((l) => l.legislature === 17),
  periodes: periodes(),
  groupes: groupesAN(17)
});
