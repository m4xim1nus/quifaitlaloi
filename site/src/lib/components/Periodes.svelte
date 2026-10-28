<script lang="ts">
  // Coalitions par période charnière : une barre à 100 % par période, effectif affiché (petits
  // nombres : 7 lois avant la censure Barnier, hors accords).
  import { comptesCoalitions, periodeDe } from '$lib/agregats';
  import { CLASSES, LIBELLE_CLASSE, NOM_PERIODE } from '$lib/libelles';
  import type { LoiResume, Periode } from '$lib/server/vues';

  interface Props {
    lois: LoiResume[];
    periodes: Periode[];
  }
  let { lois, periodes }: Props = $props();

  const lignes = $derived(
    periodes
      .filter((p) => NOM_PERIODE[p.code])
      .map((p) => {
        const ls = lois.filter((l) => periodeDe(l.date_adoption, periodes) === p.code);
        return { p, n: ls.length, c: comptesCoalitions(ls) };
      })
      .filter((x) => x.n > 0)
  );
</script>

<ul class="periodes">
  {#each lignes as { p, n, c } (p.code)}
    <li>
      <span class="nom petit"
        ><strong>{NOM_PERIODE[p.code]}</strong> <span class="secondaire">{n} lois</span></span
      >
      <span class="barre" role="img" aria-label="Coalitions, {NOM_PERIODE[p.code]}">
        {#each CLASSES as k (k)}
          {@const m = c.parClasse.get(k)!.length}
          {#if m}
            <span
              class="segment"
              style:width="{(100 * m) / n}%"
              style:background="var(--co-{k})"
              title="{LIBELLE_CLASSE[k]} : {m} sur {n}"
            >
              {#if m / n > 0.08}<span
                  class="compte"
                  class:clair={k === 'socle_rn'}
                  class:neutre={k === 'consensus'}>{m}</span
                >{/if}
            </span>
          {/if}
        {/each}
        {#if c.sans.length}
          <span
            class="segment vide"
            style:width="{(100 * c.sans.length) / n}%"
            title="Sans vote nominatif : {c.sans.length}"
          ></span>
        {/if}
      </span>
    </li>
  {/each}
</ul>

<style>
  .periodes {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
  }
  li {
    display: grid;
    grid-template-columns: 18rem 1fr;
    gap: 12px;
    align-items: center;
  }
  .barre {
    display: flex;
    gap: 2px;
    height: 24px;
  }
  .segment {
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 3px;
  }
  .segment.vide {
    background: var(--papier);
    box-shadow: inset 0 0 0 1.5px var(--ardoise);
  }
  .compte {
    font-size: 0.8125rem;
    font-weight: 700;
    color: #fff;
  }
  .compte.clair {
    color: #1a2029;
  }
  .compte.neutre {
    color: var(--encre);
  }
  @media (max-width: 640px) {
    li {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
</style>
