// Types des fichiers de data/export/ (pipeline qfl, docs/METHODO.md). Identifiants métier en français.

export type Chambre = 'AN' | 'SN';
export type TypeLoi = 'ordinaire' | 'organique' | 'finances' | 'financement_ss' | 'convention';
export type ModeAdoption =
  | 'SCRUTIN_SOLENNEL'
  | 'SCRUTIN_ORDINAIRE'
  | 'SCRUTIN_PUBLIC'
  | 'MAIN_LEVEE'
  | 'ART_49_3'
  | 'MOTION_REJET'
  | 'REJET_INVERSE'
  | 'DELAI_EXPIRE'
  | 'SANS_DECISION'
  | 'NON_RENSEIGNE';
export type Classe =
  | 'consensus'
  | 'hors_socle'
  | 'transpartisan'
  | 'socle_rn'
  | 'socle_gauche'
  | 'socle_droite'
  | 'socle_seul';
export type Bloc = 'gauche' | 'centre' | 'droite' | 'rn' | 'autres';
export type Position =
  'pour' | 'contre' | 'abstention' | 'partage' | 'absent' | 'censure' | 'pas_censure';
export type TypeLecture = 'premiere' | 'deuxieme' | 'nouvelle' | 'definitive' | 'cmp';

/** Une loi (lois.csv). Les listes de sigles sont déjà découpées. */
export interface Loi {
  id: string;
  statut: 'promulguee' | 'adoptee';
  titre: string;
  titre_court: string;
  type: TypeLoi;
  sous_type: string | null;
  initiative: 'projet' | 'proposition';
  date_adoption: string;
  date_promulgation: string | null;
  legislature: number;
  url_an: string | null;
  url_senat: string | null;
  url_legifrance: string | null;
  procedure_acceleree: boolean;
  n_lectures: number;
  chambre_finale: Chambre | null;
  mode_an: ModeAdoption | null;
  scrutin_an: string | null;
  classe_an: Classe | null;
  pivots_hors_socle_an: string[];
  pivots_abstention_an: string[];
  gagnants_hors_socle_an: string[];
  mode_sn: ModeAdoption | null;
  scrutin_sn: string | null;
  classe_sn: Classe | null;
  a_49_3: boolean;
  a_rejet_inverse: boolean;
  a_vote_bloque: boolean;
  a_delai_expire: boolean;
  contournement: boolean;
}

export interface Lecture {
  id: string;
  loi_id: string;
  etape: string;
  chambre: Chambre;
  type_lecture: TypeLecture;
  date: string | null;
  statut: string;
  issue: 'adopte' | 'rejete' | 'sans_decision' | 'inconnue';
  decision_deduite: boolean;
  mode_adoption: ModeAdoption;
  scrutin_id: string | null;
  vote_bloque: boolean;
  score_rejet_inverse: number | null;
}

export interface Scrutin {
  id: string;
  chambre: Chambre;
  numero: number;
  date: string;
  type_vote: 'SPS' | 'SPO' | 'SCR' | 'MOC';
  titre: string;
  objet: string;
  sort: 'adopte' | 'rejete';
  pour: number;
  contre: number;
  abstention: number;
  votants: number;
  exprimes: number;
  requis: number;
  lecture_id: string | null;
  loi_id: string | null;
}

/** Position d'un groupe sur un scrutin, avec son sigle d'affichage. */
export interface PositionGroupe {
  groupe_id: string;
  sigle: string;
  nom: string;
  bloc: Bloc;
  membres: number;
  pour: number;
  contre: number;
  abstention: number;
  non_votants: number;
  position: Position;
  cohesion: number | null;
  pivot: boolean;
  pivot_abstention: boolean;
}

export interface Signature {
  scrutin_id: string;
  camp: 'pour' | 'contre' | 'pas_censure' | 'censure';
  classe: Classe;
  socle: string;
  blocs: Record<Bloc, Position | null>;
  gagnants_hors_socle: string[];
  pivots: string[];
  pivots_hors_socle: string[];
  pivots_abstention: string[];
}

export interface Evenement {
  loi_id: string;
  date: string;
  etape: string;
  scrutin_id: string | null;
  detail: string | null;
  type: string;
}

/** Un scrutin avec la position de chaque groupe et sa signature de coalition. */
export interface ScrutinDetaille extends Scrutin {
  positions: PositionGroupe[];
  signature: Signature | null;
}

export interface Source {
  url: string;
  last_modified: string;
  taille: number;
  sha256: string;
  telecharge_le: string;
}
