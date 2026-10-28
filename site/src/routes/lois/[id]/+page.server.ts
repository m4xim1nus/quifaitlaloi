import { error } from '@sveltejs/kit';
import { base } from '$lib/server/donnees';
import { couleursGroupes, fiche } from '$lib/server/vues';

export const entries = () => base().lois.map((l) => ({ id: l.id }));

export const load = ({ params }) => {
  const f = fiche(params.id);
  if (!f) error(404, 'Loi inconnue');
  return { ...f, couleurs: couleursGroupes() };
};
