// Comparaison de chaînes de requête à l'ordre des paramètres près : on ne réécrit l'URL que si
// son contenu change (une réécriture pendant l'hydratation casse la page).

const normaliser = (q: string) =>
  [...new URLSearchParams(q.replace(/^\?/, ''))]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('&');

export const memeRequete = (a: string, b: string) => normaliser(a) === normaliser(b);
