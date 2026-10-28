<script lang="ts">
  import { onMount } from 'svelte';
  import Frise from '$lib/components/Frise.svelte';
  import Coalitions from '$lib/components/Coalitions.svelte';
  import Pivots from '$lib/components/Pivots.svelte';
  import Interrupteur from '$lib/components/Interrupteur.svelte';
  import Comment from '$lib/components/Comment.svelte';
  import { filtrer, parChemin, pivots } from '$lib/agregats';
  import {
    CHEMINS,
    DEFINITION_CHEMIN,
    LIBELLE_CHEMIN,
    LIBELLE_CLASSE,
    SOCLE_COMMUN
  } from '$lib/libelles';
  import { dateLongue, entier } from '$lib/format';
  import { lireConventions, ecrireConventions } from '$lib/conventions.svelte';
  import { enumeration } from '$lib/recit';

  let { data } = $props();

  let conventions = $state(false);
  let pret = $state(false);
  onMount(() => {
    conventions = lireConventions();
    pret = true;
  });
  $effect(() => {
    if (pret) ecrireConventions(conventions);
  });

  const toutes = $derived(data.lois);
  const nConventions = $derived(toutes.filter((l) => l.type === 'convention').length);
  const lois = $derived(filtrer(toutes, conventions));
  const horsConv = $derived(filtrer(toutes, false));
  const chemins = $derived(parChemin(lois));
  const contournements = $derived(
    [...chemins.art_49_3, ...chemins.rejet_inverse].sort((a, b) =>
      a.date_adoption.localeCompare(b.date_adoption)
    )
  );
  const budgets = $derived(chemins.art_49_3.length);
  const votees = $derived(lois.length - contournements.length);
  const consensus = $derived(lois.filter((l) => l.classe_an === 'consensus').length);
  const lignesPivots = $derived(pivots(lois));
  const loisAvecPivot = $derived(lois.filter((l) => l.pivots.length).length);
  const socleRn = $derived(lois.filter((l) => l.classe_an === 'socle_rn').length);
  const socleGauche = $derived(lois.filter((l) => l.classe_an === 'socle_gauche').length);
  const transpartisan = $derived(lois.filter((l) => l.classe_an === 'transpartisan').length);
  const socleSeul = $derived(lois.filter((l) => l.classe_an === 'socle_seul').length);
  const sansScrutin = $derived(chemins.sans_scrutin.length);
  const nominatives = $derived(chemins.solennel.length + chemins.ordinaire.length);
  const avecAppoint = $derived(socleGauche + socleRn + transpartisan);
  const titres = (ls: { titre_court: string }[]) => enumeration(ls.map((l) => l.titre_court));

  const debut = $derived(toutes[0].date_adoption);
  const fin = $derived(toutes.at(-1)!.date_adoption);
  const perimetre = $derived(
    conventions
      ? `${entier(lois.length)} lois, accords internationaux compris`
      : `${entier(lois.length)} lois, hors ${nConventions} accords internationaux`
  );
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

  <div class="reglage">
    <Interrupteur bind:valeur={conventions}>
      Inclure les {nConventions} accords internationaux
    </Interrupteur>
    <span class="petit secondaire">
      Lois qui autorisent un traité ; presque toutes passent sans vote nominatif.
      <Comment ancre="accords" />
    </span>
  </div>

  <a class="evitement-frise petit" href="#reponses">Passer la frise</a>
  <Frise {lois} {debut} {fin} jalons={data.periodes} />

  <p class="petit secondaire legende-frise">
    Chaque carré est une loi, placée au mois de son adoption définitive, colorée selon la façon dont
    l’Assemblée l’a adoptée. {perimetre}. La <a href="/lois">liste des lois</a> donne les mêmes informations
    sous forme de tableau.
  </p>

  <ul class="reponses colonne" id="reponses">
    <li>
      <span class="nombre">{contournements.length}</span>
      lois sur {lois.length} ont contourné à une étape le vote de l’Assemblée sur le texte&#8239;:
      {budgets} budgets adoptés au 49.3 ({titres(chemins.art_49_3)}) et {chemins.rejet_inverse
        .length} textes rejetés d’emblée par leurs partisans pour aller en commission mixte paritaire
      ({titres(chemins.rejet_inverse)}). Les {votees} autres ont été votées, dont {nominatives} par vote
      nominatif.
    </li>
    <li>
      <span class="nombre">{consensus}</span>
      lois sur {lois.length} sont adoptées sans qu’aucun bloc s’y oppose, au vote décisif (sur un 49.3,
      la motion de censure). {avecAppoint} passent avec le socle commun et l’appoint de la gauche ({socleGauche}),
      du RN ({socleRn}) ou des deux ({transpartisan}). Le socle sans gauche ni RN&#8239;:
      {socleSeul} fois.
    </li>
    <li>
      <span class="nombre">{loisAvecPivot}</span>
      lois sur {lois.length}&#8239;: un groupe extérieur au socle a été décisif. {enumeration(
        lignesPivots.map(
          (p, i) => `${p.groupe}${i === 0 ? ` ${p.lois.length} fois` : ` ${p.lois.length}`}`
        )
      )} (une loi peut en compter plusieurs).
    </li>
  </ul>
</section>

<section id="chemins">
  <h2>Comment les lois passent-elles à l’Assemblée&#8239;?</h2>
  <p class="colonne">
    Une loi est adoptée quand les deux chambres se sont mises d’accord sur le même texte. À
    l’Assemblée, cela passe normalement par un vote, nominatif ou à main levée. Deux procédures
    permettent de s’en passer à une étape&#8239;: le 49.3, et le rejet du texte par ses propres
    partisans.
    <Comment ancre="chemins" />
  </p>

  <ol class="chemins">
    {#each CHEMINS as c (c)}
      <li class="chemin">
        <span class="pastille {c}" class:vide={c === 'sans_scrutin'}></span>
        <span class="tete">
          <strong>{LIBELLE_CHEMIN[c]}</strong>
          <span class="nombre compte-chemin">{chemins[c].length}</span>
        </span>
        <span class="petit secondaire">{DEFINITION_CHEMIN[c]}</span>
      </li>
    {/each}
  </ol>

  <h3 class="sous-titre">Les {contournements.length} lois passées par un contournement</h3>
  <ul class="liste-lois">
    {#each contournements as l (l.id)}
      <li>
        <span class="pastille {l.chemin}"></span>
        <a href="/lois/{l.id}">{l.titre_court}</a>
        <span class="secondaire petit"
          >{LIBELLE_CHEMIN[l.chemin]}, adoptée le {dateLongue(l.date_adoption)}</span
        >
      </li>
    {/each}
  </ul>
  {#if sansScrutin}
    <p class="colonne petit secondaire">
      {sansScrutin} loi{sansScrutin > 1 ? 's ont' : ' a'} été adoptée{sansScrutin > 1 ? 's' : ''}
      sans vote nominatif au dernier passage à l’Assemblée&#8239;: on ne sait pas comment chaque groupe
      a voté. Ce n’est pas un contournement, ni la preuve d’un consensus.
    </p>
  {/if}
</section>

<section id="coalitions">
  <h2>Avec quelles voix&#8239;?</h2>
  <p class="colonne">
    Pour chaque loi, on prend le dernier vote de l’Assemblée sur le texte, et on regarde quels
    groupes étaient dans le camp gagnant. Le {SOCLE_COMMUN} l’emporte presque toujours avec d’autres&#8239;:
    sans gauche ni RN, {socleSeul} fois sur {lois.length}.
    <Comment ancre="coalitions" />
  </p>
  <Coalitions {lois} periodes={data.periodes} />
  <p class="petit secondaire colonne">
    Sur un 49.3, le camp gagnant est celui des groupes qui ne votent pas la censure. « {LIBELLE_CLASSE.socle_rn}
    » veut dire qu’au moins un groupe du bloc RN a voté avec le socle, pas que ses voix étaient nécessaires&#8239;:
    c’est la question suivante.
  </p>
</section>

<section id="pivots">
  <h2>Quels groupes ont été décisifs&#8239;?</h2>
  <p class="colonne">
    Un groupe est décisif quand, sans ses voix, le résultat s’inversait&#8239;: le texte tombait,
    ou, sur un 49.3, la censure passait s’il l’avait votée. Hors du socle commun, c’est arrivé pour
    {loisAvecPivot} lois sur {lois.length}.
    <Comment ancre="decisif" />
  </p>
  {#if lignesPivots.length}
    <Pivots {lois} couleurs={data.couleurs} />
  {/if}
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
      <strong>Les textes rejetés ou abandonnés.</strong> Seules les lois promulguées sont comptées&#8239;:
      un texte retiré faute de majorité n’apparaît pas.
    </li>
    <li>
      <strong>Le vote sans vote nominatif.</strong>
      {sansScrutin} loi{sansScrutin > 1 ? 's' : ''} sur
      {lois.length} n’{sansScrutin > 1 ? 'ont' : 'a'} pas de vote nominatif au dernier passage à l’Assemblée&#8239;:
      on ne sait pas qui a voté quoi.
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
  </ul>
  <p class="colonne">
    <a href="/methodologie">Lire la méthodologie</a> ou
    <a href="/lois">parcourir les {toutes.length} lois</a>.
  </p>
</section>

<style>
  section {
    padding-top: 72px;
    display: grid;
    gap: 20px;
  }
  .ouverture {
    padding-top: 48px;
  }
  h1 {
    max-width: 18ch;
  }
  .chapo {
    font-size: 1.1875rem;
  }
  .reglage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    margin-top: 12px;
  }
  .evitement-frise {
    position: absolute;
    left: -999px;
  }
  .evitement-frise:focus {
    position: static;
  }
  .legende-frise {
    max-width: var(--colonne);
  }
  .reponses {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
    display: grid;
    gap: 14px;
  }
  .reponses li {
    font-size: 1.125rem;
    line-height: 1.45;
  }
  .reponses .nombre {
    font-size: 2.25rem;
    line-height: 1;
    margin-right: 4px;
  }
  .chemins {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
    gap: 24px;
  }
  @media (min-width: 1100px) {
    .chemins {
      grid-template-columns: repeat(5, 1fr);
    }
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
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .compte-chemin {
    font-size: 2rem;
    line-height: 1;
  }
  .pastille {
    width: 14px;
    height: 14px;
    border-radius: 2px;
    display: inline-block;
    flex: none;
  }
  .pastille.solennel {
    background: var(--ch-solennel);
  }
  .pastille.ordinaire {
    background: var(--ch-ordinaire);
  }
  .pastille.rejet_inverse {
    background: var(--ch-rejet_inverse);
  }
  .pastille.art_49_3 {
    background: var(--ch-art_49_3);
  }
  .sous-titre {
    margin-top: 8px;
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
  .limites {
    padding-left: 1.1em;
    display: grid;
    gap: 10px;
  }
</style>
