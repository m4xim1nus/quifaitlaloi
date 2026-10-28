import { couleursGroupes, resumes } from '$lib/server/vues';
import { LEGISLATURES } from '$lib/legislatures';

/** Les lois des trois législatures, réduites à ce que comparent les petits multiples. */
export const load = () => {
  const lois = resumes();
  return {
    legislatures: LEGISLATURES.map((l) => ({
      num: l.num,
      couleurs: couleursGroupes(l.num),
      lois: lois
        .filter((x) => x.legislature === l.num)
        .map((x) => ({
          id: x.id,
          titre_court: x.titre_court,
          type: x.type,
          date_adoption: x.date_adoption,
          chemin: x.chemin,
          solennel: x.solennel,
          classe_an: x.classe_an,
          pivots: x.pivots,
          pivots_abst_hors_socle: x.pivots_abst_hors_socle
        }))
    }))
  };
};
