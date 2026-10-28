<script lang="ts">
  // Coalitions de la période, sans chronologie : une barre pour les proportions, puis une
  // carte par coalition avec les lois qu'elle contient.
  import { comptesCoalitions } from '$lib/agregats';
  import { CLASSES, DEFINITION_CLASSE, LIBELLE_CLASSE } from '$lib/libelles';
  import { dateCourte } from '$lib/format';
  import type { LoiResume } from '$lib/server/vues';
  import type { Classe } from '$lib/types';

  interface Props {
    lois: LoiResume[];
    conventions: boolean;
  }
  let { lois, conventions }: Props = $props();

  const MAX = 5;
  const c = $derived(comptesCoalitions(lois));
  const classes = $derived(CLASSES.filter((k) => c.parClasse.get(k)!.length));
  const total = $derived(lois.length);
  const recentes = (ls: LoiResume[]) =>
    [...ls].sort((a, b) => b.date_adoption.localeCompare(a.date_adoption));
  const lien = (k: Classe | 'aucune') =>
    `/lois?coalition=${k}${conventions ? '&conventions=1' : ''}`;
  const largeur = (n: number) => `${(100 * n) / Math.max(total, 1)}%`;
</script>

<div class="barre" role="img" aria-label="Répartition des lois par coalition">
  {#each classes as k (k)}
    {@const n = c.parClasse.get(k)!.length}
    <span
      class="segment"
      style:width={largeur(n)}
      style:background="var(--co-{k})"
      title="{LIBELLE_CLASSE[k]} : {n}"
    >
      {#if n / total > 0.07}<span
          class="compte"
          class:clair={k === 'socle_rn'}
          class:neutre={k === 'consensus'}>{n}</span
        >{/if}
    </span>
  {/each}
  {#if c.sans.length}
    <span
      class="segment vide"
      style:width={largeur(c.sans.length)}
      title="Sans vote nominatif : {c.sans.length}"
    ></span>
  {/if}
</div>

<ul class="cartes">
  {#each classes as k (k)}
    {@const ls = recentes(c.parClasse.get(k)!)}
    <li class="carte">
      <h3>
        <span class="pastille" style:background="var(--co-{k})"></span>
        {LIBELLE_CLASSE[k]}
        <span class="nombre total">{ls.length}</span>
      </h3>
      <p class="petit secondaire">{DEFINITION_CLASSE[k]}</p>
      <ul class="lois petit">
        {#each ls.slice(0, MAX) as l (l.id)}
          <li>
            <span class="date chiffres">{dateCourte(l.date_adoption).slice(3)}</span>
            <a href="/lois/{l.id}">{l.titre_court}</a>
          </li>
        {/each}
      </ul>
      {#if ls.length > MAX}
        <a class="petit tout" href={lien(k)}>Voir les {ls.length} lois</a>
      {/if}
    </li>
  {/each}
  {#if c.sans.length}
    <li class="carte a-part">
      <h3>
        <span class="pastille ch-sans_scrutin"></span>
        Sans vote nominatif <span class="nombre total">{c.sans.length}</span>
      </h3>
      <p class="petit secondaire">
        Pas de vote nominatif au dernier passage à l’Assemblée : la coalition n’est pas connue. Ce
        n’est pas un consensus.
      </p>
      <ul class="lois petit">
        {#each recentes(c.sans).slice(0, MAX) as l (l.id)}
          <li>
            <span class="date chiffres">{dateCourte(l.date_adoption).slice(3)}</span>
            <a href="/lois/{l.id}">{l.titre_court}</a>
          </li>
        {/each}
      </ul>
      {#if c.sans.length > MAX}
        <a class="petit tout" href={lien('aucune')}>Voir les {c.sans.length} lois</a>
      {/if}
    </li>
  {/if}
</ul>

<style>
  .barre {
    display: flex;
    gap: 2px;
    height: 34px;
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
    margin-left: 6px;
  }
  .compte {
    font-weight: 700;
    font-size: 0.875rem;
    color: #fff;
  }
  .compte.clair {
    color: #1a2029;
  }
  .compte.neutre {
    color: var(--encre);
  }
  .cartes {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: 28px 32px;
  }
  .carte {
    display: grid;
    gap: 6px;
    align-content: start;
  }
  .a-part {
    border-left: 1px dashed var(--gris);
    padding-left: 16px;
  }
  h3 {
    font-family: var(--sans);
    font-size: 1.0625rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .total {
    margin-left: auto;
    font-size: 1.75rem;
    font-weight: 500;
    line-height: 1;
  }
  .lois {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 4px;
  }
  .lois li {
    display: grid;
    grid-template-columns: 3.6rem 1fr;
    gap: 8px;
  }
  .date {
    color: var(--ardoise);
  }
  .tout {
    font-weight: 700;
  }
</style>
