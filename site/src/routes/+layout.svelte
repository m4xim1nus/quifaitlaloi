<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { dateLongue } from '$lib/format';
  import { DEPOT, LICENCE, URL_LICENCE, URL_OPEN_DATA_AN, URL_OPEN_DATA_SENAT } from '$lib/site';

  let { data, children } = $props();

  const LIENS = [
    { href: '/en-cours', libelle: 'En cours' },
    { href: '/comparer', libelle: 'Comparer' },
    { href: '/recits', libelle: 'Récits' },
    { href: '/lois', libelle: 'Les lois' },
    { href: '/methodologie', libelle: 'Méthodologie' },
    { href: '/donnees', libelle: 'Données' }
  ];
  const actif = (href: string) =>
    page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<svelte:head>
  <meta name="theme-color" content="#fbfbf9" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#161a1f" media="(prefers-color-scheme: dark)" />
</svelte:head>

<a class="evitement" href="#contenu">Aller au contenu</a>

<header class="entete">
  <a class="marque" href="/" aria-current={page.url.pathname === '/' ? 'page' : undefined}>
    Qui fait la loi&#8239;?
  </a>
  <nav aria-label="Navigation principale">
    {#each LIENS as l (l.href)}
      <a href={l.href} aria-current={actif(l.href) ? 'page' : undefined}>{l.libelle}</a>
    {/each}
  </nav>
</header>

<main id="contenu">
  {@render children()}
</main>

<footer class="pied">
  <div class="pied-interieur">
    <p>
      Données arrêtées au {dateLongue(data.dateDonnees)}, d’après l’open data de l’<a
        href={URL_OPEN_DATA_AN}
        rel="external">Assemblée nationale</a
      >
      et du
      <a href={URL_OPEN_DATA_SENAT} rel="external">Sénat</a>.
    </p>
    <p>
      <a href="/methodologie">Méthodologie</a> ·
      <a href="/donnees">Télécharger les données</a> ({LICENCE},
      <a href={URL_LICENCE} rel="external">conditions</a>) ·
      <a href={DEPOT} rel="external">Code source</a> (MIT)
    </p>
    <p class="secondaire">
      Site indépendant, sans lien avec l’Assemblée nationale ni le Sénat. Aucun traceur, aucune
      ressource tierce.
    </p>
  </div>
</footer>

<style>
  .evitement {
    position: absolute;
    left: -999px;
    top: 0;
  }
  .evitement:focus {
    left: 16px;
    top: 8px;
    background: var(--papier);
    padding: 4px 8px;
    z-index: 10;
  }
  .entete {
    max-width: var(--large);
    margin: 0 auto;
    padding: 18px 16px 0;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px 24px;
    flex-wrap: wrap;
  }
  .marque {
    font-family: var(--serif);
    font-size: 1.375rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--encre);
    text-decoration: none;
  }
  nav {
    display: flex;
    gap: 4px 20px;
    flex-wrap: wrap;
  }
  nav a {
    color: var(--ardoise);
    text-decoration: none;
    font-size: 0.95rem;
    padding: 2px 0;
    border-bottom: 2px solid transparent;
  }
  nav a:hover {
    color: var(--encre);
  }
  nav a[aria-current='page'] {
    color: var(--encre);
    border-bottom-color: var(--encre);
  }
  main {
    max-width: var(--large);
    margin: 0 auto;
    padding: 0 16px;
  }
  .pied {
    margin-top: 96px;
    border-top: 1px solid var(--filet);
  }
  .pied-interieur {
    max-width: var(--large);
    margin: 0 auto;
    padding: 24px 16px 48px;
    display: grid;
    gap: 6px;
    font-size: 0.875rem;
    line-height: 1.5;
  }
</style>
