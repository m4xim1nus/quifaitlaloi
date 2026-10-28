<script lang="ts">
  import { LIBELLE_CHEMIN, LIBELLE_CLASSE } from '$lib/libelles';
  import { dateLongue } from '$lib/format';
  import { legislature } from '$lib/legislatures';

  let { data } = $props();
</script>

<svelte:head>
  <title>Récits · Qui fait la loi ?</title>
  <meta
    name="description"
    content="Quelques lois emblématiques racontées pas à pas : leur parcours au Parlement, les votes décisifs et les groupes qui les ont fait passer."
  />
</svelte:head>

<section class="recits">
  <h1>Récits</h1>
  <p class="chapo colonne">
    Quelques lois qui ont marqué leur législature, racontées pas à pas&#8239;: le parcours au
    Parlement, les votes qui ont compté, et ce qui s’est joué autour.
  </p>

  <ul class="liste">
    {#each data.recits as r (r.loi)}
      <li>
        <a class="titre" href="/lois/{r.loi}">{r.titre}</a>
        <span class="meta petit">
          <span class="pastille ch-{r.chemin}"></span>{LIBELLE_CHEMIN[r.chemin]}
          {#if r.classe_an}· {LIBELLE_CLASSE[r.classe_an]}{/if}
          · adoptée le {dateLongue(r.date)}, {legislature(r.legislature).romain} législature
          {#if r.statut === 'brouillon'}<span class="brouillon">en relecture</span>{/if}
        </span>
        <!-- texte échappé par lib/markdown avant mise en forme -->
        <div class="chapo-recit">{@html r.chapo}</div>
      </li>
    {:else}
      <li class="secondaire">Aucun récit pour l’instant.</li>
    {/each}
  </ul>
</section>

<style>
  .recits {
    padding-top: 48px;
    display: grid;
    gap: 20px;
  }
  .chapo {
    font-size: 1.1875rem;
  }
  .liste {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 28px;
  }
  .liste li {
    display: grid;
    gap: 6px;
    border-top: 1px solid var(--filet);
    padding-top: 14px;
    max-width: 48rem;
  }
  .titre {
    font-family: var(--serif);
    font-size: 1.5rem;
    line-height: 1.25;
    color: var(--encre);
  }
  .meta {
    color: var(--ardoise);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
  }
  .chapo-recit :global(p) {
    margin: 0;
  }
  .brouillon {
    padding: 0 6px;
    border: 1px dashed var(--ardoise);
    border-radius: var(--rayon);
  }
</style>
