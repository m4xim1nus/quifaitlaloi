// Interrupteur « avec ou sans accords internationaux » de l'accueil, porté par l'URL
// (?conventions=1). Lu seulement dans le navigateur : l'URL n'existe pas au prérendu.
import { browser } from '$app/environment';
import { replaceState } from '$app/navigation';
import { page } from '$app/state';
import { memeRequete } from './requete';

export function lireConventions(): boolean {
  return browser && page.url.searchParams.get('conventions') === '1';
}

/** Met l'URL à jour si besoin. À n'appeler qu'après l'hydratation (le routeur doit être prêt). */
export function ecrireConventions(valeur: boolean) {
  if (!browser) return;
  const url = new URL(page.url);
  if (valeur) url.searchParams.set('conventions', '1');
  else url.searchParams.delete('conventions');
  if (!memeRequete(url.search, page.url.search)) replaceState(url, page.state);
}
