<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import Interrupteur from '$lib/components/Interrupteur.svelte';
  import Legislature from '$lib/components/Legislature.svelte';
  import ChoixLegislature from '$lib/components/ChoixLegislature.svelte';
  import Comment from '$lib/components/Comment.svelte';
  import { legislature } from '$lib/legislatures';
  import { lireConventions, ecrireConventions } from '$lib/conventions.svelte';

  let { data } = $props();

  const leg = legislature(17);
  const toutes = $derived(data.lois);

  let conventions = $state(false);
  let pret = $state(false);
  // Le routeur n'est prêt qu'après la première navigation : avant, réécrire l'URL casse la page.
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
  <title>Qui fait la loi ? Comment les lois sont adoptées depuis 2024</title>
  <meta
    name="description"
    content="Les lois promulguées depuis juillet 2024, classées selon la façon dont l’Assemblée les a adoptées (vote, 49.3, rejet par ses partisans) et selon les groupes qui les ont votées. Open data de l’Assemblée nationale et du Sénat."
  />
</svelte:head>

<section class="ouverture">
  <h1>Qui fait la loi depuis 2024&#8239;?</h1>
  <p class="chapo colonne">
    {leg.chapo} Ce site reprend chacune d’elles, à partir des seules données publiques de l’Assemblée
    et du Sénat, et la compare aux deux législatures précédentes.
  </p>
  <ChoixLegislature courant={17} />
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
>
  {#snippet noteDecisifs()}
    <p class="petit secondaire colonne">
      Le calcul se fait groupe par groupe. Sur le budget 2025, ni le RN ni le PS n’étaient décisifs
      seuls&#8239;: aucun des deux ne suffisait à faire passer la censure.
    </p>
  {/snippet}
</Legislature>

<section id="limites">
  <h2>Ce que ces chiffres ne disent pas</h2>
  <ul class="limites colonne">
    <li>
      <strong>Le contenu des lois.</strong> Une loi technique et une loi de société comptent chacune pour
      un carré.
    </li>
    <li>
      <strong>Les textes rejetés, abandonnés ou en cours.</strong> Seules les lois adoptées sont comptées.
    </li>
    <li>
      <strong>Le Sénat.</strong> Les coalitions sont celles de l’Assemblée&#8239;; le vote du Sénat est
      sur la fiche de chaque loi.
    </li>
    <li>
      <strong>LR hors du gouvernement.</strong> La Droite républicaine est comptée dans le socle sur toute
      la législature&#8239;: après son refus de participer au gouvernement Lecornu II, elle vote encore
      avec le centre aussi souvent que Horizons.
    </li>
  </ul>
  <p class="colonne">
    <a href="/methodologie">Lire la méthodologie</a> ou
    <a href="/lois?legislature=17">parcourir les {toutes.length} lois</a>.
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
    max-width: 18ch;
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
