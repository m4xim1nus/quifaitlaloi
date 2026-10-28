import { base } from '$lib/server/donnees';
import { dateDonnees } from '$lib/server/vues';
import { ecartes, regleEnCours, textesEnCours } from '$lib/server/encours';

export const load = () => {
  const b = base();
  const ref = b.meta.referentiels.blocs;
  const groupesAN = Object.entries(ref.assemblee).flatMap(([leg, gs]) =>
    Object.entries(gs).map(([id, g]) => ({
      leg: Number(leg),
      sigle: g.sigle,
      nom: b.groupes.get(id)?.nom ?? '',
      bloc: g.bloc,
      couleur: b.groupes.get(id)?.couleur ?? null
    }))
  );
  const groupesSN = [...new Map(Object.values(ref.senat).map((g) => [g.sigle, g])).values()].map(
    (g) => ({ sigle: g.sigle, nom: g.nom, bloc: g.bloc })
  );
  const lois = b.lois;
  const lectures = b.lectures;
  const enCours = textesEnCours();
  return {
    enCours: {
      ...regleEnCours(),
      n: enCours.length,
      accords: enCours.filter((t) => t.type === 'convention').length,
      ecartes: ecartes()
    },
    date: dateDonnees(),
    blocs: ref.blocs,
    socle: ref.socle,
    groupesAN,
    groupesSN,
    periodes: b.meta.referentiels.periodes.periodes,
    comptes: {
      lois: lois.length,
      parLegislature: Object.fromEntries(
        [15, 16, 17].map((n) => [n, lois.filter((l) => l.legislature === n).length])
      ) as Record<15 | 16 | 17, number>,
      accords: lois.filter((l) => l.type === 'convention').length,
      lectures: lectures.length,
      lecturesAN: lectures.filter((l) => l.chambre === 'AN').length,
      lecturesSN: lectures.filter((l) => l.chambre === 'SN').length,
      sansVoteAN: lectures.filter((l) => l.chambre === 'AN' && l.mode_adoption === 'MAIN_LEVEE')
        .length,
      sansVoteSN: lectures.filter((l) => l.chambre === 'SN' && l.mode_adoption === 'MAIN_LEVEE')
        .length,
      scrutins: b.scrutins.size,
      motionsNonQualifiees: lectures
        .filter((l) => l.mode_adoption === 'MOTION_REJET' && l.chambre === 'AN')
        .map((l) => ({
          loi: lois.find((x) => x.id === l.loi_id)!,
          score: l.score_rejet_inverse
        })),
      rejetsInverses: lectures
        .filter((l) => l.mode_adoption === 'REJET_INVERSE')
        .map((l) => ({
          loi: lois.find((x) => x.id === l.loi_id)!,
          score: l.score_rejet_inverse
        }))
    }
  };
};
