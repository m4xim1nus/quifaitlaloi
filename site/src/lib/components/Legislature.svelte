<script lang="ts">
  // Les trois questions d'une législature (chemins, coalitions, groupes décisifs), sur le
  // gabarit de l'accueil : l'accueil (XVIIe) et les pages /legislature/[num] (XVe, XVIe).
  import type { Snippet } from 'svelte';
  import Frise from './Frise.svelte';
  import Composition from './Composition.svelte';
  import VotesGroupes from './VotesGroupes.svelte';
  import Decisifs from './Decisifs.svelte';
  import Comment from './Comment.svelte';
  import { filtrer, parChemin } from '$lib/agregats';
  import { CHEMINS, DEFINITION_CHEMIN, LIBELLE_CHEMIN, LIBELLE_CLASSE } from '$lib/libelles';
  import { dateLongue } from '$lib/format';
  import type { Legislature } from '$lib/legislatures';
  import type { GroupeAffiche, LoiResume, Periode } from '$lib/server/vues';

  interface Props {
    leg: Legislature;
    /** Toutes les lois de la législature, conventions comprises. */
    toutes: LoiResume[];
    groupes: GroupeAffiche[];
    periodes: Periode[];
    conventions: boolean;
    /** Note sous les groupes décisifs (un cas d'école propre à la législature). */
    noteDecisifs?: Snippet;
  }
  let { leg, toutes, groupes, periodes, conventions, noteDecisifs }: Props = $props();

  const debut = $derived(leg.debut);
  const fin = $derived(leg.fin ?? toutes.at(-1)!.date_adoption);

  const lois = $derived(filtrer(toutes, conventions));
  const n = $derived(lois.length);
  const chemins = $derived(parChemin(lois));
  const contournements = $derived(
    [...chemins.art_49_3, ...chemins.rejet_inverse].sort((a, b) =>
      a.date_adoption.localeCompare(b.date_adoption)
    )
  );
  const solennels = $derived(chemins.nominatif.filter((l) => l.solennel).length);
  const compte = (pred: (l: LoiResume) => boolean) => lois.filter(pred).length;
  const socleRn = $derived(compte((l) => l.classe_an === 'socle_rn'));
  const transpartisan = $derived(compte((l) => l.classe_an === 'transpartisan'));
  const navette = $derived({
    conforme: compte((l) => l.fin_navette === 'conforme'),
    cmp: compte((l) => l.fin_navette === 'cmp'),
    definitive: compte((l) => l.fin_navette === 'definitive')
  });
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

  <a class="evitement-frise petit" href="#cartes-chemins">Passer la frise</a>
  <Frise {lois} {debut} {fin} jalons={periodes} />
  <p class="petit secondaire colonne">
    Chaque carré est une loi, placée au mois de son adoption définitive et colorée selon la façon
    dont l’Assemblée l’a adoptée. {n} lois{conventions
      ? ', accords internationaux compris'
      : `, hors ${toutes.length - n} accords internationaux`}. La
    <a href="/lois?legislature={leg.num}">liste des lois</a> donne les mêmes informations sous forme de
    tableau.
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
        <span class="petit secondaire">{DEFINITION_CHEMIN[c]}</span>
      </li>
    {/each}
  </ul>

  {#if contournements.length}
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

  <p class="colonne navette">
    <strong>Et la navette&#8239;?</strong> Avant ce dernier vote, les deux chambres se sont mises
    d’accord de trois façons&#8239;: {navette.conforme}
    {pluriel(navette.conforme, 'loi')} adoptée{navette.conforme > 1 ? 's' : ''} dans les mêmes termes
    par l’une puis l’autre, {navette.cmp} sur le texte d’une commission mixte paritaire (sept députés
    et sept sénateurs), {navette.definitive} en lecture définitive, l’Assemblée ayant le dernier mot.
    <Comment ancre="lectures" />
  </p>
</section>

<section id="coalitions">
  <h2>Avec quelles voix&#8239;?</h2>
  <p class="message colonne">{leg.messages.coalitions} <Comment ancre="coalitions" /></p>

  <h3>Les coalitions</h3>
  <Composition {lois} {conventions} legislature={leg.num} />

  <h3>Comment chaque groupe a voté</h3>
  <p class="colonne petit secondaire">
    Position majoritaire de chaque groupe au vote décisif de chaque loi (sur un 49.3, la motion de
    censure). Le chiffre&#8239;: nombre de lois que le groupe a votées ou laissé passer, sur celles
    où il a pris position. <Comment ancre="position" />
  </p>
  <VotesGroupes {lois} {groupes} legislature={leg.num} />

  {#if socleRn || transpartisan}
    <p class="petit secondaire colonne">
      « {LIBELLE_CLASSE.socle_rn} » veut dire qu’au moins un groupe du bloc RN a voté avec le socle, pas
      qu’il pouvait faire tomber le texte&#8239;: c’est la question suivante.
    </p>
  {/if}
</section>

<section id="pivots">
  <h2>Quels groupes ont été décisifs&#8239;?</h2>
  <p class="message colonne">{leg.messages.decisifs}</p>
  <p class="petit secondaire colonne">
    Un groupe extérieur au socle est décisif si, en votant à l’inverse, il renversait le
    résultat&#8239;: s’il avait voté contre, le texte tombait&#8239;; sur un 49.3, la censure
    passait s’il l’avait votée. <Comment ancre="decisif" />
  </p>
  <Decisifs {lois} {groupes} />
  {@render noteDecisifs?.()}
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
  .navette {
    border-left: 3px solid var(--filet);
    padding-left: 14px;
  }
</style>
