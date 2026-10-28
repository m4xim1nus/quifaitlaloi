<script lang="ts">
  // Petits multiples des trois législatures (docs/CONCEPTION.md §13) : mêmes règles, même
  // échelle (un carré = une loi), une colonne par législature.
  import { afterNavigate } from '$app/navigation';
  import Gaufre from '$lib/components/Gaufre.svelte';
  import Interrupteur from '$lib/components/Interrupteur.svelte';
  import ChoixLegislature from '$lib/components/ChoixLegislature.svelte';
  import Comment from '$lib/components/Comment.svelte';
  import { filtrer, pivots } from '$lib/agregats';
  import { CLASSES, LIBELLE_CHEMIN, LIBELLE_CLASSE, type Chemin } from '$lib/libelles';
  import { LEGISLATURES } from '$lib/legislatures';
  import { entier, pourcent } from '$lib/format';
  import { lireConventions, ecrireConventions } from '$lib/conventions.svelte';
  import type { Classe } from '$lib/types';

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

  type LoiC = (typeof data.legislatures)[number]['lois'][number];

  const ORDRE_CHEMINS: Chemin[] = ['art_49_3', 'rejet_inverse', 'nominatif', 'sans_scrutin'];
  type Ligne = Classe | 'aucune';
  const ORDRE_COALITIONS: Ligne[] = [...CLASSES, 'aucune'];
  type Poids = 'vote' | 'abstention' | 'aucun' | 'inconnu';
  const ORDRE_POIDS: Poids[] = ['vote', 'abstention', 'aucun', 'inconnu'];
  const LIBELLE_POIDS: Record<Poids, string> = {
    vote: 'Un groupe hors socle décisif par son vote',
    abstention: 'Décisif par son abstention seulement',
    aucun: 'Aucun groupe hors socle décisif',
    inconnu: 'Sans vote nominatif'
  };
  const COULEUR_POIDS: Record<Poids, string> = {
    vote: 'var(--encre)',
    abstention: 'var(--encre)',
    aucun: 'var(--co-consensus)',
    inconnu: 'var(--ardoise)'
  };
  const CREUX: Poids[] = ['abstention', 'inconnu'];
  const poids = (l: LoiC): Poids =>
    l.pivots.length
      ? 'vote'
      : l.pivots_abst_hors_socle.length
        ? 'abstention'
        : l.classe_an
          ? 'aucun'
          : 'inconnu';
  const ligneDe = (l: LoiC): Ligne => l.classe_an ?? 'aucune';
  const libelleCoalition = (k: Ligne) =>
    k === 'aucune' ? 'Sans vote nominatif' : LIBELLE_CLASSE[k];

  /** Durée couverte, en années (la XVIIe court jusqu'à la date des données). */
  const annees = (debut: string, fin: string) =>
    (Date.parse(fin) - Date.parse(debut)) / (365.25 * 24 * 3600 * 1000);

  const cols = $derived(
    data.legislatures.map((d) => {
      const leg = LEGISLATURES.find((l) => l.num === d.num)!;
      const lois = filtrer(d.lois, conventions);
      const n = lois.length;
      const trier = <K extends string>(ordre: K[], cle: (l: LoiC) => K) =>
        [...lois].sort(
          (a, b) =>
            ordre.indexOf(cle(a)) - ordre.indexOf(cle(b)) ||
            a.date_adoption.localeCompare(b.date_adoption)
        );
      const compter = <K extends string>(ordre: K[], cle: (l: LoiC) => K) =>
        ordre.map((k) => ({ k, n: lois.filter((l) => cle(l) === k).length }));
      return {
        leg,
        couleurs: d.couleurs,
        n,
        parAn: n / annees(leg.debut, leg.fin ?? data.dateDonnees),
        chemins: trier(ORDRE_CHEMINS, (l) => l.chemin),
        comptesChemins: compter(ORDRE_CHEMINS, (l) => l.chemin),
        solennels: lois.filter((l) => l.chemin === 'nominatif' && l.solennel).length,
        coalitions: trier(ORDRE_COALITIONS, ligneDe),
        comptesCoalitions: compter(ORDRE_COALITIONS, ligneDe),
        poids: trier(ORDRE_POIDS, poids),
        comptesPoids: compter(ORDRE_POIDS, poids),
        groupes: pivots(lois)
      };
    })
  );
  const part = (k: number, n: number) => (n ? pourcent(k / n) : '–');
  const contourne = (c: (typeof cols)[number]) =>
    c.comptesChemins.filter((x) => x.k === 'art_49_3' || x.k === 'rejet_inverse');
  const nContourne = (c: (typeof cols)[number]) => contourne(c).reduce((s, x) => s + x.n, 0);
  const nDecisif = (c: (typeof cols)[number]) => c.comptesPoids.find((x) => x.k === 'vote')!.n;
  const nSansVote = (c: (typeof cols)[number]) =>
    c.comptesChemins.find((x) => x.k === 'sans_scrutin')!.n;
</script>

<svelte:head>
  <title>Comparer les législatures · Qui fait la loi ?</title>
  <meta
    name="description"
    content="Les lois des XVe, XVIe et XVIIe législatures comparées avec les mêmes règles : chemin d’adoption à l’Assemblée, coalitions, groupes décisifs."
  />
</svelte:head>

<section class="ouverture">
  <h1>Trois Assemblées, une même grille</h1>
  <p class="chapo colonne">
    Les lois adoptées depuis 2017, lues avec les mêmes règles sous les trois dernières législatures.
    Chaque carré est une loi, à la même échelle d’une colonne à l’autre.
  </p>
  <ChoixLegislature courant="comparer" />
  <div class="reglage">
    <Interrupteur bind:valeur={conventions}>Inclure les accords internationaux</Interrupteur>
    <span class="petit secondaire"><Comment ancre="accords" /></span>
  </div>
</section>

<section aria-labelledby="t-rythme">
  <h2 id="t-rythme">Combien de lois&#8239;?</h2>
  <div class="trois">
    {#each cols as c (c.leg.num)}
      <div class="col">
        <h3><a href={c.leg.url}>{c.leg.romain}</a> <span class="annees">{c.leg.annees}</span></h3>
        <p class="petit secondaire">{c.leg.majorite}</p>
        <p><span class="nombre">{entier(c.n)}</span> lois</p>
        <p class="petit">soit {Math.round(c.parAn)} par an</p>
      </div>
    {/each}
  </div>
</section>

<section aria-labelledby="t-chemins">
  <h2 id="t-chemins">Par quel chemin&#8239;?</h2>
  <p class="reponse colonne">
    Le vote de l’Assemblée contourné (49.3 ou rejet par ses partisans)&#8239;: {#each cols as c, i (c.leg.num)}{i
        ? i === cols.length - 1
          ? ' et '
          : ', '
        : ''}<strong>{nContourne(c)}</strong> sous la {c.leg.romain}{/each}. Sans vote
    nominatif&#8239;:
    {#each cols as c, i (c.leg.num)}{i ? ', ' : ''}{part(nSansVote(c), c.n)}{/each}.
    <Comment ancre="chemins" />
  </p>
  <div class="trois">
    {#each cols as c (c.leg.num)}
      <div class="col">
        <h3>{c.leg.romain} <span class="annees">{c.leg.annees}</span></h3>
        <Gaufre
          items={c.chemins.map((l) => ({
            id: l.id,
            titre: `${l.titre_court} · ${LIBELLE_CHEMIN[l.chemin]}`,
            couleur: l.chemin === 'sans_scrutin' ? 'var(--ardoise)' : `var(--ch-${l.chemin})`,
            creux: l.chemin === 'sans_scrutin'
          }))}
        />
        <table class="comptes petit">
          <caption class="visuellement-cache">Chemins, {c.leg.romain} législature</caption>
          <tbody>
            {#each c.comptesChemins as x (x.k)}
              <tr>
                <th scope="row"><span class="pastille ch-{x.k}"></span>{LIBELLE_CHEMIN[x.k]}</th>
                <td class="chiffres">{x.n}</td>
                <td class="chiffres secondaire">{part(x.n, c.n)}</td>
              </tr>
            {/each}
            <tr class="dont">
              <th scope="row">dont votes solennels</th>
              <td class="chiffres">{c.solennels}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    {/each}
  </div>
</section>

<section aria-labelledby="t-coalitions">
  <h2 id="t-coalitions">Avec quelles voix&#8239;?</h2>
  <p class="colonne petit secondaire">
    Le socle n’est pas le même d’une législature à l’autre&#8239;: {#each cols as c, i (c.leg.num)}{i
        ? ' ; '
        : ''}{c.leg.socleDeveloppe} sous la {c.leg.romain}{/each}.
    <Comment ancre="coalitions" />
  </p>
  <div class="trois">
    {#each cols as c (c.leg.num)}
      <div class="col">
        <h3>{c.leg.romain} <span class="annees">{c.leg.annees}</span></h3>
        <Gaufre
          items={c.coalitions.map((l) => ({
            id: l.id,
            titre: `${l.titre_court} · ${libelleCoalition(ligneDe(l))}`,
            couleur: l.classe_an ? `var(--co-${l.classe_an})` : 'var(--ardoise)',
            creux: !l.classe_an
          }))}
        />
        <table class="comptes petit">
          <caption class="visuellement-cache">Coalitions, {c.leg.romain} législature</caption>
          <tbody>
            {#each c.comptesCoalitions.filter((x) => x.n > 0) as x (x.k)}
              <tr>
                <th scope="row"
                  ><span
                    class="pastille"
                    class:vide={x.k === 'aucune'}
                    style:background={x.k === 'aucune' ? undefined : `var(--co-${x.k})`}
                  ></span>{libelleCoalition(x.k)}</th
                >
                <td class="chiffres">{x.n}</td>
                <td class="chiffres secondaire">{part(x.n, c.n)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/each}
  </div>
</section>

<section aria-labelledby="t-decisifs">
  <h2 id="t-decisifs">Quels groupes ont été décisifs&#8239;?</h2>
  <p class="reponse colonne">
    Lois où un groupe extérieur au socle a fait la différence par son vote&#8239;: {#each cols as c, i (c.leg.num)}{i
        ? i === cols.length - 1
          ? ' et '
          : ', '
        : ''}<strong>{nDecisif(c)}</strong> sous la {c.leg.romain}{/each}.
    <Comment ancre="decisif" />
  </p>
  <div class="trois">
    {#each cols as c (c.leg.num)}
      <div class="col">
        <h3>{c.leg.romain} <span class="annees">{c.leg.annees}</span></h3>
        <Gaufre
          items={c.poids.map((l) => ({
            id: l.id,
            titre: `${l.titre_court} · ${LIBELLE_POIDS[poids(l)]}${l.pivots.length ? ` (${l.pivots.join(', ')})` : ''}`,
            couleur: COULEUR_POIDS[poids(l)],
            creux: CREUX.includes(poids(l))
          }))}
        />
        <table class="comptes petit">
          <caption class="visuellement-cache">Groupes décisifs, {c.leg.romain} législature</caption>
          <tbody>
            {#each c.comptesPoids.filter((x) => x.n > 0) as x (x.k)}
              <tr>
                <th scope="row"
                  ><span
                    class="pastille"
                    style:background={CREUX.includes(x.k) ? 'var(--papier)' : COULEUR_POIDS[x.k]}
                    style:box-shadow={CREUX.includes(x.k)
                      ? `inset 0 0 0 1.5px ${COULEUR_POIDS[x.k]}`
                      : undefined}
                  ></span>{LIBELLE_POIDS[x.k]}</th
                >
                <td class="chiffres">{x.n}</td>
                <td class="chiffres secondaire">{part(x.n, c.n)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        {#if c.groupes.length}
          <ul class="groupes petit">
            {#each c.groupes as g (g.groupe)}
              <li>
                <span class="puce" style:background={c.couleurs[g.groupe] ?? 'var(--gris)'}></span>
                <a href="/lois?legislature={c.leg.num}&decisif={encodeURIComponent(g.groupe)}"
                  >{g.groupe}</a
                >
                <span class="chiffres">{g.lois.length}</span>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="petit secondaire">Aucun groupe hors socle décisif.</p>
        {/if}
      </div>
    {/each}
  </div>
</section>

<section aria-labelledby="t-limites">
  <h2 id="t-limites">Ce que la comparaison ne dit pas</h2>
  <ul class="limites colonne">
    <li>
      <strong>Le socle change de forme.</strong> Majorité présidentielle seule sous les XVe et XVIe, socle
      commun du centre et de la droite sous la XVIIe&#8239;: un même libellé de coalition ne recouvre
      pas les mêmes groupes.
    </li>
    <li>
      <strong>Les durées diffèrent.</strong> Cinq ans pour la XVe, deux pour la XVIe, une législature
      en cours pour la XVIIe&#8239;: on compare des parts, pas des totaux.
    </li>
    <li>
      <strong>Pas de groupe RN sous la XVe.</strong> Ses députés siégeaient parmi les non-inscrits.
    </li>
    <li>
      <strong>Le vote nominatif dépend des demandes.</strong> Un scrutin public n’a lieu que s’il est
      demandé&#8239;: une Assemblée où la majorité est assurée en demande moins.
    </li>
  </ul>
  <p class="colonne"><a href="/methodologie">Lire la méthodologie</a></p>
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
  .reponse {
    font-size: 1.125rem;
    line-height: 1.5;
  }
  .trois {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 32px 28px;
    align-items: start;
  }
  .col {
    display: grid;
    gap: 10px;
    align-content: start;
    border-top: 3px solid var(--filet);
    padding-top: 10px;
  }
  .col p {
    margin: 0;
  }
  h3 {
    margin: 0;
    font-size: 1.25rem;
  }
  .annees {
    font-family: var(--sans, inherit);
    font-size: 0.875rem;
    font-weight: 400;
    color: var(--ardoise);
  }
  .nombre {
    font-size: 2.25rem;
    line-height: 1;
  }
  .comptes {
    width: 100%;
    border-collapse: collapse;
  }
  .comptes th {
    text-align: left;
    font-weight: 400;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
  }
  .comptes td {
    text-align: right;
    padding: 2px 0 2px 10px;
    white-space: nowrap;
  }
  .comptes .dont th {
    padding-left: 18px;
    color: var(--ardoise);
  }
  .groupes {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
  }
  .groupes li {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .puce {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }
  .limites {
    padding-left: 1.1em;
    display: grid;
    gap: 10px;
  }
</style>
