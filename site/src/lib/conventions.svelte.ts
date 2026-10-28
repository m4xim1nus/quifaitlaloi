// Réglages de l'accueil portés par l'URL : ?conventions=1 (accords internationaux) et
// ?du=…&au=… (période). Lus seulement dans le navigateur : l'URL n'existe pas au prérendu.
import { browser } from '$app/environment';
import { replaceState } from '$app/navigation';
import { page } from '$app/state';
import { ecrirePlage, lirePlage, type Plage } from './plage';
import { memeRequete } from './requete';

export function lireReglages(complete: Plage): { conventions: boolean; plage: Plage } {
  if (!browser) return { conventions: false, plage: complete };
  const p = page.url.searchParams;
  return { conventions: p.get('conventions') === '1', plage: lirePlage(p, complete) };
}

/** Met l'URL à jour si besoin. À n'appeler qu'après l'hydratation (le routeur doit être prêt). */
export function ecrireReglages(conventions: boolean, plage: Plage, complete: Plage) {
  if (!browser) return;
  const url = new URL(page.url);
  if (conventions) url.searchParams.set('conventions', '1');
  else url.searchParams.delete('conventions');
  ecrirePlage(url.searchParams, plage, complete);
  if (!memeRequete(url.search, page.url.search)) replaceState(url, page.state);
}
