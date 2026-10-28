// Vocabulaire affiché : catégories, libellés et définitions en clair (docs/METHODO.md §5, §9).
// Une seule source pour la frise, les filtres, les légendes et la page Méthodologie.
import type { Bloc, Classe, Loi, ModeAdoption, Position, TypeLecture, TypeLoi } from './types';

/**
 * Chemin d'une loi à l'Assemblée, une seule catégorie par loi : un contournement l'emporte sur
 * le mode de la dernière lecture AN (le 49.3 d'abord, puis le rejet inversé).
 */
export type Chemin = 'solennel' | 'ordinaire' | 'sans_scrutin' | 'rejet_inverse' | 'art_49_3';

export const CHEMINS: Chemin[] = [
  'solennel',
  'ordinaire',
  'sans_scrutin',
  'rejet_inverse',
  'art_49_3'
];

export function chemin(loi: Pick<Loi, 'a_49_3' | 'a_rejet_inverse' | 'mode_an'>): Chemin {
  if (loi.a_49_3) return 'art_49_3';
  if (loi.a_rejet_inverse) return 'rejet_inverse';
  if (loi.mode_an === 'SCRUTIN_SOLENNEL') return 'solennel';
  if (loi.mode_an === 'SCRUTIN_ORDINAIRE' || loi.mode_an === 'SCRUTIN_PUBLIC') return 'ordinaire';
  return 'sans_scrutin';
}

export const LIBELLE_CHEMIN: Record<Chemin, string> = {
  solennel: 'Vote solennel',
  ordinaire: 'Vote nominatif',
  sans_scrutin: 'Sans vote nominatif',
  rejet_inverse: 'Rejet par ses partisans',
  art_49_3: '49.3'
};

export const DEFINITION_CHEMIN: Record<Chemin, string> = {
  solennel:
    'Vote nominatif fixé à l’avance par la Conférence des présidents, en général le mardi après les questions au Gouvernement. Tous les députés sont appelés à voter (en personne ou par délégation) ; le résultat est publié nom par nom.',
  ordinaire:
    'Vote nominatif demandé en séance par le Gouvernement, la commission ou un président de groupe. Votent les députés présents ou ayant délégué leur vote ; le résultat est publié nom par nom.',
  sans_scrutin:
    'Vote à main levée (ou par assis et levé) : aucun décompte, ni nominatif ni chiffré, n’est publié. Cela ne veut pas dire que tout le monde était d’accord.',
  rejet_inverse:
    'L’Assemblée adopte une motion de rejet préalable, surtout grâce à des groupes qui votent ensuite pour le texte. Le texte est rejeté sans examen des articles ; la procédure accélérée permet alors de réunir directement une commission mixte paritaire, qui part du texte du Sénat. L’Assemblée vote ensuite le texte de la CMP.',
  art_49_3:
    'Le Premier ministre engage la responsabilité du Gouvernement sur le texte (article 49, alinéa 3, de la Constitution). Le texte est considéré comme adopté sans vote, sauf si une motion de censure est votée par la majorité des membres de l’Assemblée (289 députés). Seules les voix pour la censure sont comptées.'
};

/** Les deux chemins qui contournent le vote de l’Assemblée sur le texte (METHODO §6). */
export const CONTOURNEMENTS: Chemin[] = ['rejet_inverse', 'art_49_3'];

export const LIBELLE_MODE: Record<ModeAdoption, string> = {
  SCRUTIN_SOLENNEL: 'vote solennel',
  SCRUTIN_ORDINAIRE: 'vote nominatif',
  SCRUTIN_PUBLIC: 'vote nominatif',
  MAIN_LEVEE: 'sans vote nominatif',
  ART_49_3: '49.3',
  MOTION_REJET: 'motion de rejet adoptée',
  REJET_INVERSE: 'rejet par ses partisans',
  DELAI_EXPIRE: 'délai expiré',
  SANS_DECISION: 'sans décision',
  NON_RENSEIGNE: 'non renseigné'
};

export const LIBELLE_TYPE: Record<TypeLoi, string> = {
  ordinaire: 'Loi ordinaire',
  organique: 'Loi organique',
  finances: 'Loi de finances',
  financement_ss: 'Loi de financement de la Sécurité sociale',
  convention: 'Accord international'
};

export const LIBELLE_LECTURE: Record<TypeLecture, string> = {
  premiere: '1re lecture',
  deuxieme: '2e lecture',
  nouvelle: 'Nouvelle lecture',
  definitive: 'Lecture définitive',
  cmp: 'Texte de la CMP'
};

export const LIBELLE_CHAMBRE = { AN: 'Assemblée', SN: 'Sénat' } as const;

/** Classes de coalition, dans l’ordre d’affichage (du plus large au plus étroit). */
export const CLASSES: Classe[] = [
  'consensus',
  'transpartisan',
  'socle_gauche',
  'socle_rn',
  'socle_droite',
  'socle_seul',
  'hors_socle'
];

export const LIBELLE_CLASSE: Record<Classe, string> = {
  consensus: 'Aucun bloc contre',
  transpartisan: 'Socle + gauche + RN',
  socle_gauche: 'Socle + gauche',
  socle_rn: 'Socle + RN',
  socle_droite: 'Centre + LR (XVIe)',
  socle_seul: 'Socle, sans gauche ni RN',
  hors_socle: 'Sans le socle'
};

const SUR_493 = ' Sur un 49.3 : les groupes qui ne votent pas la censure.';

export const DEFINITION_CLASSE: Record<Classe, string> = {
  consensus:
    'Aucun groupe de gauche, du centre, de droite ou du bloc RN ne vote majoritairement contre. Des abstentions sont possibles, ainsi que des votes contre de LIOT ou de non-inscrits.',
  transpartisan:
    'Le texte passe avec les voix du socle commun et d’au moins un groupe de gauche et un groupe du bloc RN.' +
    SUR_493,
  socle_gauche:
    'Le texte passe avec les voix du socle commun et d’au moins un groupe de gauche, sans le bloc RN.' +
    SUR_493,
  socle_rn:
    'Le texte passe avec les voix du socle commun et d’au moins un groupe du bloc RN, sans la gauche.' +
    SUR_493,
  socle_droite:
    'Lecture tenue sous la XVIe législature, avant la dissolution : le texte passe avec les voix du centre et de LR, sans la gauche ni le RN.',
  socle_seul:
    'Le texte passe avec les voix du socle commun, sans aucun groupe de gauche ni du bloc RN (LIOT ou des non-inscrits peuvent l’appuyer).' +
    SUR_493,
  hors_socle: 'Le résultat est obtenu sans les voix du socle commun.'
};

/** Le socle commun, développé à la première occurrence de chaque page. */
export const SOCLE_COMMUN =
  'socle commun (les groupes du centre, EPR, Les Démocrates et Horizons, et la Droite républicaine)';

export const LIBELLE_BLOC: Record<Bloc, string> = {
  gauche: 'Gauche',
  centre: 'Centre',
  droite: 'Droite',
  rn: 'RN et alliés',
  autres: 'Autres'
};

export const LIBELLE_POSITION: Record<Position, string> = {
  pour: 'pour',
  contre: 'contre',
  abstention: 'abstention',
  partage: 'partagé',
  absent: 'absent',
  censure: 'vote la censure',
  pas_censure: 'ne vote pas la censure'
};

/** Nom court des dates charnières (pipeline/referentiels/periodes.yaml), pour les graphiques. */
export const JALON: Record<string, string> = {
  dissolution: 'Dissolution',
  avant_censure: 'Nouvelle Assemblée',
  apres_censure: 'Censure du gouvernement Barnier',
  accords_ps: 'Suspension de la réforme des retraites annoncée'
};

/** Nom des périodes, pour les blocs « par période ». */
export const NOM_PERIODE: Record<string, string> = {
  avant_censure: 'Juillet à décembre 2024',
  apres_censure: 'Décembre 2024 à octobre 2025',
  accords_ps: 'Depuis octobre 2025'
};
