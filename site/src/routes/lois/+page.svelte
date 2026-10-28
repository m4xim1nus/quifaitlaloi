<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import Interrupteur from '$lib/components/Interrupteur.svelte';
  import Comment from '$lib/components/Comment.svelte';
  import Themes from '$lib/components/Themes.svelte';
  import { appliquer, ecrireFiltres, lireFiltres, VIDES, type Filtres } from '$lib/filtres';
  import { pivots } from '$lib/agregats';
  import {
    CHEMINS,
    CLASSES,
    LIBELLE_CHEMIN,
    LIBELLE_CLASSE,
    LIBELLE_TYPE,
    NOM_PERIODE
  } from '$lib/libelles';
  import { dateCourte, entier } from '$lib/format';
  import type { TypeLoi } from '$lib/types';

  let { data } = $props();

  let f = $state<Filtres>({ ...VIDES });
  let pret = false;
  onMount(() => {
    f = lireFiltres(page.url.searchParams);
    pret = true;
  });
  $effect(() => {
    const q = ecrireFiltres(f);
    if (browser && pret && q !== page.url.search) replaceState(`/lois${q}`, page.state);
  });

  const visibles = $derived(appliquer(data.lois, f, data.periodes));
  const base = $derived(data.lois.filter((l) => f.conventions || l.type !== 'convention'));
  const groupesDecisifs = $derived(pivots(data.lois).map((p) => p.groupe));
  const THEMES = $derived(
    [...new Set(data.lois.flatMap((l) => l.themes))].sort((a, b) => a.localeCompare(b, 'fr'))
  );
  const TYPES: TypeLoi[] = ['ordinaire', 'organique', 'finances', 'financement_ss', 'convention'];
  const actifs = $derived(
    !!(f.texte || f.chemin || f.coalition || f.periode || f.type || f.decisif || f.theme)
  );
</script>

<svelte:head>
  <title>Les lois · Qui fait la loi ?</title>
  <meta
    name="description"
    content="Toutes les lois promulguées depuis juillet 2024 : date, chemin d’adoption à l’Assemblée, coalition du vote décisif et groupes décisifs."
  />
</svelte:head>

<section class="explorateur">
  <h1>Les lois</h1>
  <p class="colonne">
    Chaque loi promulguée depuis juillet 2024, avec la façon dont l’Assemblée l’a adoptée et les
    groupes qui l’ont votée. Choisissez une loi pour voir son parcours et le détail des votes.
  </p>

  <form class="filtres" onsubmit={(e) => e.preventDefault()} role="search">
    <label class="champ texte">
      <span>Rechercher</span>
      <input type="search" bind:value={f.texte} placeholder="Un mot du titre, un numéro de loi" />
    </label>
    <label class="champ">
      <span>Chemin à l’Assemblée</span>
      <select bind:value={f.chemin}>
        <option value="">Tous</option>
        {#each CHEMINS as c (c)}<option value={c}>{LIBELLE_CHEMIN[c]}</option>{/each}
      </select>
    </label>
    <label class="champ">
      <span>Coalition</span>
      <select bind:value={f.coalition}>
        <option value="">Toutes</option>
        {#each CLASSES as c (c)}<option value={c}>{LIBELLE_CLASSE[c]}</option>{/each}
        <option value="aucune">Sans vote nominatif</option>
      </select>
    </label>
    <label class="champ">
      <span>Groupe décisif</span>
      <select bind:value={f.decisif}>
        <option value="">Tous</option>
        {#each groupesDecisifs as g (g)}<option value={g}>{g}</option>{/each}
      </select>
    </label>
    <label class="champ">
      <span>Période</span>
      <select bind:value={f.periode}>
        <option value="">Toutes</option>
        {#each data.periodes.filter((p) => NOM_PERIODE[p.code]) as p (p.code)}
          <option value={p.code}>{NOM_PERIODE[p.code]}</option>
        {/each}
      </select>
    </label>
    <label class="champ">
      <span>Thème (Sénat)</span>
      <select bind:value={f.theme}>
        <option value="">Tous</option>
        {#each THEMES as t (t)}<option value={t}>{t}</option>{/each}
      </select>
    </label>
    <label class="champ">
      <span>Type</span>
      <select bind:value={f.type}>
        <option value="">Tous</option>
        {#each TYPES as t (t)}<option value={t}>{LIBELLE_TYPE[t]}</option>{/each}
      </select>
    </label>
  </form>

  <div class="barre-resultats">
    <p aria-live="polite">
      <strong class="chiffres">{entier(visibles.length)}</strong>
      loi{visibles.length > 1 ? 's' : ''} sur {entier(base.length)}
      {#if actifs}<button
          type="button"
          class="effacer"
          onclick={() => (f = { ...VIDES, conventions: f.conventions })}>Effacer les filtres</button
        >{/if}
    </p>
    <Interrupteur bind:valeur={f.conventions}>Inclure les accords internationaux</Interrupteur>
  </div>

  <div class="defile">
    <table>
      <thead>
        <tr>
          <th scope="col">Adoption</th>
          <th scope="col">Loi</th>
          <th scope="col">Chemin <Comment ancre="chemins" texte="" /></th>
          <th scope="col">Coalition <Comment ancre="coalitions" texte="" /></th>
          <th scope="col">Groupe décisif <Comment ancre="decisif" texte="" /></th>
        </tr>
      </thead>
      <tbody>
        {#each visibles as l (l.id)}
          <tr>
            <td class="date chiffres">{dateCourte(l.date_adoption)}</td>
            <td class="titre">
              <a href="/lois/{l.id}">{l.titre_court}</a>
              <span class="petit secondaire"
                >{LIBELLE_TYPE[l.type]} · n° {l.id} <Themes themes={l.themes} max={3} /></span
              >
            </td>
            <td>
              <span class="pastille ch-{l.chemin}" class:vide={l.chemin === 'sans_scrutin'}></span>
              {LIBELLE_CHEMIN[l.chemin]}
            </td>
            <td>
              {#if l.classe_an}
                <span class="pastille" style:background="var(--co-{l.classe_an})"></span>
                {LIBELLE_CLASSE[l.classe_an]}
              {:else}<span class="secondaire">inconnue</span>{/if}
            </td>
            <td>
              {#each l.pivots as g (g)}
                <span class="groupe"
                  ><span class="puce" style:background={data.couleurs[g] ?? 'var(--gris)'}
                  ></span>{g}</span
                >
              {/each}
            </td>
          </tr>
        {:else}
          <tr><td colspan="5" class="vide-liste">Aucune loi ne correspond à ces filtres.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
  .explorateur {
    padding-top: 48px;
    display: grid;
    gap: 20px;
  }
  .filtres {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: 12px 16px;
  }
  .champ {
    display: grid;
    gap: 4px;
    font-size: 0.875rem;
    color: var(--ardoise);
  }
  .champ.texte {
    grid-column: span 2;
  }
  input,
  select {
    font-size: 1rem;
    color: var(--encre);
    background: var(--papier);
    border: 1px solid var(--filet);
    border-radius: var(--rayon);
    padding: 7px 9px;
    min-width: 0;
  }
  .barre-resultats {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px 24px;
    border-bottom: 1px solid var(--encre);
    padding-bottom: 10px;
  }
  .effacer {
    margin-left: 12px;
    background: none;
    border: none;
    color: var(--lien);
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font-size: 0.875rem;
  }
  .defile {
    overflow-x: auto;
  }
  table {
    width: 100%;
    font-size: 0.9375rem;
  }
  th {
    text-align: left;
    font-size: 0.8125rem;
    color: var(--ardoise);
    padding: 6px 12px 6px 0;
    white-space: nowrap;
  }
  td {
    padding: 9px 12px 9px 0;
    border-bottom: 1px solid var(--filet);
    vertical-align: top;
  }
  .date {
    color: var(--ardoise);
    white-space: nowrap;
  }
  .titre {
    display: grid;
    gap: 2px;
    min-width: 16rem;
  }
  td:nth-child(3),
  td:nth-child(4) {
    white-space: nowrap;
  }
  .groupe {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-right: 10px;
    font-weight: 700;
  }
  .puce {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.15);
  }
  .vide-liste {
    color: var(--ardoise);
    padding: 24px 0;
  }
  @media (max-width: 640px) {
    .filtres {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .champ.texte {
      grid-column: 1 / -1;
    }
    thead {
      display: none;
    }
    tr {
      display: grid;
      grid-template-columns: 1fr;
      border-bottom: 1px solid var(--filet);
      padding: 10px 0;
    }
    td {
      border: none;
      padding: 2px 0;
    }
    .titre {
      min-width: 0;
    }
  }
</style>
