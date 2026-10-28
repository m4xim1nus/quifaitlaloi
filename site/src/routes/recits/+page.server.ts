import { recits } from '$lib/server/recits';
import { resumes } from '$lib/server/vues';

export const load = () => {
  const lois = new Map(resumes().map((l) => [l.id, l]));
  return {
    recits: recits()
      .map((r) => ({ ...r, resume: lois.get(r.loi)! }))
      .filter((r) => r.resume)
      .sort((a, b) => b.resume.date_adoption.localeCompare(a.resume.date_adoption))
      .map(({ loi, titre, statut, chapo, resume }) => ({
        loi,
        titre,
        statut,
        chapo,
        date: resume.date_adoption,
        legislature: resume.legislature,
        chemin: resume.chemin,
        classe_an: resume.classe_an
      }))
  };
};
