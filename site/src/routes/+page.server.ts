import { groupesAN, periodes, resumes } from '$lib/server/vues';
import { zooms } from '$lib/server/recits';
import { textesEnCours } from '$lib/server/encours';

const legislatureDe = (loi: string) => resumes().find((l) => l.id === loi)?.legislature;

export const load = () => ({
  zooms: zooms(legislatureDe, 17),
  lois: resumes().filter((l) => l.legislature === 17),
  periodes: periodes(),
  groupes: groupesAN(17),
  // textes en cours hors accords internationaux (vue par défaut de /en-cours)
  enCours: textesEnCours().filter((t) => t.type !== 'convention').length
});
