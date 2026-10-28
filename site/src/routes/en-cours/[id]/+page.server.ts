import { error } from '@sveltejs/kit';
import { couleursGroupes } from '$lib/server/vues';
import { ficheEnCours, textesEnCours } from '$lib/server/encours';

export const entries = () => textesEnCours().map((t) => ({ id: t.id }));

export const load = ({ params }) => {
  const f = ficheEnCours(params.id);
  if (!f) error(404, 'Texte inconnu');
  return { ...f, couleurs: couleursGroupes(17) };
};
