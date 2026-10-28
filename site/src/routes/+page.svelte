<script lang="ts">
  import { onMount } from 'svelte';
  import Frise from '$lib/components/Frise.svelte';
  import Reglages from '$lib/components/Reglages.svelte';
  import Composition from '$lib/components/Composition.svelte';
  import VotesGroupes from '$lib/components/VotesGroupes.svelte';
  import Periodes from '$lib/components/Periodes.svelte';
  import Decisifs from '$lib/components/Decisifs.svelte';
  import Comment from '$lib/components/Comment.svelte';
  import { filtrer, parChemin, periodeDe, pivots } from '$lib/agregats';
  import {
    CHEMINS,
    DEFINITION_CHEMIN,
    LIBELLE_CHEMIN,
    LIBELLE_CLASSE,
    SOCLE_COMMUN
  } from '$lib/libelles';
  import { dateLongue, entier } from '$lib/format';
  import { lireReglages, ecrireReglages } from '$lib/conventions.svelte';
  import { dansPlage, prereglages, type Plage } from '$lib/plage';
  import { moisEntre } from '$lib/frise';
  import { enumeration } from '$lib/recit';

  let { data } = $props();

  const toutes = $derived(data.lois);
  const debut = $derived(toutes[0].date_adoption);
  const fin = $derived(toutes.at(-1)!.date_adoption);
  const complete = $derived<Plage>({ du: debut, au: fin });
  const presets = $derived(prereglages(data.periodes, debut, fin));
  const mois = $derived(moisEntre(debut, fin).map((m) => m.cle));

  let conventions = $state(false);
  // svelte-ignore state_referenced_locally
  let plage = $state<Plage>({
    du: data.lois[0].date_adoption,
    au: data.lois.at(-1)!.date_adoption
  });
  let pret = $state(false);
  onMount(() => {
    ({ conventions, plage } = lireReglages(complete));
    pret = true;
  });
  $effect(() => {
    if (pret) ecrireReglages(conventions, plage, complete);
  });

  const nConventions = $derived(toutes.filter((l) => l.type === 'convention').length);
  const pourFrise = $derived(filtrer(toutes, conventions));
  const lois = $derived(pourFrise.filter((l) => dansPlage(l.date_adoption, plage)));
  const n = $derived(lois.length);
  const chemins = $derived(parChemin(lois));
  const contournements = $derived(
    [...chemins.art_49_3, ...chemins.rejet_inverse].sort((a, b) =>
      a.date_adoption.localeCompare(b.date_adoption)
    )
  );
  const solennels = $derived(chemins.nominatif.filter((l) => l.solennel).length);
  const compte = (pred: (l: (typeof lois)[number]) => boolean) => lois.filter(pred).length;
  const consensus = $derived(compte((l) => l.classe_an === 'consensus'));
  const socleGauche = $derived(compte((l) => l.classe_an === 'socle_gauche'));
  const socleRn = $derived(compte((l) => l.classe_an === 'socle_rn'));
  const transpartisan = $derived(compte((l) => l.classe_an === 'transpartisan'));
  const socleSeul = $derived(compte((l) => l.classe_an === 'socle_seul'));
  const lignesPivots = $derived(pivots(lois));
  const loisAvecPivot = $derived(compte((l) => l.pivots.length > 0));
  const abstSeules = $derived(
    compte((l) => !l.pivots.length && l.pivots_abst_hors_socle.length > 0)
  );
  const navette = $derived({
    conforme: compte((l) => l.fin_navette === 'conforme'),
    cmp: compte((l) => l.fin_navette === 'cmp'),
    definitive: compte((l) => l.fin_navette === 'definitive')
  });
  const plusieursPeriodes = $derived(
    new Set(lois.map((l) => periodeDe(l.date_adoption, data.periodes))).size > 1
  );
  const titres = (ls: { titre_court: string }[]) => enumeration(ls.map((l) => l.titre_court));
  const pluriel = (k: number, mot: string) => `${mot}${k > 1 ? 's' : ''}`;
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
    {entier(toutes.length)} lois ont été promulguées depuis le 18 juillet 2024. Pour chacune, ce site
    retrace comment l’Assemblée nationale l’a adoptée, et avec les voix de quels groupes, à partir des
    seules données publiques de l’Assemblée et du Sénat.
  </p>
</section>

<Reglages bind:plage bind:conventions prereglages={presets} {mois} {nConventions} nLois={n} />

<section id="chemins">
  <h2>Comment les lois passent-elles à l’Assemblée&#8239;?</h2>
  <p class="reponse colonne">
    <span class="nombre">{contournements.length}</span>
    {pluriel(contournements.length, 'loi')} sur {n}
    {contournements.length > 1 ? 'ont' : 'a'} contourné à une étape le vote de l’Assemblée sur le texte{#if chemins.art_49_3.length}&#8239;:
      {chemins.art_49_3.length} au 49.3 ({titres(
        chemins.art_49_3
      )}){/if}{#if chemins.rejet_inverse.length}{chemins.art_49_3.length ? ' et ' : ' : '}{chemins
        .rejet_inverse.length}
      {pluriel(chemins.rejet_inverse.length, 'rejetée')} d’emblée par {chemins.rejet_inverse
        .length > 1
        ? 'leurs'
        : 'ses'} partisans pour aller en commission mixte paritaire ({titres(
        chemins.rejet_inverse
      )}){/if}. Les {n - contournements.length} autres ont été votées, dont {chemins.nominatif
      .length} par vote nominatif.
    <Comment ancre="chemins" />
  </p>

  <a class="evitement-frise petit" href="#cartes-chemins">Passer la frise</a>
  <Frise lois={pourFrise} {debut} {fin} jalons={data.periodes} {plage} />
  <p class="petit secondaire colonne">
    Chaque carré est une loi, placée au mois de son adoption définitive et colorée selon la façon
    dont l’Assemblée l’a adoptée. Les lois hors de la période choisie sont estompées. La
    <a href="/lois">liste des lois</a> donne les mêmes informations sous forme de tableau.
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
  <p class="reponse colonne">
    <span class="nombre">{consensus}</span>
    {pluriel(consensus, 'loi')} sur {n}
    {consensus > 1 ? 'sont adoptées' : 'est adoptée'} sans qu’aucun bloc s’y oppose, au vote décisif (sur
    un 49.3, la motion de censure). Les autres passent avec le {SOCLE_COMMUN} et l’appoint de la gauche
    ({socleGauche}), du RN ({socleRn}) ou des deux ({transpartisan}). Le socle sans gauche ni
    RN&#8239;:
    {socleSeul} fois.
    <Comment ancre="coalitions" />
  </p>

  <h3>Les coalitions</h3>
  <Composition {lois} {conventions} />

  <h3>Comment chaque groupe a voté</h3>
  <p class="colonne petit secondaire">
    Position majoritaire de chaque groupe au vote décisif de chaque loi (sur un 49.3, la motion de
    censure). Le chiffre&#8239;: nombre de lois que le groupe a votées ou laissé passer, sur celles
    où il a pris position. <Comment ancre="position" />
  </p>
  <VotesGroupes {lois} groupes={data.groupes} />

  {#if plusieursPeriodes}
    <h3>D’une période à l’autre</h3>
    <Periodes {lois} periodes={data.periodes} />
  {/if}
  <p class="petit secondaire colonne">
    « {LIBELLE_CLASSE.socle_rn} » veut dire qu’au moins un groupe du bloc RN a voté avec le socle, pas
    qu’il pouvait faire tomber le texte&#8239;: c’est la question suivante.
  </p>
</section>

<section id="pivots">
  <h2>Quels groupes ont été décisifs&#8239;?</h2>
  <p class="reponse colonne">
    <span class="nombre">{loisAvecPivot}</span>
    {pluriel(loisAvecPivot, 'loi')} sur {n}&#8239;: un groupe extérieur au socle a été décisif. S’il
    avait voté contre, le texte tombait ; sur un 49.3, la censure passait s’il l’avait votée.
    {#if abstSeules}Pour {abstSeules} autre{abstSeules > 1 ? 's' : ''}, c’est l’abstention d’un
      groupe qui a permis l’adoption.{/if}
    {#if lignesPivots.length}{enumeration(
        lignesPivots.map((p, i) => `${p.groupe} ${p.lois.length}${i === 0 ? ' fois' : ''}`)
      )}.{/if}
    <Comment ancre="decisif" />
  </p>
  <Decisifs {lois} groupes={data.groupes} />
  <p class="petit secondaire colonne">
    Le calcul se fait groupe par groupe. Sur le budget 2025, ni le RN ni le PS n’étaient décisifs
    seuls&#8239;: la censure n’aurait abouti qu’avec les deux.
  </p>
</section>

<section id="limites">
  <h2>Ce que ces chiffres ne disent pas</h2>
  <ul class="limites colonne">
    <li>
      <strong>Le contenu des lois.</strong> Une loi technique et une loi de société comptent chacune pour
      un carré.
    </li>
    <li>
      <strong>Les textes rejetés, abandonnés ou en cours.</strong> Seules les lois promulguées sont comptées&#8239;:
      un texte encore en navette (adopté par une seule chambre) ou retiré faute de majorité n’apparaît
      pas.
    </li>
    <li>
      <strong>Les lois sans vote nominatif.</strong> On ne sait pas qui a voté quoi&#8239;: elles ne sont
      rangées dans aucune coalition.
    </li>
    <li>
      <strong>Le Sénat.</strong> Les coalitions ci-dessus sont celles de l’Assemblée. Les votes du Sénat
      figurent sur la fiche de chaque loi.
    </li>
    <li>
      <strong>Les changements de majorité en cours de route.</strong> Le socle commun compte la Droite
      républicaine sur toute la législature, y compris après son refus de participer au gouvernement Lecornu
      II.
    </li>
    <li>
      <strong>Avant juillet 2024.</strong> Les lois des législatures précédentes, dont la réforme des
      retraites de 2023, viendront en comparaison.
    </li>
  </ul>
  <p class="colonne">
    <a href="/methodologie">Lire la méthodologie</a> ou
    <a href="/lois">parcourir les {toutes.length} lois</a>.
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
    padding-bottom: 24px;
  }
  h1 {
    max-width: 18ch;
  }
  h3 {
    margin-top: 20px;
  }
  .chapo {
    font-size: 1.1875rem;
  }
  .reponse {
    font-size: 1.125rem;
    line-height: 1.5;
  }
  .reponse .nombre {
    font-size: 2.5rem;
    line-height: 1;
    margin-right: 4px;
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
  .limites {
    padding-left: 1.1em;
    display: grid;
    gap: 10px;
  }
</style>
