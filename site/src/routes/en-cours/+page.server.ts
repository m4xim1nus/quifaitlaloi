import { couleursGroupes } from '$lib/server/vues';
import { regleEnCours, textesEnCours } from '$lib/server/encours';

export const load = () => ({
  textes: textesEnCours(),
  date: regleEnCours().date_reference,
  couleurs: couleursGroupes(17)
});
