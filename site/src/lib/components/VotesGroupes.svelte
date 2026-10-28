<script lang="ts">
  // Comment chaque groupe a voté les lois de la période : une barre par groupe, de la gauche à
  // la droite, découpée selon sa position majoritaire à chaque vote décisif.
  import { votesParGroupe, type Vote } from '$lib/agregats';
  import type { GroupeAffiche, LoiResume } from '$lib/server/vues';

  interface Props {
    lois: LoiResume[];
    groupes: GroupeAffiche[];
  }
  let { lois, groupes }: Props = $props();

  const couleurs = $derived(Object.fromEntries(groupes.map((g) => [g.sigle, g.couleur])));
  const noms = $derived(Object.fromEntries(groupes.map((g) => [g.sigle, g.nom])));
  const lignes = $derived(
    votesParGroupe(
      lois,
      groupes.map((g) => g.sigle)
    )
  );
  const ORDRE: { v: Vote; libelle: string }[] = [
    { v: 'pour', libelle: 'pour' },
    { v: 'pas_censure', libelle: 'ne censure pas (49.3)' },
    { v: 'abstention', libelle: 'abstention' },
    { v: 'partage', libelle: 'partagé' },
    { v: 'contre', libelle: 'contre' },
    { v: 'censure', libelle: 'censure (49.3)' },
    { v: 'absent', libelle: 'absent' }
  ];
  const presents = $derived(ORDRE.filter((o) => lignes.some((l) => l.comptes[o.v] > 0)));
</script>

<ul class="legende petit">
  {#each presents as o (o.v)}
    <li><span class="echantillon {o.v}"></span>{o.libelle}</li>
  {/each}
</ul>

<ul class="groupes">
  {#each lignes as g (g.sigle)}
    {@const soutien = g.comptes.pour + g.comptes.pas_censure}
    <li>
      <span class="sigle" title={noms[g.sigle]}>
        <span class="puce" style:background={couleurs[g.sigle] ?? 'var(--gris)'}></span>{g.sigle}
      </span>
      <span class="barre" role="img" aria-label="{g.sigle} : {soutien} pour sur {g.n}">
        {#each ORDRE as o (o.v)}
          {#if g.comptes[o.v]}
            <span
              class="segment {o.v}"
              style:width="{(100 * g.comptes[o.v]) / g.n}%"
              title="{o.libelle} : {g.comptes[o.v]}"
            ></span>
          {/if}
        {/each}
      </span>
      <span class="chiffre petit chiffres"
        ><strong>{soutien}</strong><span class="secondaire"> / {g.n}</span></span
      >
    </li>
  {/each}
</ul>

<style>
  .legende {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
  }
  .legende li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .echantillon {
    display: inline-block;
    width: 14px;
    height: 10px;
    border-radius: 2px;
  }
  .groupes {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 6px;
  }
  .groupes li {
    display: grid;
    grid-template-columns: 6.5rem 1fr 4.5rem;
    gap: 12px;
    align-items: center;
  }
  .sigle {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-weight: 700;
    font-size: 0.9375rem;
  }
  .puce {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.15);
    flex: none;
  }
  .barre {
    display: flex;
    gap: 1px;
    height: 18px;
  }
  .segment,
  .echantillon {
    min-width: 1px;
  }
  .pour {
    background: var(--vo-pour);
  }
  .pas_censure {
    background: repeating-linear-gradient(135deg, var(--vo-pour) 0 2px, var(--papier) 2px 4px);
    box-shadow: inset 0 0 0 1px var(--vo-pour);
  }
  .abstention {
    background: var(--vo-abstention);
  }
  .partage {
    background: repeating-linear-gradient(90deg, var(--vo-pour) 0 3px, var(--vo-contre) 3px 6px);
  }
  .contre {
    background: var(--vo-contre);
  }
  .censure {
    background: repeating-linear-gradient(135deg, var(--vo-contre) 0 2px, var(--papier) 2px 4px);
    box-shadow: inset 0 0 0 1px var(--vo-contre);
  }
  .absent {
    background: var(--papier);
    box-shadow: inset 0 0 0 1px var(--gris);
  }
  .chiffre {
    text-align: right;
    white-space: nowrap;
  }
  @media (max-width: 640px) {
    .groupes li {
      grid-template-columns: 4.6rem 1fr 4.6rem;
      gap: 8px;
    }
  }
</style>
