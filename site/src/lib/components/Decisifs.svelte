<script lang="ts">
  // Groupes décisifs hors socle (docs/CONCEPTION.md §11) : une rangée par groupe, de la gauche à
  // la droite, un carré par loi (plein : décisif par son vote ; contour : par son abstention).
  // Les lois s'affichent en dépliant la rangée ; le tableau lois × groupes reste disponible.
  import Themes from './Themes.svelte';
  import { dateCourte } from '$lib/format';
  import { LIBELLE_CHEMIN } from '$lib/libelles';
  import type { GroupeAffiche, LoiResume } from '$lib/server/vues';

  interface Props {
    lois: LoiResume[];
    groupes: GroupeAffiche[];
  }
  let { lois, groupes }: Props = $props();

  const lignes = $derived(lois.filter((l) => l.pivots.length || l.pivots_abst_hors_socle.length));
  const estVote = (l: LoiResume, g: string) => l.pivots.includes(g);
  const estAbst = (l: LoiResume, g: string) =>
    !estVote(l, g) && l.pivots_abst_hors_socle.includes(g);
  // Groupes de la XVIIe, puis ceux d'une lecture tenue sous la XVIe (LR, par exemple), en gris.
  const tous = $derived.by((): GroupeAffiche[] => {
    const connus = new Set(groupes.map((g) => g.sigle));
    const autres = [
      ...new Set(lignes.flatMap((l) => [...l.pivots, ...l.pivots_abst_hors_socle]))
    ].filter((s) => !connus.has(s));
    return [
      ...groupes,
      ...autres.map((sigle) => ({
        sigle,
        nom: `${sigle} (XVIe législature)`,
        bloc: 'autres' as const,
        couleur: null
      }))
    ];
  });
  const colonnes = $derived(
    tous
      .map((g) => {
        const ls = lignes
          .filter((l) => estVote(l, g.sigle) || estAbst(l, g.sigle))
          .sort(
            (a, b) =>
              Number(estAbst(a, g.sigle)) - Number(estAbst(b, g.sigle)) ||
              b.date_adoption.localeCompare(a.date_adoption)
          );
        return {
          ...g,
          lois: ls,
          vote: ls.filter((l) => estVote(l, g.sigle)).length,
          abst: ls.filter((l) => estAbst(l, g.sigle)).length
        };
      })
      .filter((g) => g.lois.length > 0)
  );
  const couleurDe = $derived(
    Object.fromEntries(groupes.map((g) => [g.sigle, g.couleur ?? 'var(--encre)']))
  );
  /** Les autres groupes décisifs sur la même loi. */
  const avec = (l: LoiResume, sigle: string) =>
    [...l.pivots, ...l.pivots_abst_hors_socle.filter((g) => !l.pivots.includes(g))].filter(
      (g) => g !== sigle
    );

  let ouverts = $state<Record<string, boolean>>({});
</script>

{#if lignes.length}
  <ul class="groupes">
    {#each colonnes as g (g.sigle)}
      {@const ouvert = !!ouverts[g.sigle]}
      <li>
        <button
          type="button"
          class="rangee"
          aria-expanded={ouvert}
          aria-controls="decisif-{g.sigle}"
          aria-label="{g.sigle} ({g.nom}) : décisif pour {g.vote} loi{g.vote > 1 ? 's' : ''}{g.abst
            ? `, et ${g.abst} par son abstention`
            : ''}"
          onclick={() => (ouverts = { ...ouverts, [g.sigle]: !ouvert })}
        >
          <span class="chevron" aria-hidden="true">{ouvert ? '▾' : '▸'}</span>
          <span class="puce" style:background={g.couleur ?? 'var(--gris)'}></span>
          <span class="sigle">{g.sigle}</span>
        </button>
        <span class="carres" aria-hidden="true">
          {#each g.lois as l (l.id)}
            <a
              href="/lois/{l.id}"
              tabindex="-1"
              class="carre"
              class:abst={estAbst(l, g.sigle)}
              style:--c={g.couleur ?? 'var(--gris)'}
              title="{l.titre_court} · {dateCourte(l.date_adoption).slice(3)}{estAbst(l, g.sigle)
                ? ' · par son abstention'
                : ''}"
            ></a>
          {/each}
        </span>
        <span class="effectif">
          <span class="nombre">{g.vote}</span>
          {#if g.abst}<span class="petit secondaire">+{g.abst} abst.</span>{/if}
        </span>

        {#if ouvert}
          <ul class="lois" id="decisif-{g.sigle}">
            {#each g.lois as l (l.id)}
              <li>
                <span class="marque" aria-hidden="true">
                  {#if estAbst(l, g.sigle)}
                    <span class="cercle" style:border-color={g.couleur ?? 'var(--encre)'}></span>
                  {:else}
                    <span class="disque" style:background={g.couleur ?? 'var(--encre)'}></span>
                  {/if}
                </span>
                <span class="texte">
                  <a class="borne" href="/lois/{l.id}" title={l.titre_court}>{l.titre_court}</a>
                  <span class="meta petit">
                    <span class="chiffres">{dateCourte(l.date_adoption).slice(3)}</span>
                    <span
                      ><span class="pastille ch-{l.chemin}"></span> {LIBELLE_CHEMIN[l.chemin]}</span
                    >
                    {#if estAbst(l, g.sigle)}<span>par son abstention</span>{/if}
                    {#if avec(l, g.sigle).length}
                      <span class="avec"
                        >avec
                        {#each avec(l, g.sigle) as a (a)}<span class="co"
                            ><span class="disque mini" style:background={couleurDe[a]}
                            ></span>{a}</span
                          >{/each}</span
                      >
                    {/if}
                    <Themes themes={l.themes} />
                  </span>
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
  <p class="legende petit secondaire">
    Carré plein&#8239;: décisif par son vote. Carré vide&#8239;: décisif par son abstention (s’il
    avait voté contre, le texte tombait). Une loi peut avoir plusieurs groupes décisifs. Cliquer un
    groupe pour voir ses lois.
  </p>

  <details class="tableau">
    <summary>Voir les {lignes.length} lois dans un tableau croisé</summary>
    <div class="defile">
      <table>
        <thead>
          <tr>
            <th scope="col" class="loi">Loi</th>
            {#each colonnes as g (g.sigle)}
              <th scope="col" class="col" title={g.nom}>{g.sigle}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each lignes as l (l.id)}
            <tr>
              <th scope="row" class="loi">
                <a href="/lois/{l.id}">{l.titre_court}</a>
                <span class="petit secondaire chiffres">{dateCourte(l.date_adoption)}</span>
              </th>
              {#each colonnes as g (g.sigle)}
                <td class="col">
                  {#if estVote(l, g.sigle)}
                    <span class="disque" style:background={g.couleur ?? 'var(--encre)'}
                      ><span class="visuellement-cache">décisif par son vote</span></span
                    >
                  {:else if estAbst(l, g.sigle)}
                    <span class="cercle" style:border-color={g.couleur ?? 'var(--encre)'}
                      ><span class="visuellement-cache">décisif par son abstention</span></span
                    >
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </details>
{:else}
  <p class="secondaire">Aucun groupe hors socle n’a été décisif sur cette période.</p>
{/if}

<style>
  .groupes {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .groupes > li {
    display: grid;
    grid-template-columns: 8rem 1fr 5.5rem;
    gap: 4px 12px;
    align-items: center;
    padding: 6px 0;
    border-top: 1px solid var(--filet);
  }
  .rangee {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    padding: 4px 0;
    cursor: pointer;
    font-weight: 700;
    text-align: left;
  }
  .rangee:hover .sigle {
    text-decoration: underline;
  }
  .chevron {
    color: var(--ardoise);
    width: 1rem;
  }
  .puce {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.15);
    flex: none;
  }
  .carres {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }
  .carre {
    width: 14px;
    height: 14px;
    border-radius: 2px;
    background: var(--c);
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.12);
  }
  .carre.abst {
    background: var(--papier);
    box-shadow: inset 0 0 0 2px var(--c);
  }
  .carre:hover {
    outline: 2px solid var(--encre);
    outline-offset: 1px;
  }
  .effectif {
    text-align: right;
    display: grid;
    line-height: 1.1;
  }
  .effectif .nombre {
    font-size: 1.5rem;
  }
  .lois {
    grid-column: 1 / -1;
    list-style: none;
    padding: 4px 0 10px 1.6rem;
    margin: 0;
    display: grid;
    gap: 8px;
    max-width: 52rem;
  }
  .lois li {
    display: grid;
    grid-template-columns: 1.2rem 1fr;
    align-items: baseline;
  }
  .texte {
    display: grid;
    gap: 2px;
  }
  .texte a {
    text-decoration: none;
  }
  .texte a:hover {
    text-decoration: underline;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 12px;
    color: var(--ardoise);
  }
  .avec {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .co {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-weight: 700;
    color: var(--encre);
  }
  .disque,
  .cercle {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    vertical-align: middle;
  }
  .disque {
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.2);
  }
  .cercle {
    border: 2px solid;
  }
  .disque.mini {
    width: 9px;
    height: 9px;
  }
  .legende {
    margin-top: 8px;
    max-width: var(--colonne);
  }
  .tableau summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--lien);
    margin-top: 8px;
  }
  table {
    width: 100%;
    font-size: 0.9375rem;
    margin-top: 12px;
  }
  th,
  td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--filet);
    font-weight: 400;
  }
  thead th {
    border-bottom: 1px solid var(--encre);
    font-size: 0.8125rem;
    font-weight: 700;
  }
  .loi {
    text-align: left;
    padding-left: 0;
  }
  tbody .loi a {
    margin-right: 8px;
  }
  .col {
    text-align: center;
    width: 3.4rem;
  }
  @media (max-width: 640px) {
    .groupes > li {
      grid-template-columns: 1fr auto;
    }
    .carres {
      grid-column: 1 / -1;
      grid-row: 2;
    }
    .effectif {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .lois {
      padding-left: 0;
    }
  }
  .borne {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
  }
</style>
