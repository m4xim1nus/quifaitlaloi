import { couleursGroupes, periodes, resumes } from '$lib/server/vues';

export const load = () => ({
  lois: resumes(),
  periodes: periodes(),
  couleurs: couleursGroupes()
});
