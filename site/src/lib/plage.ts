// Période étudiée : un intervalle de dates [du, au] qui filtre tout l'accueil. Préréglages pris
// dans les dates charnières (periodes.yaml) ; d'autres législatures s'y ajouteront (baselines).
import { NOM_PERIODE } from './libelles';

export interface Plage {
  du: string; // AAAA-MM-JJ inclus
  au: string; // AAAA-MM-JJ inclus
}

export interface Prereglage extends Plage {
  code: string;
  libelle: string;
}

export const dansPlage = (date: string, p: Plage) => date >= p.du && date <= p.au;

/** Veille d'une date ISO. */
export function veille(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** « Tout », puis une entrée par période nommée, chacune jusqu'à la veille de la suivante. */
export function prereglages(
  periodes: { code: string; debut: string }[],
  debut: string,
  fin: string
): Prereglage[] {
  const out: Prereglage[] = [{ code: 'tout', libelle: 'Toute la période', du: debut, au: fin }];
  periodes.forEach((p, i) => {
    if (!NOM_PERIODE[p.code]) return;
    const suivante = periodes[i + 1];
    out.push({
      code: p.code,
      libelle: NOM_PERIODE[p.code],
      du: p.debut,
      au: suivante ? veille(suivante.debut) : fin
    });
  });
  return out;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Lit ?du=…&au=… ; retombe sur la plage complète si absent ou invalide. */
export function lirePlage(p: URLSearchParams, complete: Plage): Plage {
  const du = p.get('du');
  const au = p.get('au');
  return {
    du: du && DATE.test(du) ? du : complete.du,
    au: au && DATE.test(au) ? au : complete.au
  };
}

export function ecrirePlage(params: URLSearchParams, p: Plage, complete: Plage) {
  if (p.du === complete.du && p.au === complete.au) {
    params.delete('du');
    params.delete('au');
  } else {
    params.set('du', p.du);
    params.set('au', p.au);
  }
}

/** Premier et dernier jour d'un mois AAAA-MM. */
export function bornesMois(cle: string): Plage {
  const [a, m] = cle.split('-').map(Number);
  const dernier = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { du: `${cle}-01`, au: `${cle}-${String(dernier).padStart(2, '0')}` };
}
