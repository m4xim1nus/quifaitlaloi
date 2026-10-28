// Lecture de data/export/ au prérendu (Node). Rien de ce module n'est envoyé au navigateur :
// chaque page reçoit seulement ce que sa fonction `load` en extrait.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { csvParse } from 'd3-dsv';
import type {
  Bloc,
  Evenement,
  Lecture,
  Loi,
  PositionGroupe,
  Scrutin,
  ScrutinDetaille,
  Signature,
  Source
} from '$lib/types';

/** Dossier des exports versionnés, relatif à site/ (cwd de vite). */
export const EXPORT = resolve(process.cwd(), '../data/export');

type Ligne = Record<string, string | undefined>;

const lire = (nom: string): Ligne[] => csvParse(readFileSync(resolve(EXPORT, nom), 'utf8'));
const txt = (v: string | undefined) => (v === undefined || v === '' ? null : v);
const num = (v: string | undefined) => (v === undefined || v === '' ? null : Number(v));
const bool = (v: string | undefined) => v === 'true' || v === '1';
const liste = (v: string | undefined) => (v ? v.split(',').filter(Boolean) : []);

function loi(r: Ligne): Loi {
  return {
    id: r.id!,
    statut: r.statut as Loi['statut'],
    titre: r.titre!,
    titre_court: r.titre_court!,
    type: r.type as Loi['type'],
    sous_type: txt(r.sous_type),
    initiative: r.initiative as Loi['initiative'],
    date_adoption: r.date_adoption!,
    date_promulgation: txt(r.date_promulgation),
    legislature: Number(r.legislature),
    url_an: txt(r.url_an),
    url_senat: txt(r.url_senat),
    url_legifrance: txt(r.url_legifrance),
    procedure_acceleree: bool(r.procedure_acceleree),
    n_lectures: Number(r.n_lectures),
    chambre_finale: txt(r.chambre_finale) as Loi['chambre_finale'],
    mode_an: txt(r.mode_an) as Loi['mode_an'],
    scrutin_an: txt(r.scrutin_an),
    classe_an: txt(r.classe_an) as Loi['classe_an'],
    pivots_hors_socle_an: liste(r.pivots_hors_socle_an),
    pivots_abstention_an: liste(r.pivots_abstention_an),
    gagnants_hors_socle_an: liste(r.gagnants_hors_socle_an),
    mode_sn: txt(r.mode_sn) as Loi['mode_sn'],
    scrutin_sn: txt(r.scrutin_sn),
    classe_sn: txt(r.classe_sn) as Loi['classe_sn'],
    a_49_3: bool(r.a_49_3),
    a_rejet_inverse: bool(r.a_rejet_inverse),
    a_vote_bloque: bool(r.a_vote_bloque),
    a_delai_expire: bool(r.a_delai_expire),
    contournement: bool(r.contournement)
  };
}

function lecture(r: Ligne): Lecture {
  return {
    id: r.id!,
    loi_id: r.loi_id!,
    etape: r.etape!,
    chambre: r.chambre as Lecture['chambre'],
    type_lecture: r.type_lecture as Lecture['type_lecture'],
    date: txt(r.date),
    statut: r.statut!,
    issue: r.issue as Lecture['issue'],
    decision_deduite: bool(r.decision_deduite),
    mode_adoption: r.mode_adoption as Lecture['mode_adoption'],
    scrutin_id: txt(r.scrutin_id),
    vote_bloque: bool(r.vote_bloque),
    score_rejet_inverse: num(r.score_rejet_inverse)
  };
}

function scrutin(r: Ligne): Scrutin {
  return {
    id: r.id!,
    chambre: r.chambre as Scrutin['chambre'],
    numero: Number(r.numero),
    date: r.date!,
    type_vote: r.type_vote as Scrutin['type_vote'],
    titre: r.titre!,
    objet: r.objet!,
    sort: r.sort as Scrutin['sort'],
    pour: Number(r.pour),
    contre: Number(r.contre),
    abstention: Number(r.abstention),
    votants: Number(r.votants),
    exprimes: Number(r.exprimes),
    requis: Number(r.requis),
    lecture_id: txt(r.lecture_id),
    loi_id: txt(r.loi_id)
  };
}

const BLOCS: Bloc[] = ['gauche', 'centre', 'droite', 'rn', 'autres'];

function signature(r: Ligne): Signature {
  return {
    scrutin_id: r.scrutin_id!,
    camp: r.camp as Signature['camp'],
    classe: r.classe as Signature['classe'],
    socle: r.socle!,
    blocs: Object.fromEntries(BLOCS.map((b) => [b, txt(r[`bloc_${b}`])])) as Signature['blocs'],
    gagnants_hors_socle: liste(r.gagnants_hors_socle),
    pivots: liste(r.pivots),
    pivots_hors_socle: liste(r.pivots_hors_socle),
    pivots_abstention: liste(r.pivots_abstention)
  };
}

export interface Groupe {
  id: string;
  chambre: 'AN' | 'SN';
  legislature: number | null;
  sigle: string;
  nom: string;
  bloc: Bloc;
  couleur: string | null;
}

export interface Meta {
  genere_le: string;
  sources: Record<string, Source>;
  comptes: Record<string, number>;
  referentiels: {
    blocs: {
      blocs: Record<Bloc, { libelle: string; ordre: number }>;
      socle: Record<string, { debut: string; blocs: Bloc[] }>;
      assemblee: Record<string, Record<string, { sigle: string; bloc: Bloc }>>;
      senat: Record<string, { sigle: string; nom: string; bloc: Bloc }>;
    };
    flags: Record<string, Record<string, unknown>>;
    periodes: { periodes: { code: string; debut: string; libelle: string }[] };
  };
}

export interface Base {
  lois: Loi[];
  lectures: Lecture[];
  scrutins: Map<string, Scrutin>;
  positions: Map<string, PositionGroupe[]>;
  signatures: Map<string, Signature>;
  groupes: Map<string, Groupe>;
  evenements: Evenement[];
  meta: Meta;
}

let cache: Base | null = null;

/** Toute la base, lue une fois par build. */
export function base(): Base {
  if (cache) return cache;
  const groupes = new Map<string, Groupe>(
    lire('groupes.csv').map((r) => [
      r.id!,
      {
        id: r.id!,
        chambre: r.chambre as Groupe['chambre'],
        legislature: num(r.legislature),
        sigle: r.sigle!,
        nom: r.nom!,
        bloc: r.bloc as Bloc,
        couleur: txt(r.couleur)
      }
    ])
  );
  const positions = new Map<string, PositionGroupe[]>();
  for (const r of lire('positions_groupes.csv')) {
    const g = groupes.get(r.groupe_id!);
    const p: PositionGroupe = {
      groupe_id: r.groupe_id!,
      sigle: g?.sigle ?? r.groupe_id!,
      nom: g?.nom ?? '',
      bloc: r.bloc as Bloc,
      membres: Number(r.membres),
      pour: Number(r.pour),
      contre: Number(r.contre),
      abstention: Number(r.abstention),
      non_votants: Number(r.non_votants),
      position: r.position as PositionGroupe['position'],
      cohesion: num(r.cohesion),
      pivot: bool(r.pivot),
      pivot_abstention: bool(r.pivot_abstention)
    };
    const l = positions.get(r.scrutin_id!) ?? [];
    l.push(p);
    positions.set(r.scrutin_id!, l);
  }
  cache = {
    lois: lire('lois.csv').map(loi),
    lectures: lire('lectures.csv').map(lecture),
    scrutins: new Map(lire('scrutins.csv').map((r) => [r.id!, scrutin(r)])),
    positions,
    signatures: new Map(lire('signatures.csv').map((r) => [r.scrutin_id!, signature(r)])),
    groupes,
    evenements: lire('evenements.csv').map((r) => ({
      loi_id: r.loi_id!,
      date: r.date!,
      etape: r.etape!,
      scrutin_id: txt(r.scrutin_id),
      detail: txt(r.detail),
      type: r.type!
    })),
    meta: JSON.parse(readFileSync(resolve(EXPORT, 'meta.json'), 'utf8')) as Meta
  };
  return cache;
}

/** Un scrutin avec ses positions de groupe (ordonnées par bloc puis par taille) et sa signature. */
export function scrutinDetaille(id: string | null): ScrutinDetaille | null {
  if (!id) return null;
  const b = base();
  const s = b.scrutins.get(id);
  if (!s) return null;
  const ordre = b.meta.referentiels.blocs.blocs;
  const positions = [...(b.positions.get(id) ?? [])].sort(
    (x, y) => ordre[x.bloc].ordre - ordre[y.bloc].ordre || y.membres - x.membres
  );
  return { ...s, positions, signature: b.signatures.get(id) ?? null };
}
