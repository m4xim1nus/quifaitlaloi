// Extraits de la base pour chaque page : ce que le navigateur reçoit, et rien de plus.
import { base, scrutinDetaille } from './donnees';
import { chemin, type Chemin } from '$lib/libelles';
import type { Classe, Loi, TypeLoi } from '$lib/types';

/** Ligne de la frise et de l'explorateur. */
export interface LoiResume {
  id: string;
  titre_court: string;
  type: TypeLoi;
  initiative: Loi['initiative'];
  date_adoption: string;
  chemin: Chemin;
  classe_an: Classe | null;
  pivots: string[];
  pivots_abstention: string[];
  contournement: boolean;
  delai_expire: boolean;
  procedure_acceleree: boolean;
  n_lectures: number;
}

export function resumes(): LoiResume[] {
  return base()
    .lois.map((l) => ({
      id: l.id,
      titre_court: l.titre_court,
      type: l.type,
      initiative: l.initiative,
      date_adoption: l.date_adoption,
      chemin: chemin(l),
      classe_an: l.classe_an,
      pivots: l.pivots_hors_socle_an,
      pivots_abstention: l.pivots_abstention_an,
      contournement: l.contournement,
      delai_expire: l.a_delai_expire,
      procedure_acceleree: l.procedure_acceleree,
      n_lectures: l.n_lectures
    }))
    .sort((a, b) => a.date_adoption.localeCompare(b.date_adoption) || a.id.localeCompare(b.id));
}

export interface Periode {
  code: string;
  debut: string;
  libelle: string;
}

/** Périodes charnières de la XVIIe (les deux premières, XVIe et dissolution, sont hors frise). */
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
  const censures = evenements
    .filter((e) => e.type === 'motion_censure' && e.scrutin_id)
    .map((e) => scrutinDetaille(e.scrutin_id))
    .filter((s) => s !== null);
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

/** Couleur officielle des groupes AN (référentiel AMO), par sigle ; le Sénat n'en publie pas. */
export function couleursGroupes(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const g of base().groupes.values())
    if (g.couleur && g.chambre === 'AN') out[g.sigle] = g.couleur;
  return out;
}
