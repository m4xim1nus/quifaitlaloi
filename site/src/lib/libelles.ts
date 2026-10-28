// Vocabulaire affiché : catégories, libellés et définitions en clair (docs/METHODO.md §5, §9).
// Une seule source pour la frise, les filtres, les légendes et la page Méthodologie.
import type { Bloc, Classe, Loi, ModeAdoption, Position, TypeLecture, TypeLoi } from './types';

/**
 * Chemin d'une loi à l'Assemblée, une seule catégorie par loi : un contournement l'emporte sur
 * le mode de la dernière lecture AN (le 49.3 d'abord, puis le rejet par les partisans). Vote
 * solennel et scrutin ordinaire sont réunis en « vote nominatif » ; la distinction reste sur
 * les fiches (LIBELLE_MODE).
 */
export type Chemin = 'nominatif' | 'sans_scrutin' | 'rejet_inverse' | 'art_49_3';

export const CHEMINS: Chemin[] = ['nominatif', 'sans_scrutin', 'rejet_inverse', 'art_49_3'];

export function chemin(loi: Pick<Loi, 'a_49_3' | 'a_rejet_inverse' | 'mode_an'>): Chemin {
  if (loi.a_49_3) return 'art_49_3';
  if (loi.a_rejet_inverse) return 'rejet_inverse';
  if (
    loi.mode_an === 'SCRUTIN_SOLENNEL' ||
    loi.mode_an === 'SCRUTIN_ORDINAIRE' ||
    loi.mode_an === 'SCRUTIN_PUBLIC'
  )
    return 'nominatif';
  return 'sans_scrutin';
}

export const LIBELLE_CHEMIN: Record<Chemin, string> = {
  nominatif: 'Vote nominatif',
  sans_scrutin: 'Sans vote nominatif',
  rejet_inverse: 'Rejet par ses partisans',
  art_49_3: '49.3'
};

export const DEFINITION_CHEMIN: Record<Chemin, string> = {
  nominatif:
    'Le vote de chaque député est publié, nom par nom. C’est soit un vote solennel, fixé à l’avance par la Conférence des présidents (en général le mardi après les questions au Gouvernement, tous les députés étant appelés à voter), soit un scrutin public ordinaire, demandé en séance par le Gouvernement, la commission ou un président de groupe.',
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
  SCRUTIN_SOLENNEL: 'vote nominatif solennel',
  SCRUTIN_ORDINAIRE: 'vote nominatif ordinaire',
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
  constitutionnelle: 'Loi constitutionnelle',
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
  socle_droite: 'Socle + LR',
  socle_seul: 'Socle, sans gauche ni RN',
  hors_socle: 'Sans le socle'
};

const SUR_493 = ' Sur un 49.3 : les groupes qui ne votent pas la censure.';

export const DEFINITION_CLASSE: Record<Classe, string> = {
  consensus:
    'Aucun groupe de gauche, du centre, de droite ou du bloc RN ne vote majoritairement contre. Des abstentions sont possibles, ainsi que des votes contre de petits groupes (LIOT, UDI…) ou de non-inscrits.',
  transpartisan:
    'Le texte passe avec les voix du socle et d’au moins un groupe de gauche et un groupe du bloc RN.' +
    SUR_493,
  socle_gauche:
    'Le texte passe avec les voix du socle et d’au moins un groupe de gauche, sans le bloc RN.' +
    SUR_493,
  socle_rn:
    'Le texte passe avec les voix du socle et d’au moins un groupe du bloc RN, sans la gauche.' +
    SUR_493,
  socle_droite:
    'Le texte passe avec les voix du socle et de LR, sans la gauche ni le RN. Seulement sous les XVe et XVIe législatures, où LR n’est pas dans le socle.' +
    SUR_493,
  socle_seul:
    'Le texte passe avec les voix du socle, sans aucun groupe de gauche, de droite hors socle ni du bloc RN (de petits groupes ou des non-inscrits peuvent l’appuyer).' +
    SUR_493,
  hors_socle: 'Le résultat est obtenu sans les voix du socle.'
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
