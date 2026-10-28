<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import Interrupteur from '$lib/components/Interrupteur.svelte';
  import Legislature from '$lib/components/Legislature.svelte';
  import ChoixLegislature from '$lib/components/ChoixLegislature.svelte';
  import Comment from '$lib/components/Comment.svelte';
  import { legislature } from '$lib/legislatures';
  import { lireConventions, ecrireConventions } from '$lib/conventions.svelte';

  let { data } = $props();

  const leg = $derived(legislature(data.num));
  const toutes = $derived(data.lois);

  let conventions = $state(false);
  let pret = $state(false);
  afterNavigate(() => {
    if (pret) return;
    conventions = lireConventions();
    pret = true;
  });
  $effect(() => {
    if (pret) ecrireConventions(conventions);
  });

  const nConventions = $derived(toutes.filter((l) => l.type === 'convention').length);
</script>

<svelte:head>
  <title>{leg.romain} législature ({leg.annees}) · Qui fait la loi ?</title>
  <meta
    name="description"
    content="Les lois adoptées sous la {leg.romain} législature ({leg.annees}), classées selon la façon dont l’Assemblée les a adoptées et selon les groupes qui les ont votées."
  />
</svelte:head>

<section class="ouverture">
  <h1>Qui faisait la loi de {leg.annees.replace('-', ' à ')}&#8239;?</h1>
  <p class="chapo colonne">{leg.contexte} {leg.chapo}</p>
  <ChoixLegislature courant={leg.num} />
  <div class="reglage">
    <Interrupteur bind:valeur={conventions}>
      Inclure les {nConventions} accords internationaux
    </Interrupteur>
    <span class="petit secondaire">
      Lois qui autorisent un traité ; presque toutes passent sans vote nominatif.
      <Comment ancre="accords" />
    </span>
  </div>
</section>

<Legislature
  {leg}
  {toutes}
  groupes={data.groupes}
  periodes={data.periodes}
  {conventions}
  zooms={data.zooms}
/>

<section id="limites">
  <h2>Ce que ces chiffres ne disent pas</h2>
  <ul class="limites colonne">
    <li>
      <strong>Le contenu des lois.</strong> Une loi technique et une loi de société comptent chacune pour
      un carré.
    </li>
    <li>
      <strong>Les textes rejetés, abandonnés ou en cours.</strong> Seules les lois adoptées sont
      comptées.
      {#if leg.num === 15}La réforme des retraites de 2020, adoptée au 49.3 en première lecture puis
        abandonnée pendant la crise sanitaire, n’apparaît pas.{/if}
    </li>
    {#if leg.num === 15}
      <li>
        <strong>Pas de groupe RN.</strong> Ses huit députés, trop peu nombreux pour former un groupe,
        siègent parmi les non-inscrits.
      </li>
    {/if}
  </ul>
  <p class="colonne">
    <a href="/comparer">Comparer les trois législatures</a>,
    <a href="/methodologie">lire la méthodologie</a> ou
    <a href="/lois?legislature={leg.num}">parcourir les {toutes.length} lois</a>.
  </p>
</section>

<style>
  section {
    padding-top: 64px;
    display: grid;
    gap: 20px;
  }
  .ouverture {
    padding-top: 48px;
  }
  .reglage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    margin-top: 8px;
  }
  h1 {
    max-width: 22ch;
  }
  .chapo {
    font-size: 1.1875rem;
  }
  .limites {
    padding-left: 1.1em;
    display: grid;
    gap: 10px;
  }
</style>
