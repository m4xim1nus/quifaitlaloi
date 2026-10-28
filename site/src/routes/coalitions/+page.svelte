<script lang="ts">
  // Coalitions dans le temps (cycle Coalitions, docs/CONCEPTION.md) : la chronologie des
  // coalitions et celle des groupes décisifs, sur un même axe des trimestres, de 2017 à
  // aujourd'hui. Puis les comptes par période charnière.
  import { afterNavigate } from '$app/navigation';
  import ChronoCoalitions from '$lib/components/ChronoCoalitions.svelte';
  import ChronoDecisifs from '$lib/components/ChronoDecisifs.svelte';
  import Interrupteur from '$lib/components/Interrupteur.svelte';
  import Comment from '$lib/components/Comment.svelte';
  import { filtrer } from '$lib/agregats';
  import { PILE, parPeriode, rangeesDecisives, trimestresEntre } from '$lib/coalitions';
  import { LIBELLE_CLASSE, NOM_PERIODE } from '$lib/libelles';
  import { entier, pourcent } from '$lib/format';
  import { lireConventions, ecrireConventions } from '$lib/conventions.svelte';

  let { data } = $props();

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

  /** Dates charnières tracées sur les deux graphiques (pipeline/referentiels/periodes.yaml). */
  const NOM_JALON: Record<string, string> = {
    xvi: 'Majorité relative',
    avant_censure: 'Nouvelle Assemblée, LR dans le socle',
    apres_censure: 'Censure Barnier',
    accords_ps: 'Suspension des retraites annoncée'
  };
  const jalons = $derived(
    data.periodes
      .filter((p) => NOM_JALON[p.code])
      .map((p) => ({ code: p.code, date: p.debut, nom: NOM_JALON[p.code] }))
  );
  const debutXVI = $derived(data.periodes.find((p) => p.code === 'xvi')!.debut);
  const debutXVII = $derived(data.periodes.find((p) => p.code === 'avant_censure')!.debut);

  const lois = $derived(filtrer(data.lois, conventions));
  const debut = $derived(data.lois[0].date_adoption);
  const fin = $derived(data.lois.at(-1)!.date_adoption);

  const NOM: Record<string, string> = {
    xv: 'XVe, 2017-2022',
    xvi: 'XVIe, 2022-2024',
    ...NOM_PERIODE
  };
  const periodes = $derived(parPeriode(lois, data.periodes));
  const libelle = (k: (typeof PILE)[number]) =>
    k === 'aucune' ? 'Sans vote nominatif' : LIBELLE_CLASSE[k];
  const lignesCoalitions = $derived(PILE.filter((k) => periodes.some((p) => p.piles[k] > 0)));
  // Groupes décisifs au moins une fois, de la gauche vers la droite.
  const decisifs = $derived(
    rangeesDecisives(
      lois,
      data.groupes.map((g) => g.sigle),
      trimestresEntre(debut, fin)
    ).map((r) => r.sigle)
  );
  /** « x sur n », avec la part quand le dénominateur le permet (au moins 20 lois). */
  const sur = (x: number, n: number) =>
    n === 0
      ? '–'
      : `${entier(x)} sur ${entier(n)}${x > 0 && n >= 20 ? ` (${pourcent(x / n)})` : ''}`;
  const groupes = $derived(
    data.groupes.map((g) => ({ ...g, couleur: data.couleurs[g.sigle] ?? null }))
  );
</script>

<svelte:head>
  <title>Les coalitions dans le temps · Qui fait la loi ?</title>
  <meta
    name="description"
    content="Avec quelles voix le socle gouvernemental l’emporte, et quels groupes ont été décisifs, trimestre après trimestre, de 2017 à aujourd’hui."
  />
</svelte:head>

<section class="ouverture">
  <h1>Les coalitions dans le temps</h1>
  <p class="chapo colonne">
    Jusqu’en 2022, la majorité présidentielle gagnait seule la moitié des votes disputés. Depuis, le
    socle ne l’emporte presque plus sans d’autres voix, et ce renfort change d’un texte à l’autre
    plutôt que d’une période à l’autre.
  </p>
  <div class="reglage">
    <Interrupteur bind:valeur={conventions}>Inclure les accords internationaux</Interrupteur>
    <span class="petit secondaire"><Comment ancre="accords" /></span>
  </div>
</section>

<section aria-labelledby="t-coalitions">
  <h2 id="t-coalitions">Avec qui le socle l’emporte-t-il, d’un trimestre à l’autre&#8239;?</h2>
  <p class="message colonne">
    Les votes disputés que la majorité gagnait seule deviennent rares dès 2022. Depuis, le RN est le
    plus souvent dans le camp gagnant, souvent aux côtés de la gauche, et les dates charnières
    suivantes ne déplacent pas nettement cet équilibre. <Comment ancre="coalitions" />
  </p>
  <ChronoCoalitions {lois} {debut} {fin} {jalons} />
  <p class="petit secondaire colonne">
    Un carré = une loi, au trimestre de son adoption définitive&#8239;; un point blanc signale un
    vote décisif tenu sous la législature précédente. Sur un 49.3, le camp gagnant réunit les
    groupes qui ne votent pas la censure, ce qui ne veut pas dire qu’ils soutiennent le texte. Sous
    la XVe, il n’y a pas de groupe RN&#8239;: ses députés siégeaient parmi les non-inscrits.
  </p>
</section>

<section aria-labelledby="t-decisifs">
  <h2 id="t-decisifs">Quels groupes ont été décisifs, et quand&#8239;?</h2>
  <p class="message colonne">
    Hors du socle, aucun groupe n’a tenu l’issue d’un vote sous la XVe, et presque aucun sous la
    XVIe. Depuis la censure de décembre 2024, un groupe extérieur est décisif sur près d’une loi sur
    trois&#8239;: le RN le plus souvent, les socialistes sur d’autres textes. L’annonce de la
    suspension des retraites n’y change rien. <Comment ancre="decisif" />
  </p>
  <ChronoDecisifs
    {lois}
    {groupes}
    {debut}
    {fin}
    {jalons}
    vide={{ fin: debutXVI, texte: 'XVe : aucun groupe hors de la majorité décisif' }}
    socle={[{ sigle: 'LR', depuis: debutXVII, texte: 'DR, dans le socle' }]}
  />
  <p class="petit secondaire colonne">
    Carré plein&#8239;: le groupe, en votant à l’inverse, faisait tomber le texte. Contour&#8239;:
    décisif par son abstention. Contour pointillé&#8239;: sur un 49.3, la censure passait si tout le
    groupe l’avait votée.
  </p>
</section>

<section aria-labelledby="t-periodes">
  <h2 id="t-periodes">D’une période à l’autre</h2>
  <div class="defile">
    <table class="periodes">
      <caption class="visuellement-cache"
        >Coalitions au vote décisif de l’Assemblée, par période d’adoption définitive</caption
      >
      <thead>
        <tr>
          <th scope="col">Coalition</th>
          {#each periodes as p (p.code)}<th scope="col">{NOM[p.code] ?? p.code}</th>{/each}
        </tr>
      </thead>
      <tbody>
        {#each lignesCoalitions as k (k)}
          <tr>
            <th scope="row"
              ><span
                class="pastille"
                class:vide={k === 'aucune'}
                style:background={k === 'aucune' ? undefined : `var(--co-${k})`}
              ></span>{libelle(k)}</th
            >
            {#each periodes as p (p.code)}<td class="chiffres">{p.piles[k]}</td>{/each}
          </tr>
        {/each}
        <tr class="total">
          <th scope="row">Lois</th>
          {#each periodes as p (p.code)}<td class="chiffres">{p.lois}</td>{/each}
        </tr>
        <tr>
          <th scope="row">dont textes disputés</th>
          {#each periodes as p (p.code)}<td class="chiffres">{p.disputees}</td>{/each}
        </tr>
      </tbody>
    </table>
  </div>

  <div class="defile">
    <table class="periodes">
      <caption class="visuellement-cache"
        >Groupes hors socle décisifs par leur vote, sur les lois votées nominativement, par période</caption
      >
      <thead>
        <tr>
          <th scope="col">Groupe décisif par son vote</th>
          {#each periodes as p (p.code)}<th scope="col">{NOM[p.code] ?? p.code}</th>{/each}
        </tr>
      </thead>
      <tbody>
        <tr class="total">
          <th scope="row">Au moins un groupe hors socle</th>
          {#each periodes as p (p.code)}<td class="chiffres">{sur(p.avecDecisif, p.votees)}</td
            >{/each}
        </tr>
        {#each decisifs as g (g)}
          <tr>
            <th scope="row"
              ><span class="puce" style:background={data.couleurs[g] ?? 'var(--gris)'}
              ></span>{g}</th
            >
            {#each periodes as p (p.code)}<td class="chiffres"
                >{sur(p.decisifs[g] ?? 0, p.votees)}</td
              >{/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="petit secondaire colonne">
    Sur les lois votées nominativement à l’Assemblée. La Droite républicaine, dans le socle commun
    depuis 2024, n’y est pas un groupe extérieur.
    <Comment ancre="chronologie" />
  </p>
</section>

<style>
  section {
    padding-top: 56px;
    display: grid;
    gap: 20px;
  }
  .ouverture {
    padding-top: 48px;
  }
  .chapo {
    font-size: 1.1875rem;
  }
  .reglage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
  }
  .message {
    font-family: var(--serif);
    font-size: 1.375rem;
    line-height: 1.4;
  }
  .defile {
    overflow-x: auto;
  }
  .periodes {
    border-collapse: collapse;
    font-size: 0.9375rem;
    min-width: 40rem;
  }
  .periodes th,
  .periodes td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--filet);
    text-align: right;
    font-weight: 400;
    white-space: nowrap;
  }
  .periodes thead th {
    border-bottom: 1px solid var(--encre);
    font-size: 0.8125rem;
    color: var(--ardoise);
    vertical-align: bottom;
    white-space: normal;
  }
  .periodes th[scope='row'],
  .periodes thead th:first-child {
    text-align: left;
  }
  .periodes th[scope='row'] {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .total th,
  .total td {
    font-weight: 700;
  }
  .puce {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }
</style>
