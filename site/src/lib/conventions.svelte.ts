// Interrupteur global « avec ou sans conventions » (docs/CONCEPTION.md §3), porté par l'URL
// (?conventions=1). Lu seulement dans le navigateur : l'URL n'existe pas au prérendu.
import { browser } from '$app/environment';
import { replaceState } from '$app/navigation';
import { page } from '$app/state';

export function lireConventions(): boolean {
  return browser && page.url.searchParams.get('conventions') === '1';
}

/** Met l'URL à jour si besoin. À n'appeler qu'après l'hydratation (le routeur doit être prêt). */
export function ecrireConventions(valeur: boolean) {
  if (!browser || valeur === lireConventions()) return;
  const url = new URL(page.url);
  if (valeur) url.searchParams.set('conventions', '1');
  else url.searchParams.delete('conventions');
  replaceState(url, page.state);
}
