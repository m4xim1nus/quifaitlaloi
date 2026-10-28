<script lang="ts">
  // Groupes décisifs hors socle : une ligne par loi, une colonne par groupe. Disque plein :
  // décisif par son vote ; cercle : décisif par son abstention.
  import { dateCourte } from '$lib/format';
  import { LIBELLE_CHEMIN } from '$lib/libelles';
  import type { GroupeAffiche, LoiResume } from '$lib/server/vues';

  interface Props {
    lois: LoiResume[];
    groupes: GroupeAffiche[];
  }
  let { lois, groupes }: Props = $props();

  const lignes = $derived(lois.filter((l) => l.pivots.length || l.pivots_abst_hors_socle.length));
  const colonnes = $derived(
    groupes
      .map((g) => ({
        ...g,
        vote: lignes.filter((l) => l.pivots.includes(g.sigle)).length,
        abst: lignes.filter((l) => l.pivots_abst_hors_socle.includes(g.sigle)).length
      }))
      .filter((g) => g.vote + g.abst > 0)
  );
</script>

{#if lignes.length}
  <div class="defile">
    <table>
      <thead>
        <tr>
          <th scope="col" class="loi">Loi</th>
          {#each colonnes as g (g.sigle)}
            <th scope="col" class="groupe" title={g.nom}>
              <span class="sigle">{g.sigle}</span>
              <span class="nombre total">{g.vote}</span>
              {#if g.abst}<span class="abst petit" title="décisif par son abstention"
                  >+{g.abst}&#8239;<span
                    class="cercle mini"
                    style:border-color={g.couleur ?? 'var(--encre)'}
                  ></span></span
                >{/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each lignes as l (l.id)}
          <tr>
            <th scope="row" class="loi">
              <div class="cellule-loi">
                <span class="pastille ch-{l.chemin}" title={LIBELLE_CHEMIN[l.chemin]}></span>
                <a href="/lois/{l.id}">{l.titre_court}</a>
                <span class="date petit chiffres">{dateCourte(l.date_adoption)}</span>
              </div>
            </th>
            {#each colonnes as g (g.sigle)}
              <td class="groupe">
                {#if l.pivots.includes(g.sigle)}
                  <span
                    class="disque"
                    style:background={g.couleur ?? 'var(--encre)'}
                    title="{g.sigle} : décisif par son vote"
                    ><span class="visuellement-cache">décisif par son vote</span></span
                  >
                {:else if l.pivots_abst_hors_socle.includes(g.sigle)}
                  <span
                    class="cercle"
                    style:border-color={g.couleur ?? 'var(--encre)'}
                    title="{g.sigle} : décisif par son abstention"
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
  <ul class="mobile">
    {#each lignes as l (l.id)}
      <li>
        <span class="pastille ch-{l.chemin}" title={LIBELLE_CHEMIN[l.chemin]}></span>
        <span class="texte">
          <a href="/lois/{l.id}">{l.titre_court}</a>
          <span class="date petit chiffres">{dateCourte(l.date_adoption)}</span>
          <span class="badges petit">
            {#each colonnes.filter((g) => l.pivots.includes(g.sigle) || l.pivots_abst_hors_socle.includes(g.sigle)) as g (g.sigle)}
              <span class="badge">
                {#if l.pivots.includes(g.sigle)}
                  <span class="disque mini" style:background={g.couleur ?? 'var(--encre)'}></span>
                {:else}
                  <span class="cercle mini" style:border-color={g.couleur ?? 'var(--encre)'}></span>
                {/if}
                {g.sigle}{l.pivots.includes(g.sigle) ? '' : ' (abstention)'}
              </span>
            {/each}
          </span>
        </span>
      </li>
    {/each}
  </ul>
  <p class="legende petit secondaire">
    <span class="disque" style:background="var(--encre)"></span> décisif par son vote ·
    <span class="cercle" style:border-color="var(--encre)"></span> décisif par son abstention (s’il avait
    voté contre, le texte tombait)
  </p>
{:else}
  <p class="secondaire">Aucun groupe hors socle n’a été décisif sur cette période.</p>
{/if}

<style>
  table {
    width: 100%;
    font-size: 0.9375rem;
  }
  th,
  td {
    padding: 7px 8px;
    border-bottom: 1px solid var(--filet);
    font-weight: 400;
  }
  thead th {
    border-bottom: 1px solid var(--encre);
    vertical-align: bottom;
  }
  .loi {
    text-align: left;
    padding-left: 0;
  }
  .cellule-loi {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0 8px;
    align-items: baseline;
  }
  .loi .date {
    grid-column: 2;
    color: var(--ardoise);
  }
  .groupe {
    text-align: center;
    width: 3.6rem;
  }
  thead .groupe {
    font-size: 0.8125rem;
  }
  .sigle {
    display: block;
    font-weight: 700;
    white-space: nowrap;
  }
  .total {
    display: block;
    font-size: 1.5rem;
    line-height: 1.1;
    font-weight: 500;
  }
  .disque,
  .cercle {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    vertical-align: middle;
  }
  .disque {
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.2);
  }
  .cercle {
    border: 2.5px solid;
  }
  .abst {
    display: block;
    color: var(--ardoise);
    white-space: nowrap;
  }
  .cercle.mini {
    width: 9px;
    height: 9px;
    border-width: 2px;
    vertical-align: -1px;
  }
  .mobile {
    display: none;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .mobile li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px;
    align-items: baseline;
    padding: 8px 0;
    border-bottom: 1px solid var(--filet);
  }
  .texte {
    display: grid;
    gap: 2px;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 12px;
    font-weight: 700;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .disque.mini {
    width: 11px;
    height: 11px;
  }
  @media (max-width: 640px) {
    .defile {
      display: none;
    }
    .mobile {
      display: block;
    }
  }
  .legende .disque,
  .legende .cercle {
    width: 11px;
    height: 11px;
  }
  .legende .cercle {
    border-width: 2px;
  }
</style>
