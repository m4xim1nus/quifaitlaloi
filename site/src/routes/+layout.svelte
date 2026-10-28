<script lang="ts">
  import '../app.css';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { dateLongue } from '$lib/format';
  import { DEPOT, LICENCE, URL_LICENCE, URL_OPEN_DATA_AN, URL_OPEN_DATA_SENAT } from '$lib/site';

  let { data, children } = $props();

  // Trois groupes : les analyses, les textes, la méthode (en retrait sur grand écran).
  const ANALYSES = [
    { href: '/comparer', libelle: 'Comparer' },
    { href: '/coalitions', libelle: 'Coalitions' },
    { href: '/recits', libelle: 'Récits' }
  ];
  const TEXTES = [
    { href: '/lois', libelle: 'Les lois' },
    { href: '/en-cours', libelle: 'Textes en cours' }
  ];
  const METHODE = [
    { href: '/methodologie', libelle: 'Méthodologie' },
    { href: '/donnees', libelle: 'Données' }
  ];
  const actif = (href: string) =>
    page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);

  // Sur téléphone, le menu se replie : il se referme à chaque navigation.
  let menu = $state(false);
  afterNavigate(() => {
    menu = false;
  });
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
  <nav class="en-ligne" aria-label="Navigation principale">
    <span class="groupe">{@render liens([...ANALYSES, ...TEXTES])}</span>
    <span class="groupe methode">{@render liens(METHODE)}</span>
  </nav>
  <details class="menu" bind:open={menu}>
    <summary>Menu</summary>
    <nav aria-label="Navigation principale">
      {#each [ANALYSES, TEXTES, METHODE] as groupe, i (i)}
        <div class="groupe">{@render liens(groupe)}</div>
      {/each}
    </nav>
  </details>
</header>

{#snippet liens(groupe: { href: string; libelle: string }[])}
  {#each groupe as l (l.href)}
    <a href={l.href} aria-current={actif(l.href) ? 'page' : undefined}>{l.libelle}</a>
  {/each}
{/snippet}

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
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: baseline;
    gap: 8px 32px;
  }
  .marque {
    grid-row: 1;
    grid-column: 1;
    position: relative;
    z-index: 1;
    font-family: var(--serif);
    font-size: 1.375rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--encre);
    text-decoration: none;
  }
  nav a {
    color: var(--ardoise);
    text-decoration: none;
    font-size: 0.95rem;
  }
  nav a:hover {
    color: var(--encre);
  }
  nav a[aria-current='page'] {
    color: var(--encre);
  }
  .en-ligne {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 4px 20px;
  }
  .en-ligne .groupe {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 20px;
  }
  .en-ligne a {
    padding: 2px 0;
    border-bottom: 2px solid transparent;
  }
  .en-ligne a[aria-current='page'] {
    border-bottom-color: var(--encre);
  }
  .en-ligne .methode a {
    font-size: 0.875rem;
  }
  /* Sur téléphone : la marque, et un menu replié qui pousse le contenu. Le menu couvre toute
     la rangée, la marque passe au-dessus de lui. */
  .menu {
    display: none;
    grid-row: 1;
    grid-column: 1 / -1;
  }
  .menu summary {
    width: max-content;
    margin-left: auto;
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 14px;
    border: 1px solid var(--filet);
    border-radius: 999px;
    font-size: 0.9375rem;
    cursor: pointer;
    list-style: none;
  }
  .menu summary::-webkit-details-marker {
    display: none;
  }
  .menu summary::after {
    content: '';
    width: 0.45em;
    height: 0.45em;
    border-right: 1.5px solid currentColor;
    border-bottom: 1.5px solid currentColor;
    transform: translateY(-25%) rotate(45deg);
  }
  .menu[open] summary {
    border-color: var(--encre);
  }
  .menu[open] summary::after {
    transform: translateY(25%) rotate(-135deg);
  }
  .menu nav {
    margin-top: 12px;
    border-bottom: 1px solid var(--filet);
  }
  .menu .groupe {
    display: grid;
    padding: 6px 0;
    border-top: 1px solid var(--filet);
  }
  .menu a {
    min-height: 44px;
    display: flex;
    align-items: center;
    font-size: 1.0625rem;
  }
  .menu a[aria-current='page'] {
    font-weight: 700;
  }
  @media (max-width: 54rem) {
    .entete {
      align-items: start;
    }
    .marque {
      line-height: 44px;
    }
    .en-ligne {
      display: none;
    }
    .menu {
      display: block;
    }
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
