<script lang="ts">
  // Passer d'une législature à l'autre, ou à la comparaison (cycle Baselines).
  import { LEGISLATURES } from '$lib/legislatures';

  interface Props {
    /** Numéro de la législature affichée, ou « comparer ». */
    courant: number | 'comparer';
  }
  let { courant }: Props = $props();
</script>

<nav class="choix" aria-label="Législatures">
  {#each LEGISLATURES as l (l.num)}
    <a href={l.url} aria-current={courant === l.num ? 'page' : undefined}
      >{l.romain}<span class="annees">{l.annees}</span></a
    >
  {/each}
  <a href="/comparer" class="comparer" aria-current={courant === 'comparer' ? 'page' : undefined}
    >Comparer</a
  >
</nav>

<style>
  .choix {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  a {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 5px 12px;
    border: 1px solid var(--filet);
    border-radius: 999px;
    color: var(--encre);
    text-decoration: none;
    font-size: 0.9375rem;
  }
  a:hover {
    border-color: var(--encre);
  }
  a[aria-current='page'] {
    background: var(--encre);
    border-color: var(--encre);
    color: var(--papier);
  }
  .annees {
    font-size: 0.8125rem;
    opacity: 0.75;
  }
  .comparer {
    font-weight: 600;
  }
</style>
