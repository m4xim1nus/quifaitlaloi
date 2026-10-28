// Textes en cours : extraits pour la page /en-cours et les fiches /en-cours/[id]. Ces textes ne
// sont pas des lois : rien ici ne touche aux agrégats des lois (vues.ts).
import { base, scrutinDetaille } from './donnees';
import type { Classe, TexteEnCours } from '$lib/types';
import { coalitionDernierVote } from '$lib/encours';

/** Ligne de la liste des textes en cours. */
export interface ResumeEnCours extends Pick<
  TexteEnCours,
  | 'id'
  | 'titre_court'
  | 'type'
  | 'sous_type'
  | 'initiative'
  | 'date_derniere_lecture'
  | 'issue_derniere_lecture'
  | 'chambre_finale'
  | 'mode_final'
  | 'attente'
  | 'attente_chambre'
  | 'attente_type_lecture'
  | 'seance_prevue'
  | 'themes'
> {
  /** Coalition du dernier vote, s'il adopte le texte par un vote nominatif. */
  classe: Classe | null;
  /** Groupes hors socle décisifs à ce vote. */
  pivots: string[];
}

/** Les textes du périmètre (hors écartés), du plus récent au plus ancien. */
export function textesEnCours(): ResumeEnCours[] {
  return base()
    .enCours.filter((t) => t.motif_ecart === null)
    .map((t) => {
      const c = coalitionDernierVote(t);
      return {
        id: t.id,
        titre_court: t.titre_court,
        type: t.type,
        sous_type: t.sous_type,
        initiative: t.initiative,
        date_derniere_lecture: t.date_derniere_lecture,
        issue_derniere_lecture: t.issue_derniere_lecture,
        chambre_finale: t.chambre_finale,
        mode_final: t.mode_final,
        attente: t.attente,
        attente_chambre: t.attente_chambre,
        attente_type_lecture: t.attente_type_lecture,
        seance_prevue: t.seance_prevue,
        themes: t.themes,
        classe: c?.classe ?? null,
        pivots: c?.pivots ?? []
      };
    })
    .sort(
      (a, b) =>
        b.date_derniere_lecture.localeCompare(a.date_derniere_lecture) || a.id.localeCompare(b.id)
    );
}

/** Textes écartés du périmètre, par motif (page Méthodologie). */
export function ecartes(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of base().enCours)
    if (t.motif_ecart) out[t.motif_ecart] = (out[t.motif_ecart] ?? 0) + 1;
  return out;
}

export function regleEnCours() {
  return base().meta.en_cours;
}

/** Tout ce qu'affiche la fiche d'un texte en cours : parcours, état, chaque vote nominatif. */
export function ficheEnCours(id: string) {
  const b = base();
  const texte = b.enCours.find((t) => t.id === id && t.motif_ecart === null);
  if (!texte) return null;
  const lectures = b.lecturesEnCours.filter((l) => l.loi_id === id);
  const evenements = b.evenementsEnCours.filter((e) => e.loi_id === id);
  const avecScrutin = lectures.map((l) => ({ ...l, scrutin: scrutinDetaille(l.scrutin_id) }));
  return {
    texte,
    lectures: avecScrutin,
    evenements,
    // chaque lecture votée par scrutin public, dans l'ordre (sur un 49.3 : la motion de censure)
    votes: avecScrutin
      .filter((l) => l.scrutin && l.scrutin.positions.length > 0)
      .map((l) => ({ lecture: l, s: l.scrutin! }))
  };
}

export type FicheEnCours = NonNullable<ReturnType<typeof ficheEnCours>>;
