<script lang="ts">
  // Réglages de l'accueil, collés en haut de l'écran au défilement : la période étudiée
  // (préréglages et curseur à deux poignées, au mois) et l'inclusion des accords
  // internationaux. Tous les chiffres et graphiques de la page suivent ces réglages.
  import Interrupteur from './Interrupteur.svelte';
  import { bornesMois, type Plage, type Prereglage } from '$lib/plage';
  import { dateLongue, moisAnnee } from '$lib/format';

  interface Props {
    plage: Plage;
    conventions: boolean;
    prereglages: Prereglage[];
    mois: string[]; // AAAA-MM, du premier au dernier
    nConventions: number;
    nLois: number;
  }
  let {
    plage = $bindable(),
    conventions = $bindable(),
    prereglages,
    mois,
    nConventions,
    nLois
  }: Props = $props();

  const indexDe = (date: string) => Math.max(0, mois.indexOf(date.slice(0, 7)));
  const actif = $derived(
    prereglages.find((p) => p.du === plage.du && p.au === plage.au)?.code ?? null
  );
  const tout = $derived(prereglages[0]);

  function curseur(bord: 'du' | 'au', i: number) {
    const autre = indexDe(bord === 'du' ? plage.au : plage.du);
    const j = bord === 'du' ? Math.min(i, autre) : Math.max(i, autre);
    const b = bornesMois(mois[j]);
    // Les bords extrêmes retombent sur la plage complète (dates exactes de la première et
    // de la dernière loi), pour que « tout » reste reconnu.
    const val = bord === 'du' ? (j === 0 ? tout.du : b.du) : j === mois.length - 1 ? tout.au : b.au;
    plage = { ...plage, [bord]: val };
  }
</script>

<div class="reglages">
  <div class="ligne">
    <span class="titre petit">Période</span>
    <div class="prereglages" role="group" aria-label="Choisir une période">
      {#each prereglages as p (p.code)}
        <button
          type="button"
          aria-pressed={actif === p.code}
          onclick={() => (plage = { du: p.du, au: p.au })}>{p.libelle}</button
        >
      {/each}
    </div>
  </div>
  <div class="ligne">
    <div class="curseur">
      <span class="piste" aria-hidden="true">
        <span
          class="rempli"
          style:left="{(100 * indexDe(plage.du)) / Math.max(mois.length - 1, 1)}%"
          style:right="{100 - (100 * indexDe(plage.au)) / Math.max(mois.length - 1, 1)}%"
        ></span>
      </span>
      <input
        type="range"
        min="0"
        max={mois.length - 1}
        value={indexDe(plage.du)}
        aria-label="Début de la période"
        aria-valuetext={moisAnnee(plage.du)}
        oninput={(e) => curseur('du', Number(e.currentTarget.value))}
      />
      <input
        type="range"
        min="0"
        max={mois.length - 1}
        value={indexDe(plage.au)}
        aria-label="Fin de la période"
        aria-valuetext={moisAnnee(plage.au)}
        oninput={(e) => curseur('au', Number(e.currentTarget.value))}
      />
    </div>
    <p class="resume petit" aria-live="polite">
      Du {dateLongue(plage.du)} au {dateLongue(plage.au)}&#8239;:
      <strong>{nLois} lois</strong>{conventions ? ', accords internationaux compris' : ''}
    </p>
    <span class="separateur" aria-hidden="true"></span>
    <Interrupteur bind:valeur={conventions}>
      Inclure les {nConventions} accords internationaux
    </Interrupteur>
  </div>
</div>

<style>
  .reglages {
    position: sticky;
    top: 0;
    z-index: 5;
    background: var(--papier);
    border-top: 1px solid var(--filet);
    border-bottom: 1px solid var(--filet);
    padding: 10px 0;
    display: grid;
    gap: 8px;
  }
  .ligne {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
  }
  .titre {
    font-weight: 700;
  }
  .prereglages {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .prereglages button {
    border: 1px solid var(--filet);
    background: var(--papier);
    border-radius: 999px;
    padding: 2px 11px;
    font-size: 0.875rem;
    cursor: pointer;
  }
  .prereglages button[aria-pressed='true'] {
    background: var(--encre);
    border-color: var(--encre);
    color: var(--papier);
  }
  /* Deux curseurs superposés : seules les poignées captent le pointeur. */
  .curseur {
    position: relative;
    width: min(22rem, 100%);
    height: 24px;
  }
  .curseur input {
    position: absolute;
    inset: 0;
    width: 100%;
    margin: 0;
    background: none;
    pointer-events: none;
    appearance: none;
    -webkit-appearance: none;
  }
  .piste {
    position: absolute;
    left: 8px;
    right: 8px;
    top: 50%;
    height: 3px;
    background: var(--filet);
    transform: translateY(-50%);
    border-radius: 2px;
  }
  .rempli {
    position: absolute;
    top: 0;
    bottom: 0;
    background: var(--encre);
    border-radius: 2px;
  }
  .curseur input:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }
  .curseur input::-webkit-slider-thumb {
    -webkit-appearance: none;
    pointer-events: auto;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--encre);
    border: 2px solid var(--papier);
    cursor: grab;
    position: relative;
    z-index: 1;
  }
  .curseur input::-moz-range-thumb {
    pointer-events: auto;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--encre);
    border: 2px solid var(--papier);
    cursor: grab;
  }
  .curseur input::-moz-range-track {
    background: transparent;
  }
  .resume {
    margin: 0;
  }
  .separateur {
    flex: 1;
  }
  @media (max-width: 640px) {
    .reglages {
      position: static;
    }
  }
</style>
