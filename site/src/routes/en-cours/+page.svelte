<script lang="ts">
  // Textes en cours : votés au moins une fois sous la XVIIe, pas (encore) des lois. Rangés selon
  // où ils attendent, d'après les dossiers ; aucun agrégat, aucun mélange avec les lois.
  import { afterNavigate } from '$app/navigation';
  import Interrupteur from '$lib/components/Interrupteur.svelte';
  import Comment from '$lib/components/Comment.svelte';
  import { DEFINITION_CLASSE, LIBELLE_CLASSE, LIBELLE_MODE } from '$lib/libelles';
  import { dateCourte, dateLongue, entier } from '$lib/format';
  import {
    chapoEnCours,
    libelleAttente,
    libelleDernierVote,
    libelleSeance,
    natureTexte,
    parSection,
    TITRE_SECTION
  } from '$lib/encours';
  import { lireConventions, ecrireConventions } from '$lib/conventions.svelte';

  let { data } = $props();

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

  const nConventions = $derived(data.textes.filter((t) => t.type === 'convention').length);
  const visibles = $derived(
    conventions ? data.textes : data.textes.filter((t) => t.type !== 'convention')
  );
  const groupes = $derived(parSection(visibles));
</script>

<svelte:head>
  <title>Textes en cours · Qui fait la loi ?</title>
  <meta
    name="description"
    content="Les textes déjà votés par l’Assemblée ou le Sénat depuis juillet 2024, qui ne sont pas encore des lois : dernier vote, coalition, prochaine étape connue."
  />
</svelte:head>

<section class="ouverture">
  <h1>Textes en cours</h1>
  <p class="chapo colonne">
    {chapoEnCours(visibles.length, data.date, dateLongue)}
    <Comment ancre="en-cours" />
  </p>
  <div class="reglage">
    <Interrupteur bind:valeur={conventions}>
      Inclure les {nConventions} accords internationaux
    </Interrupteur>
  </div>
  {#if groupes.length > 1}
    <nav class="sommaire petit" aria-label="Sections">
      {#each groupes as g (g.section)}
        <a href="#{g.section}">{TITRE_SECTION[g.section]} ({entier(g.textes.length)})</a>
      {/each}
    </nav>
  {/if}
</section>

{#each groupes as g (g.section)}
  <section id={g.section} class="groupe">
    <h2>{TITRE_SECTION[g.section]}</h2>
    <div class="defile">
      <table>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Texte</th>
            <th scope="col">Dernier vote</th>
            <th scope="col">Coalition <Comment ancre="coalitions" texte="" /></th>
            <th scope="col">Suite</th>
          </tr>
        </thead>
        <tbody>
          {#each g.textes as t (t.id)}
            <tr>
              <td class="date chiffres">{dateCourte(t.date_derniere_lecture)}</td>
              <td class="titre">
                <a href="/en-cours/{t.id}">{t.titre_court}</a>
                <span class="petit secondaire">{natureTexte(t)}</span>
              </td>
              <td>
                {libelleDernierVote(t)}
                {#if t.mode_final}<span class="petit secondaire bloc"
                    >{LIBELLE_MODE[t.mode_final]}</span
                  >{/if}
              </td>
              <td>
                {#if t.classe}
                  <span title={DEFINITION_CLASSE[t.classe]}
                    ><span class="pastille" style:background="var(--co-{t.classe})"></span>
                    {LIBELLE_CLASSE[t.classe]}{t.chambre_finale === 'SN' ? ', au Sénat' : ''}</span
                  >
                  {#if t.pivots.length}
                    <span class="petit secondaire bloc"
                      >décisif&#8239;:
                      {#each t.pivots as p (p)}<span class="sigle"
                          ><span class="puce" style:background={data.couleurs[p] ?? 'var(--gris)'}
                          ></span>{p}</span
                        >{/each}</span
                    >
                  {/if}
                {:else}<span class="secondaire">—</span>{/if}
              </td>
              <td class="suite">
                {#if g.section === 'seance'}<strong>{libelleSeance(t, dateLongue)}</strong>{/if}
                <span class:petit={g.section === 'seance'} class:secondaire={g.section === 'seance'}
                  >{libelleAttente(t)}</span
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
{/each}

<style>
  section {
    padding-top: 48px;
    display: grid;
    gap: 16px;
  }
  .ouverture {
    gap: 20px;
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
  .sommaire {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 20px;
  }
  .groupe h2 {
    border-bottom: 1px solid var(--encre);
    padding-bottom: 8px;
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
  .bloc {
    display: block;
  }
  .suite {
    display: grid;
    gap: 2px;
    min-width: 12rem;
  }
  .sigle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 6px;
    font-weight: 700;
    color: var(--encre);
  }
  .puce {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.15);
  }
  @media (max-width: 640px) {
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
    .titre,
    .suite {
      min-width: 0;
    }
  }
</style>
