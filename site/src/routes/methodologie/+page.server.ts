import { base } from '$lib/server/donnees';
import { dateDonnees } from '$lib/server/vues';

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
  return {
    date: dateDonnees(),
    blocs: ref.blocs,
    socle: ref.socle,
    groupesAN,
    groupesSN,
    periodes: b.meta.referentiels.periodes.periodes,
    comptes: {
      lois: lois.length,
      accords: lois.filter((l) => l.type === 'convention').length,
      lectures: lectures.length,
      lecturesAN: lectures.filter((l) => l.chambre === 'AN').length,
      lecturesSN: lectures.filter((l) => l.chambre === 'SN').length,
      sansVoteAN: lectures.filter((l) => l.chambre === 'AN' && l.mode_adoption === 'MAIN_LEVEE')
        .length,
      sansVoteSN: lectures.filter((l) => l.chambre === 'SN' && l.mode_adoption === 'MAIN_LEVEE')
        .length,
      scrutins: b.scrutins.size,
      rejetsInverses: lectures
        .filter((l) => l.mode_adoption === 'REJET_INVERSE')
        .map((l) => ({
          loi: lois.find((x) => x.id === l.loi_id)!,
          score: l.score_rejet_inverse
        }))
    }
  };
};
