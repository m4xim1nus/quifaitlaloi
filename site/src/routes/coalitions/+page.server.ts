import { base } from '$lib/server/donnees';
import { couleursGroupes, periodes, resumes } from '$lib/server/vues';

/** Les lois des trois législatures, réduites à ce que montre la chronologie des coalitions. */
export const load = () => {
  const b = base();
  const scrutinAN = new Map(b.lois.map((l) => [l.id, l.scrutin_an]));
  const lois = resumes().map((l) => ({
    id: l.id,
    titre_court: l.titre_court,
    type: l.type,
    legislature: l.legislature,
    date_adoption: l.date_adoption,
    classe_an: l.classe_an,
    pivots: l.pivots,
    pivots_abst_hors_socle: l.pivots_abst_hors_socle,
    /** Législature du vote décisif à l'AN, quand ce n'est pas celle de l'adoption. */
    autre_leg: l.leg_an !== null && l.leg_an !== l.legislature ? l.leg_an : null,
    /** Vote décisif = motion de censure (49.3) : ne pas la voter n'est pas soutenir. */
    censure: b.scrutins.get(scrutinAN.get(l.id) ?? '')?.type_vote === 'MOC'
  }));
  // Groupes de l'AN de la gauche vers la droite (ordre des blocs, puis blocs.yaml), une entrée
  // par sigle, celle de la législature la plus récente.
  const ordre = b.meta.referentiels.blocs.blocs;
  const vus = new Set<string>();
  const groupes = [...b.groupes.values()]
    .filter((g) => g.chambre === 'AN')
    .map((g, i) => ({ g, i }))
    .sort((x, y) => (y.g.legislature ?? 0) - (x.g.legislature ?? 0) || x.i - y.i)
    .filter(({ g }) => !vus.has(g.sigle) && !!vus.add(g.sigle))
    .sort((x, y) => ordre[x.g.bloc].ordre - ordre[y.g.bloc].ordre || x.i - y.i)
    .map(({ g }) => ({ sigle: g.sigle, nom: g.nom, bloc: g.bloc }));
  return { lois, groupes, couleurs: couleursGroupes(), periodes: periodes() };
};
