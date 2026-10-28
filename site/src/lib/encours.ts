// Textes en cours : où en est chaque texte, en clair, d'après les seules données des dossiers
// (pipeline/qfl/encours.py). Aucun calendrier supposé : sans séance inscrite, le texte « attend ».
import type { Chambre, Classe, ModeAdoption, TexteEnCours, TypeLecture } from './types';

type Etat = Pick<
  TexteEnCours,
  | 'attente'
  | 'attente_chambre'
  | 'attente_type_lecture'
  | 'seance_prevue'
  | 'issue_derniere_lecture'
> & { chambre_finale: Chambre | null };

const LECTURE: Record<TypeLecture | 'troisieme', string> = {
  premiere: 'la 1re lecture',
  deuxieme: 'la 2e lecture',
  troisieme: 'la 3e lecture',
  nouvelle: 'la nouvelle lecture',
  definitive: 'la lecture définitive',
  cmp: 'la lecture des conclusions de la CMP'
};
const A_LA: Record<Chambre, string> = { AN: 'à l’Assemblée', SN: 'au Sénat' };
const PAR_LA: Record<Chambre, string> = { AN: 'par l’Assemblée', SN: 'par le Sénat' };

/** « En attente de la 1re lecture au Sénat », « Transmis à l’Assemblée »… */
export function libelleAttente(t: Etat): string {
  const ch = t.attente_chambre === 'AN' || t.attente_chambre === 'SN' ? t.attente_chambre : null;
  switch (t.attente) {
    case 'lecture':
      return `En attente de ${LECTURE[t.attente_type_lecture ?? 'premiere']}${ch ? ` ${A_LA[ch]}` : ''}`;
    case 'transmis':
      return ch
        ? `Transmis ${A_LA[ch]}, examen pas encore engagé`
        : 'Transmis à l’autre chambre, examen pas encore engagé';
    case 'cmp':
      return 'Commission mixte paritaire convoquée';
    case 'cmp_conclusions':
      return ch
        ? `Accord en commission mixte paritaire, conclusions à voter ${A_LA[ch]}`
        : 'Accord en commission mixte paritaire, conclusions à voter';
    case 'navette':
      return t.issue_derniere_lecture === 'rejete' && t.chambre_finale
        ? `Rejeté ${PAR_LA[t.chambre_finale]}\u202f; la suite n’est pas encore connue`
        : 'La suite n’est pas encore connue';
  }
}

/** « Séance prévue le 19 novembre 2026 » (date inscrite dans les dossiers), ou null. */
export function libelleSeance(
  t: Pick<TexteEnCours, 'seance_prevue'>,
  dateLongue: (d: string) => string
): string | null {
  return t.seance_prevue ? `Séance prévue le ${dateLongue(t.seance_prevue)}` : null;
}

/** Où regarder : une séance est inscrite, ou le texte attend dans une chambre, en CMP, ou rien. */
export type Section = 'seance' | 'AN' | 'SN' | 'CMP' | 'navette';
export const SECTIONS: Section[] = ['seance', 'AN', 'SN', 'CMP', 'navette'];
export const TITRE_SECTION: Record<Section, string> = {
  seance: 'Séance déjà fixée',
  AN: 'En attente à l’Assemblée',
  SN: 'En attente au Sénat',
  CMP: 'En commission mixte paritaire',
  navette: 'Suite pas encore connue'
};

export function section(t: Etat): Section {
  if (t.seance_prevue) return 'seance';
  if (t.attente === 'cmp' || t.attente === 'cmp_conclusions') return 'CMP';
  if (t.attente === 'navette' || !t.attente_chambre || t.attente_chambre === 'CMP')
    return 'navette';
  return t.attente_chambre;
}

/** Textes par section, dans l'ordre d'affichage ; les séances par date, le reste du plus récent. */
export function parSection<T extends Etat & Pick<TexteEnCours, 'date_derniere_lecture' | 'id'>>(
  textes: T[]
): { section: Section; textes: T[] }[] {
  return SECTIONS.map((s) => ({
    section: s,
    textes: textes
      .filter((t) => section(t) === s)
      .sort((a, b) =>
        s === 'seance'
          ? a.seance_prevue!.localeCompare(b.seance_prevue!) || a.id.localeCompare(b.id)
          : b.date_derniere_lecture.localeCompare(a.date_derniere_lecture) ||
            a.id.localeCompare(b.id)
      )
  })).filter((g) => g.textes.length > 0);
}

/** Le dernier vote : « Adopté par le Sénat », « Rejeté par l’Assemblée ». */
export function libelleDernierVote(
  t: Pick<TexteEnCours, 'issue_derniere_lecture' | 'chambre_finale'>
): string {
  const verbe = t.issue_derniere_lecture === 'rejete' ? 'Rejeté' : 'Adopté';
  return t.chambre_finale ? `${verbe} ${PAR_LA[t.chambre_finale]}` : verbe;
}

/** Coalition et groupes décisifs du dernier vote (seulement s'il adopte le texte, avec un vote
 * nominatif) : la classe dit qui a fait passer le texte, elle n'a pas de sens pour un rejet. */
export function coalitionDernierVote(
  t: Pick<
    TexteEnCours,
    | 'issue_derniere_lecture'
    | 'chambre_finale'
    | 'classe_an'
    | 'classe_sn'
    | 'pivots_hors_socle_an'
    | 'pivots_hors_socle_sn'
    | 'mode_final'
  >
): { classe: Classe; pivots: string[] } | null {
  const nominatif: ModeAdoption[] = ['SCRUTIN_SOLENNEL', 'SCRUTIN_ORDINAIRE', 'SCRUTIN_PUBLIC'];
  if (t.issue_derniere_lecture !== 'adopte' || !t.mode_final || !nominatif.includes(t.mode_final))
    return null;
  const classe = t.chambre_finale === 'SN' ? t.classe_sn : t.classe_an;
  if (!classe) return null;
  return {
    classe,
    pivots: t.chambre_finale === 'SN' ? t.pivots_hors_socle_sn : t.pivots_hors_socle_an
  };
}

/** Nature du texte, sans le mot « loi » seul : « Proposition de loi organique », « Projet de loi
 * de financement de la Sécurité sociale », « Projet de loi autorisant un accord international ». */
export function natureTexte(t: Pick<TexteEnCours, 'initiative' | 'type' | 'sous_type'>): string {
  const base = t.initiative === 'proposition' ? 'Proposition de loi' : 'Projet de loi';
  switch (t.type) {
    case 'organique':
      return `${base} organique`;
    case 'constitutionnelle':
      return `${base} constitutionnelle`;
    case 'financement_ss':
      return `${base} de financement de la Sécurité sociale`;
    case 'finances':
      return t.sous_type === 'reglement'
        ? `${base} d’approbation des comptes`
        : t.sous_type === 'LFR'
          ? `${base} de finances rectificative`
          : `${base} de finances`;
    case 'convention':
      return `${base} autorisant un accord international`;
    default:
      return base;
  }
}

/** Chapô de la page, généré : le nombre de textes et ce qu'ils ne sont pas. */
export function chapoEnCours(n: number, date: string, dateLongue: (d: string) => string): string {
  return n === 0
    ? `Au ${dateLongue(date)}, aucun texte voté depuis juillet 2024 n’attend la suite de son parcours.`
    : `Au ${dateLongue(date)}, ${n} texte${n > 1 ? 's' : ''} déjà voté${n > 1 ? 's' : ''} par l’Assemblée ou le Sénat ${n > 1 ? 'poursuivent leur' : 'poursuit son'} parcours au Parlement. ${n > 1 ? 'Tant qu’ils ne sont pas adoptés définitivement, ce ne sont pas des lois.' : 'Tant qu’il n’est pas adopté définitivement, ce n’est pas une loi.'}`;
}
