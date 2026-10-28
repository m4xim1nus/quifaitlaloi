<script lang="ts">
  // Coalitions du vote décisif à l'Assemblée, par période : une ligne par coalition, une
  // colonne par période, un carré par loi. Les effectifs restent visibles (7 lois seulement
  // avant la censure Barnier, hors conventions).
  import Carre from './Carre.svelte';
  import { CLASSES, LIBELLE_CLASSE, DEFINITION_CLASSE, NOM_PERIODE } from '$lib/libelles';
  import { periodeDe } from '$lib/agregats';
  import { pourcent } from '$lib/format';
  import type { LoiResume, Periode } from '$lib/server/vues';
  import type { Classe } from '$lib/types';

  interface Props {
    lois: LoiResume[];
    periodes: Periode[];
  }
  let { lois, periodes }: Props = $props();

  const colonnes = $derived(periodes.filter((p) => NOM_PERIODE[p.code]));
  type Ligne = Classe | 'aucune';
  const cellules = $derived.by(() => {
    const m = new Map<string, LoiResume[]>();
    for (const l of lois) {
      const k = `${l.classe_an ?? 'aucune'}|${periodeDe(l.date_adoption, periodes)}`;
      m.set(k, [...(m.get(k) ?? []), l]);
    }
    return m;
  });
  const totaux = $derived(
    Object.fromEntries(
      colonnes.map((p) => [
        p.code,
        lois.filter((l) => periodeDe(l.date_adoption, periodes) === p.code).length
      ])
    )
  );
  const lignes = $derived(
    ([...CLASSES, 'aucune'] as Ligne[]).filter((c) =>
      colonnes.some((p) => cellules.get(`${c}|${p.code}`)?.length)
    )
  );
  const libelle = (c: Ligne) => (c === 'aucune' ? 'Sans vote nominatif' : LIBELLE_CLASSE[c]);
  const definition = (c: Ligne) =>
    c === 'aucune'
      ? 'Pas de vote nominatif : la coalition n’est pas connue. Ce n’est pas un consensus.'
      : DEFINITION_CLASSE[c];
</script>

<div class="table" role="table" aria-label="Coalitions par période">
  <div class="ligne entete" role="row">
    <span role="columnheader"><span class="visuellement-cache">Coalition</span></span>
    {#each colonnes as p (p.code)}
      <span role="columnheader" class="periode">
        {NOM_PERIODE[p.code]}
        <span class="secondaire chiffres">{totaux[p.code]} lois</span>
      </span>
    {/each}
  </div>
  {#each lignes as c (c)}
    <div class="ligne" class:a-part={c === 'aucune'} role="row">
      <span role="rowheader" class="classe">
        <span class="nom">{libelle(c)}</span>
        <span class="definition petit secondaire">{definition(c)}</span>
      </span>
      {#each colonnes as p (p.code)}
        {@const ls = cellules.get(`${c}|${p.code}`) ?? []}
        <span role="cell" class="cellule">
          <span class="carres">
            {#each ls as l (l.id)}
              <Carre
                href="/lois/{l.id}"
                titre={l.titre_court}
                classe={c === 'aucune' ? 'vide' : ''}
                couleur={c === 'aucune' ? undefined : `var(--co-${c})`}
              />
            {/each}
          </span>
          {#if ls.length}
            <span class="compte chiffres"
              >{ls.length}<span class="secondaire">
                · {pourcent(ls.length / totaux[p.code])}</span
              ></span
            >
          {:else}
            <span class="compte secondaire">—</span>
          {/if}
        </span>
      {/each}
    </div>
  {/each}
</div>

<style>
  .table {
    display: grid;
    gap: 0;
  }
  .ligne {
    display: grid;
    grid-template-columns: minmax(10rem, 1.1fr) repeat(3, minmax(0, 1fr));
    gap: 8px 20px;
    padding: 12px 0;
    border-top: 1px solid var(--filet);
    align-items: start;
  }
  .a-part {
    margin-top: 16px;
    border-top: 1px dashed var(--gris);
  }
  .entete {
    border-top: none;
    padding-top: 0;
    font-size: 0.875rem;
    font-weight: 700;
  }
  .periode {
    display: grid;
  }
  .periode .secondaire {
    font-weight: 400;
  }
  .classe {
    display: grid;
    gap: 2px;
  }
  .nom {
    font-weight: 700;
  }
  .cellule {
    display: grid;
    gap: 4px;
  }
  .carres {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    max-width: calc(12 * 14px);
  }
  .compte {
    font-size: 0.875rem;
  }
  @media (max-width: 640px) {
    .ligne {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .classe {
      grid-column: 1 / -1;
    }
    .definition {
      display: none;
    }
    .entete > :first-child {
      display: none;
    }
    .carres {
      max-width: calc(8 * 14px);
    }
  }
</style>
