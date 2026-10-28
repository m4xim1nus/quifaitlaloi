<script lang="ts">
  // Tableau des groupes d'un scrutin : décompte, position majoritaire et sa cohésion
  // (toujours affichée à côté de la position, METHODO §7), groupe décisif.
  import { LIBELLE_POSITION } from '$lib/libelles';
  import { pourcent } from '$lib/format';
  import type { PositionGroupe } from '$lib/types';

  interface Props {
    positions: PositionGroupe[];
    censure?: boolean;
    couleurs?: Record<string, string>;
  }
  let { positions, censure = false, couleurs = {} }: Props = $props();
  const part = (n: number, p: PositionGroupe) => `${(100 * n) / Math.max(p.membres, 1)}%`;
</script>

<div class="defile">
  <table class="chiffres">
    <thead>
      <tr>
        <th scope="col">Groupe</th>
        <th scope="col">Position du groupe</th>
        {#if censure}
          <th scope="col" class="n">Pour la censure</th>
        {:else}
          <th scope="col" class="n">Pour</th>
          <th scope="col" class="n">Contre</th>
          <th scope="col" class="n">Abst.</th>
        {/if}
        <th scope="col" class="n">Membres</th>
        <th scope="col" class="barre-col"><span class="visuellement-cache">Répartition</span></th>
      </tr>
    </thead>
    <tbody>
      {#each positions as p (p.groupe_id)}
        <tr>
          <th scope="row" title={p.nom}>
            <span class="puce" style:background={couleurs[p.sigle] ?? 'transparent'}></span>
            {p.sigle}
          </th>
          <td>
            {LIBELLE_POSITION[p.position]}
            {#if p.cohesion !== null && p.position !== 'absent' && p.position !== 'partage'}
              <span class="secondaire">{`à ${pourcent(p.cohesion)}`}</span>
            {/if}
            {#if p.pivot || p.pivot_abstention}
              <span class="decisif" title="Sans ce groupe, le résultat s’inversait"
                >décisif{p.pivot_abstention && !p.pivot ? ' par son abstention' : ''}</span
              >
            {/if}
          </td>
          {#if censure}
            <td class="n">{p.pour}</td>
          {:else}
            <td class="n">{p.pour}</td>
            <td class="n">{p.contre}</td>
            <td class="n">{p.abstention}</td>
          {/if}
          <td class="n secondaire">{p.membres}</td>
          <td class="barre-col">
            <span class="barre" aria-hidden="true">
              {#if censure}
                <span class="contre" style:width={part(p.pour, p)}></span>
              {:else}
                <span class="pour" style:width={part(p.pour, p)}></span>
                <span class="abstention" style:width={part(p.abstention, p)}></span>
                <span class="contre" style:width={part(p.contre, p)}></span>
              {/if}
            </span>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .defile {
    overflow-x: auto;
  }
  table {
    width: 100%;
    font-size: 0.9375rem;
  }
  th,
  td {
    text-align: left;
    padding: 6px 10px 6px 0;
    border-bottom: 1px solid var(--filet);
    white-space: nowrap;
    font-weight: 400;
  }
  thead th {
    font-size: 0.8125rem;
    color: var(--ardoise);
    font-weight: 700;
  }
  tbody th {
    font-weight: 700;
  }
  .n {
    text-align: right;
  }
  .puce {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-right: 6px;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.15);
  }
  .decisif {
    margin-left: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    border: 1.5px solid var(--encre);
    border-radius: 999px;
    padding: 0 6px;
  }
  .barre-col {
    width: 32%;
    min-width: 120px;
  }
  .barre {
    display: flex;
    height: 10px;
    background: var(--plan);
    border-radius: 2px;
    overflow: hidden;
    gap: 1px;
  }
  .barre .pour {
    background: var(--vo-pour);
  }
  .barre .contre {
    background: var(--vo-contre);
  }
  .barre .abstention {
    background: var(--vo-abstention);
  }
</style>
