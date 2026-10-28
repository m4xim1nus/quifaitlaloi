// Extraits de la base pour chaque page : ce que le navigateur reçoit, et rien de plus.
import { base, scrutinDetaille } from './donnees';
import { chemin, type Chemin } from '$lib/libelles';
import type { Bloc, Classe, Loi, Position, TypeLoi } from '$lib/types';

/** Ligne de la frise et de l'explorateur. */
export interface LoiResume {
  id: string;
  /** Législature de l'adoption définitive. */
  legislature: number;
  titre_court: string;
  type: TypeLoi;
  initiative: Loi['initiative'];
  date_adoption: string;
  chemin: Chemin;
  /** Dernier vote nominatif de l'AN en vote solennel. */
  solennel: boolean;
  classe_an: Classe | null;
  /** Position de chaque groupe au vote décisif de l'AN (sur un 49.3 : la censure). */
  votes: Record<string, Position>;
  /** Législature de ce vote décisif (16 pour une lecture tenue avant la dissolution). */
  leg_an: number | null;
  /** Groupes hors socle décisifs par leur abstention. */
  pivots_abst_hors_socle: string[];
  pivots: string[];
  pivots_abstention: string[];
  contournement: boolean;
  delai_expire: boolean;
  procedure_acceleree: boolean;
  n_lectures: number;
  fin_navette: FinNavette;
  themes: string[];
}

export function resumes(): LoiResume[] {
  const b = base();
  const socle = (leg: number) => b.meta.referentiels.blocs.socle[String(leg)]?.blocs ?? [];
  return b.lois
    .map((l) => {
      const positions = (l.scrutin_an && b.positions.get(l.scrutin_an)) || [];
      const blocDe = new Map(positions.map((p) => [p.sigle, p.bloc]));
      const leg = (l.scrutin_an && b.scrutins.get(l.scrutin_an)?.legislature) || null;
      return {
        id: l.id,
        legislature: l.legislature,
        titre_court: l.titre_court,
        type: l.type,
        initiative: l.initiative,
        date_adoption: l.date_adoption,
        chemin: chemin(l),
        solennel: l.mode_an === 'SCRUTIN_SOLENNEL',
        classe_an: l.classe_an,
        votes: Object.fromEntries(positions.map((p) => [p.sigle, p.position])),
        leg_an: leg,
        pivots_abst_hors_socle: l.pivots_abstention_an.filter(
          (g) => !socle(leg ?? l.legislature).includes(blocDe.get(g) as Bloc)
        ),
        pivots: l.pivots_hors_socle_an,
        pivots_abstention: l.pivots_abstention_an,
        contournement: l.contournement,
        delai_expire: l.a_delai_expire,
        procedure_acceleree: l.procedure_acceleree,
        n_lectures: l.n_lectures,
        fin_navette: finNavette(l.id),
        themes: l.themes
      };
    })
    .sort((a, b) => a.date_adoption.localeCompare(b.date_adoption) || a.id.localeCompare(b.id));
}

/** Comment la navette s'est conclue : lecture définitive à l'AN, texte de CMP, ou vote conforme. */
export type FinNavette = 'definitive' | 'cmp' | 'conforme';

function finNavette(id: string): FinNavette {
  const types = new Set(
    base()
      .lectures.filter((l) => l.loi_id === id)
      .map((l) => l.type_lecture)
  );
  return types.has('definitive') ? 'definitive' : types.has('cmp') ? 'cmp' : 'conforme';
}

export interface GroupeAffiche {
  sigle: string;
  nom: string;
  bloc: Bloc;
  couleur: string | null;
}

/** Groupes de l'AN d'une législature, de la gauche vers la droite (ordre des blocs, puis blocs.yaml).
 * Un groupe renommé (MODEM puis DEM, NG puis SOC) garde deux entrées, une par sigle. */
export function groupesAN(legislature: number): GroupeAffiche[] {
  const b = base();
  const ordre = b.meta.referentiels.blocs.blocs;
  const vus = new Set<string>();
  return [...b.groupes.values()]
    .filter((g) => g.chambre === 'AN' && g.legislature === legislature)
    .filter((g) => !vus.has(g.sigle) && !!vus.add(g.sigle))
    .map((g, i) => ({ g, i }))
    .sort((x, y) => ordre[x.g.bloc].ordre - ordre[y.g.bloc].ordre || x.i - y.i)
    .map(({ g }) => ({ sigle: g.sigle, nom: g.nom, bloc: g.bloc, couleur: g.couleur }));
}

export interface Periode {
  code: string;
  debut: string;
  libelle: string;
}

/** Périodes charnières (pipeline/referentiels/periodes.yaml) ; seules celles nommées dans JALON
 * sont tracées sur les frises. */
export function periodes(): Periode[] {
  return base().meta.referentiels.periodes.periodes;
}

export function dateDonnees(): string {
  return base().meta.genere_le.slice(0, 10);
}

/** Tout ce qu'affiche la fiche d'une loi. */
export function fiche(id: string) {
  const b = base();
  const loi = b.lois.find((l) => l.id === id);
  if (!loi) return null;
  const lectures = b.lectures.filter((l) => l.loi_id === id);
  const evenements = b.evenements.filter((e) => e.loi_id === id);
  // motions de censure du parcours ; sous la XVIe, seul le scrutin miroir de chaque 49.3 est
  // rattaché (par la lecture, faute de voteRefs sur les motions du dossier)
  const ids = new Set(
    evenements.filter((e) => e.type === 'motion_censure' && e.scrutin_id).map((e) => e.scrutin_id!)
  );
  for (const l of lectures)
    if (l.mode_adoption === 'ART_49_3' && l.scrutin_id) ids.add(l.scrutin_id);
  const censures = [...ids]
    .map((id) => scrutinDetaille(id))
    .filter((s) => s !== null)
    .sort((a, b) => a.date.localeCompare(b.date) || a.numero - b.numero);
  return {
    loi,
    chemin: chemin(loi),
    lectures: lectures.map((l) => ({ ...l, scrutin: scrutinDetaille(l.scrutin_id) })),
    evenements,
    censures,
    decisif_an: scrutinDetaille(loi.scrutin_an),
    decisif_sn: scrutinDetaille(loi.scrutin_sn)
  };
}

export type Fiche = NonNullable<ReturnType<typeof fiche>>;

/** Couleur officielle des groupes AN (référentiel AMO), par sigle ; le Sénat n'en publie pas.
 * Un sigle repris d'une législature à l'autre (SOC, RN…) prend la couleur de `legislature`
 * (par défaut, la plus récente). */
export function couleursGroupes(legislature?: number): Record<string, string> {
  const out: Record<string, string> = {};
  const gs = [...base().groupes.values()].filter((g) => g.couleur && g.chambre === 'AN');
  gs.sort(
    (a, b) =>
      Number(a.legislature === legislature) - Number(b.legislature === legislature) ||
      (a.legislature ?? 0) - (b.legislature ?? 0)
  );
  for (const g of gs) out[g.sigle] = g.couleur!;
  return out;
}
