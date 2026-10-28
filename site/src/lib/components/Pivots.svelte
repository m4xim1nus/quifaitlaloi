<script lang="ts">
  // Pivots hors socle : une ligne par groupe, un carré par loi où il a fait la différence.
  import Carre from './Carre.svelte';
  import { pivots } from '$lib/agregats';
  import type { LoiResume } from '$lib/server/vues';

  interface Props {
    lois: LoiResume[];
    couleurs: Record<string, string>;
  }
  let { lois, couleurs }: Props = $props();
  const lignes = $derived(pivots(lois));
</script>

<ul class="pivots">
  {#each lignes as l (l.groupe)}
    <li>
      <span class="groupe">
        <span class="puce-groupe" style:background={couleurs[l.groupe] ?? 'var(--gris)'}></span>
        <strong>{l.groupe}</strong>
      </span>
      <span class="carres">
        {#each l.lois as loi (loi.id)}
          <Carre
            href="/lois/{loi.id}"
            titre={loi.titre_court}
            couleur={couleurs[l.groupe] ?? 'var(--gris)'}
            taille={14}
          />
        {/each}
        <span class="compte chiffres">{l.lois.length}</span>
      </span>
      <span class="titres petit secondaire">
        {#each l.lois as loi, i (loi.id)}<a href="/lois/{loi.id}">{loi.titre_court}</a>{i <
          l.lois.length - 1
            ? ' ; '
            : ''}{/each}
      </span>
    </li>
  {/each}
</ul>

<style>
  .pivots {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    display: grid;
    grid-template-columns: 7rem auto;
    gap: 2px 16px;
    padding: 10px 0;
    border-top: 1px solid var(--filet);
  }
  .groupe {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .puce-groupe {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.15);
  }
  .carres {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 3px;
  }
  .compte {
    margin-left: 8px;
    font-weight: 700;
  }
  .titres {
    grid-column: 2;
  }
  @media (max-width: 640px) {
    li {
      grid-template-columns: 4.5rem 1fr;
    }
    .titres {
      grid-column: 1 / -1;
    }
  }
  .titres a {
    color: inherit;
  }
</style>
