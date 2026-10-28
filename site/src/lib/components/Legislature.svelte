<script lang="ts">
  // Les trois questions d'une législature (chemins, coalitions, groupes décisifs), sur le
  // gabarit de l'accueil : l'accueil (XVIIe) et les pages /legislature/[num] (XVe, XVIe).
  import type { Snippet } from 'svelte';
  import Frise from './Frise.svelte';
  import Composition from './Composition.svelte';
  import VotesGroupes from './VotesGroupes.svelte';
  import Decisifs from './Decisifs.svelte';
  import Comment from './Comment.svelte';
  import Zoom from './Zoom.svelte';
  import Interrupteur from './Interrupteur.svelte';
  import { filtrer, parChemin } from '$lib/agregats';
  import { CHEMINS, LIBELLE_CHEMIN } from '$lib/libelles';
  import { dateLongue } from '$lib/format';
  import type { Legislature } from '$lib/legislatures';
  import type { GroupeAffiche, LoiResume, Periode } from '$lib/server/vues';
  import type { Zoom as ZoomT } from '$lib/server/recits';

  interface Props {
    leg: Legislature;
    /** Toutes les lois de la législature, conventions comprises. */
    toutes: LoiResume[];
    groupes: GroupeAffiche[];
    periodes: Periode[];
    /** Avec ou sans les accords internationaux : l'interrupteur est dans la section 1. */
    conventions: boolean;
    /** Note sous les groupes décisifs (un cas d'école propre à la législature). */
    noteDecisifs?: Snippet;
    /** Récits insérés dans le fil, chacun à sa question. */
    zooms?: ZoomT[];
  }
  let {
    leg,
    toutes,
    groupes,
    periodes,
    conventions = $bindable(),
    noteDecisifs,
    zooms = []
  }: Props = $props();
  const zoomsDe = (section: ZoomT['section']) => zooms.filter((z) => z.section === section);

  const debut = $derived(leg.debut);
  const fin = $derived(leg.fin ?? toutes.at(-1)!.date_adoption);

  const nConventions = $derived(toutes.filter((l) => l.type === 'convention').length);
  const lois = $derived(filtrer(toutes, conventions));
  const chemins = $derived(parChemin(lois));
  const contournements = $derived(
    [...chemins.art_49_3, ...chemins.rejet_inverse].sort((a, b) =>
      a.date_adoption.localeCompare(b.date_adoption)
    )
  );
  const solennels = $derived(chemins.nominatif.filter((l) => l.solennel).length);
  const pluriel = (k: number, mot: string) => `${mot}${k > 1 ? 's' : ''}`;
  const SOMMAIRE = [
    { id: 'chemins', titre: 'Comment les lois passent-elles à l’Assemblée ?' },
    { id: 'coalitions', titre: 'Avec quelles voix ?' },
    { id: 'pivots', titre: 'Quels groupes ont été décisifs ?' }
  ];
</script>

<nav class="sommaire" aria-label="Sur cette page">
  {#each SOMMAIRE as q, i (q.id)}
    <a href="#{q.id}"><span class="num chiffres">{i + 1}</span>{q.titre}</a>
  {/each}
</nav>

<section id="chemins">
  <h2>Comment les lois passent-elles à l’Assemblée&#8239;?</h2>
  <p class="message colonne">{leg.messages.chemins} <Comment ancre="chemins" /></p>

  <div class="reglage">
    <Interrupteur bind:valeur={conventions}>
      Inclure les {nConventions} accords internationaux
    </Interrupteur>
    <span class="petit secondaire">
      Lois qui autorisent un traité ; presque toutes passent sans vote nominatif.
      <Comment ancre="accords" />
    </span>
  </div>

  <a class="evitement-frise petit" href="#cartes-chemins">Passer la frise</a>
  <Frise {lois} {debut} {fin} jalons={periodes} />
  <p class="petit secondaire colonne">
    Un carré = une loi, au mois de son adoption définitive{conventions
      ? ', accords internationaux compris'
      : ''}. Le détail est dans la <a href="/lois?legislature={leg.num}">liste des lois</a>.
  </p>

  <ul class="chemins" id="cartes-chemins">
    {#each CHEMINS as c (c)}
      <li class="chemin">
        <span class="tete">
          <span class="pastille ch-{c}"></span>
          <strong>{LIBELLE_CHEMIN[c]}</strong>
          <span class="nombre compte-chemin">{chemins[c].length}</span>
        </span>
        {#if c === 'nominatif' && chemins.nominatif.length}
          <span class="petit"
            >dont {solennels} {pluriel(solennels, 'vote')} {pluriel(solennels, 'solennel')}</span
          >
        {/if}
      </li>
    {/each}
  </ul>

  {#if contournements.length}
    <h3>Les contournements</h3>
    <ul class="liste-lois">
      {#each contournements as l (l.id)}
        <li>
          <span class="pastille ch-{l.chemin}"></span>
          <a href="/lois/{l.id}">{l.titre_court}</a>
          <span class="secondaire petit"
            >{LIBELLE_CHEMIN[l.chemin]}, adoptée le {dateLongue(l.date_adoption)}</span
          >
        </li>
      {/each}
    </ul>
  {/if}
  {#each zoomsDe('chemins') as z (z.loi)}<Zoom zoom={z} />{/each}
</section>

<section id="coalitions">
  <h2>Avec quelles voix&#8239;?</h2>
  <p class="message colonne">{leg.messages.coalitions} <Comment ancre="coalitions" /></p>

  <h3>Les coalitions</h3>
  <Composition {lois} {conventions} legislature={leg.num} resumes={leg.coalitions} />

  {#each zoomsDe('coalitions') as z (z.loi)}<Zoom zoom={z} />{/each}

  <h3>Comment chaque groupe a voté</h3>
  <p class="colonne petit secondaire">
    Position de chaque groupe au vote décisif de chaque loi. <Comment ancre="position" />
  </p>
  <VotesGroupes {lois} {groupes} legislature={leg.num} />
</section>

<section id="pivots">
  <h2>Quels groupes ont été décisifs&#8239;?</h2>
  <p class="message colonne">{leg.messages.decisifs}</p>
  <p class="petit secondaire colonne">
    Décisif&#8239;: en votant à l’inverse, le groupe renversait le résultat. <Comment
      ancre="decisif"
    />
  </p>
  <Decisifs {lois} {groupes} />
  {@render noteDecisifs?.()}
  {#each zoomsDe('decisifs') as z (z.loi)}<Zoom zoom={z} />{/each}
</section>

<style>
  section {
    padding-top: 64px;
    display: grid;
    gap: 20px;
  }
  h3 {
    margin-top: 20px;
  }
  section {
    scroll-margin-top: 8px;
  }
  .message {
    font-family: var(--serif);
    font-size: 1.375rem;
    line-height: 1.4;
  }
  .sommaire {
    margin-top: 32px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: 8px 24px;
  }
  .sommaire a {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid var(--filet);
    color: var(--encre);
    text-decoration: none;
    font-family: var(--serif);
    font-size: 1.125rem;
    line-height: 1.3;
  }
  .sommaire a:hover {
    text-decoration: underline;
  }
  .sommaire .num {
    flex: none;
    width: 1.6em;
    height: 1.6em;
    border-radius: 50%;
    border: 1.5px solid var(--encre);
    display: inline-grid;
    place-items: center;
    font-size: 0.8125rem;
    font-family: var(--sans, inherit);
  }
  .reglage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
  }
  .evitement-frise {
    position: absolute;
    left: -999px;
  }
  .evitement-frise:focus {
    position: static;
  }
  .chemins {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: 24px;
  }
  .chemin {
    display: grid;
    gap: 6px;
    align-content: start;
    border-top: 3px solid var(--filet);
    padding-top: 10px;
  }
  .tete {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .compte-chemin {
    margin-left: auto;
    font-size: 2rem;
    line-height: 1;
  }
  .liste-lois {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
  }
  .liste-lois li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
  }
</style>
