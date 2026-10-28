<script lang="ts">
  // Chronologie des coalitions (page Coalitions) : une colonne par trimestre d'adoption
  // définitive, un carré par loi. Les textes disputés s'empilent au-dessus de l'axe (le socle
  // sans appui au pied), les autres en dessous : la hauteur au-dessus de l'axe est le nombre de
  // textes disputés. Sur un écran étroit, elle pivote (un trimestre par ligne, disputés à
  // droite de l'axe). Légende-filtre comme la frise.
  import { LIBELLE_CLASSE } from '$lib/libelles';
  import { dateLongue } from '$lib/format';
  import { lignesEtiquettes } from '$lib/frise';
  import {
    DESSOUS,
    DISPUTES,
    PILE,
    empilerCoalitions,
    pileDe,
    positionTrimestre,
    trimestre,
    trimestresEntre,
    type Pile
  } from '$lib/coalitions';
  import type { Classe } from '$lib/types';

  interface LoiC {
    id: string;
    titre_court: string;
    date_adoption: string;
    classe_an: Classe | null;
    autre_leg: number | null;
    censure: boolean;
  }
  interface Props {
    lois: LoiC[];
    debut: string;
    fin: string;
    /** Dates charnières tracées en filets, avec leur nom court. */
    jalons: { code: string; date: string; nom: string }[];
  }
  let { lois, debut, fin, jalons }: Props = $props();

  const LIBELLE: Record<Pile, string> = { ...LIBELLE_CLASSE, aucune: 'Sans vote nominatif' };
  const couleur = (p: Pile) => `var(--co-${p})`;
  const ROMAIN: Record<number, string> = { 15: 'XVe', 16: 'XVIe', 17: 'XVIIe' };

  let largeur = $state(1100);
  let survol = $state<{ loi: LoiC; x: number; y: number } | null>(null);
  let focus = $state<Pile | null>(null);

  const trimestres = $derived(trimestresEntre(debut, fin));
  const comptes = $derived(
    Object.fromEntries(PILE.map((p) => [p, lois.filter((l) => pileDe(l) === p).length])) as Record<
      Pile,
      number
    >
  );
  // Légende en deux rangées, dans l'ordre de lecture : du haut de la pile vers l'axe, puis
  // de l'axe vers le bas. Les catégories vides sont omises (« Sans le socle » aujourd'hui).
  const legendeHaut = $derived([...DISPUTES].reverse().filter((p) => comptes[p] > 0));
  const legendeBas = $derived(DESSOUS.filter((p) => comptes[p] > 0));
  const vertical = $derived(largeur < 640);
  const max = (ms: { colonne: number; rang: number; cote: string }[], cote: string) =>
    Math.max(0, ...ms.filter((m) => m.cote === cote).map((m) => m.rang + 1));

  // --- Horizontale : deux carrés par rangée -----------------------------------------------
  const MG = 4;
  const HAUT = 6;
  const marques = $derived(empilerCoalitions(lois, trimestres, 2));
  const colW = $derived((largeur - MG * 2) / Math.max(trimestres.length, 1));
  const carre = $derived(Math.max(5, Math.min(14, Math.floor((colW - 4) / 2) - 2)));
  const pas = $derived(carre + 2);
  const axe = $derived(HAUT + Math.ceil(max(marques, 'haut') / 2) * pas + 2);
  const bas = $derived(axe + 4 + Math.ceil(max(marques, 'bas') / 2) * pas);
  function xy(colonne: number, rang: number, cote: 'haut' | 'bas') {
    const x0 = MG + colonne * colW + (colW - (2 * pas - 2)) / 2;
    const r = Math.floor(rang / 2);
    return {
      x: x0 + (rang % 2) * pas,
      y: cote === 'haut' ? axe - 2 - (r + 1) * pas + 2 : axe + 4 + r * pas
    };
  }
  const jalonsVus = $derived.by(() => {
    const vus = jalons.filter((j) => j.date >= debut && j.date <= fin);
    const xs = vus.map((j) => MG + positionTrimestre(j.date, trimestres) * colW);
    const lignes = lignesEtiquettes(
      xs.map((x, i) => ({ x, largeur: vus[i].nom.length * 6.4 + 6 }))
    );
    return vus.map((j, i) => ({ ...j, x: xs[i], ligne: lignes[i] }));
  });
  const hauteur = $derived(bas + 44 + Math.max(0, ...jalonsVus.map((j) => j.ligne)) * 15);

  // --- Verticale (téléphone) : un trimestre par ligne -------------------------------------
  const GAUCHE = 50;
  const BANDE = 22;
  const LIGNE_V = 14;
  const marquesV = $derived(empilerCoalitions(lois, trimestres, 1));
  const pasV = $derived(
    Math.max(
      6,
      Math.min(
        13,
        Math.floor(
          (largeur - GAUCHE - 8) / Math.max(max(marquesV, 'haut') + max(marquesV, 'bas'), 1)
        )
      )
    )
  );
  const carreV = $derived(pasV - 2);
  const axeV = $derived(GAUCHE + max(marquesV, 'bas') * pasV + 3);
  const ligneJalons = $derived(
    jalonsVus.map((j) => trimestres.find((t) => t.cle === trimestre(j.date))?.index ?? 0)
  );
  const yLigne = (i: number) => 4 + i * LIGNE_V + BANDE * ligneJalons.filter((k) => k <= i).length;
  const hauteurV = $derived(trimestres.length * LIGNE_V + 8 + BANDE * jalonsVus.length);
  function xyV(colonne: number, rang: number, cote: 'haut' | 'bas') {
    return {
      x: cote === 'haut' ? axeV + 3 + rang * pasV : axeV - 3 - (rang + 1) * pasV + 2,
      y: yLigne(colonne)
    };
  }

  const detail = (l: LoiC) =>
    [
      LIBELLE[pileDe(l)],
      l.censure ? 'sur un 49.3, ne pas voter la censure n’est pas soutenir' : '',
      l.autre_leg ? `vote décisif tenu sous la ${ROMAIN[l.autre_leg]}` : ''
    ]
      .filter(Boolean)
      .join(' · ');
  const aria = (l: LoiC) => `${l.titre_court}, ${dateLongue(l.date_adoption)}, ${detail(l)}`;
</script>

{#snippet bouton(p: Pile)}
  <li>
    <button
      type="button"
      aria-pressed={focus === p}
      class:eteint={focus !== null && focus !== p}
      onclick={() => (focus = focus === p ? null : p)}
    >
      <span
        class="pastille"
        class:vide={p === 'aucune'}
        style:background={p === 'aucune' ? undefined : couleur(p)}
      ></span>
      {LIBELLE[p]}
      <span class="nombre-legende chiffres">{comptes[p]}</span>
    </button>
  </li>
{/snippet}

{#snippet carreLoi(l: LoiC, x: number, y: number, c: number, bulle: boolean)}
  {@const k = pileDe(l)}
  <a
    href="/lois/{l.id}"
    aria-label={aria(l)}
    onmouseenter={bulle ? () => (survol = { loi: l, x: x + c / 2, y }) : undefined}
    onmouseleave={bulle ? () => (survol = null) : undefined}
    onfocus={bulle ? () => (survol = { loi: l, x: x + c / 2, y }) : undefined}
    onblur={bulle ? () => (survol = null) : undefined}
  >
    <rect
      class="carre"
      class:vide={k === 'aucune'}
      class:eteint={focus !== null && focus !== k}
      class:actif={survol?.loi.id === l.id}
      style:fill={k === 'aucune' ? undefined : couleur(k)}
      {x}
      {y}
      width={c}
      height={c}
      rx="2"
    />
    {#if l.autre_leg}
      <circle
        class="point"
        class:eteint={focus !== null && focus !== k}
        cx={x + c / 2}
        cy={y + c / 2}
        r={Math.max(1.2, c / 6)}
      />
    {/if}
  </a>
{/snippet}

<div class="chrono" bind:clientWidth={largeur}>
  <div class="legendes">
    <p class="petit secondaire">Au-dessus de l’axe, les textes disputés&#8239;:</p>
    <ul class="legende" aria-label="Textes disputés, par coalition (cliquer pour isoler)">
      {#each legendeHaut as p (p)}{@render bouton(p)}{/each}
    </ul>
    <p class="petit secondaire">En dessous&#8239;:</p>
    <ul class="legende" aria-label="Autres lois (cliquer pour isoler)">
      {#each legendeBas as p (p)}{@render bouton(p)}{/each}
    </ul>
  </div>

  {#if !vertical}
    <svg viewBox="0 0 {largeur} {hauteur}" role="img" aria-labelledby="chrono-c-titre">
      <title id="chrono-c-titre"
        >Les {lois.length} lois par trimestre d’adoption définitive, colorées par coalition</title
      >
      {#each trimestres as t (t.cle)}
        {#if t.t === 1}
          <line
            class="annee-filet"
            x1={MG + t.index * colW}
            x2={MG + t.index * colW}
            y1={HAUT}
            y2={bas}
          />
        {/if}
      {/each}
      {#each jalonsVus as j (j.code)}
        <line class="jalon" x1={j.x} x2={j.x} y1={HAUT - 6} y2={bas + 26 + j.ligne * 15} />
        <text class="jalon-texte" x={j.x + 4} y={bas + 36 + j.ligne * 15}>{j.nom}</text>
      {/each}
      {#each marques as m (m.loi.id)}
        {@const p = xy(m.colonne, m.rang, m.cote)}
        {@render carreLoi(m.loi, p.x, p.y, carre, true)}
      {/each}
      <line class="axe" x1={MG} x2={largeur - MG} y1={axe + 1} y2={axe + 1} />
      {#each trimestres as t (t.cle)}
        {#if t.t === 1}
          <text class="annee" x={MG + t.index * colW + 2} y={bas + 14}>{t.annee}</text>
        {/if}
      {/each}
    </svg>
  {:else}
    <svg width={largeur} height={hauteurV} role="img" aria-labelledby="chrono-c-titre-v">
      <title id="chrono-c-titre-v"
        >Les {lois.length} lois par trimestre d’adoption définitive, colorées par coalition</title
      >
      {#each trimestres as t (t.cle)}
        <text class="trim-v" x={GAUCHE - 6} y={yLigne(t.index) + carreV - 1}
          >{t.t === 1 || t.index === 0 ? `${t.annee} ` : ''}T{t.t}</text
        >
      {/each}
      {#each jalonsVus as j, i (j.code)}
        {@const y = yLigne(ligneJalons[i]) - 5}
        <line class="jalon" x1={0} x2={largeur} y1={y} y2={y} />
        <text class="jalon-v" x={0} y={y - 6}>{j.nom}</text>
      {/each}
      <line class="axe" x1={axeV} x2={axeV} y1={0} y2={hauteurV} />
      {#each marquesV as m (m.loi.id)}
        {@const p = xyV(m.colonne, m.rang, m.cote)}
        {@render carreLoi(m.loi, p.x, p.y, carreV, false)}
      {/each}
    </svg>
  {/if}

  {#if survol && !vertical}
    <div
      class="bulle"
      style:left="{Math.min(Math.max(survol.x, 130), largeur - 130)}px"
      style:top="{survol.y - 8}px"
      role="presentation"
    >
      <strong>{survol.loi.titre_court}</strong>
      <span>{dateLongue(survol.loi.date_adoption)} · {detail(survol.loi)}</span>
    </div>
  {/if}
</div>

<style>
  .chrono {
    position: relative;
  }
  svg {
    display: block;
    overflow: visible;
  }
  svg[viewBox] {
    width: 100%;
    height: auto;
  }
  .legendes {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 12px;
    align-items: center;
    margin-bottom: 14px;
  }
  .legendes p {
    margin: 0;
  }
  @media (max-width: 640px) {
    .legendes {
      grid-template-columns: 1fr;
    }
  }
  .legende {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 6px;
  }
  .legende button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid var(--filet);
    background: var(--papier);
    border-radius: 999px;
    padding: 3px 11px 3px 8px;
    font-size: 0.875rem;
    cursor: pointer;
  }
  .legende button[aria-pressed='true'] {
    border-color: var(--encre);
  }
  .legende button.eteint {
    opacity: 0.45;
  }
  .nombre-legende {
    color: var(--ardoise);
  }
  .carre {
    transition: opacity 0.15s;
  }
  .carre.vide {
    fill: var(--papier);
    stroke: var(--ardoise);
    stroke-width: 1.25;
  }
  .carre.actif {
    stroke: var(--encre);
    stroke-width: 2;
  }
  .point {
    fill: var(--papier);
    pointer-events: none;
  }
  .eteint {
    opacity: 0.15;
  }
  a:focus-visible rect {
    stroke: var(--focus);
    stroke-width: 2.5;
  }
  .axe {
    stroke: var(--encre);
    stroke-width: 1;
  }
  .annee-filet {
    stroke: var(--filet);
  }
  .jalon {
    stroke: var(--encre);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.55;
  }
  .jalon-texte,
  .annee,
  .trim-v {
    font-size: 11.5px;
    fill: var(--ardoise);
  }
  .annee {
    font-weight: 700;
    fill: var(--encre);
  }
  .trim-v {
    text-anchor: end;
    font-variant-numeric: tabular-nums;
  }
  .jalon-v {
    font-size: 11.5px;
    font-weight: 600;
    fill: var(--encre);
  }
  .bulle {
    position: absolute;
    transform: translate(-50%, -100%);
    background: var(--encre);
    color: var(--papier);
    padding: 6px 10px;
    border-radius: var(--rayon);
    font-size: 0.8125rem;
    line-height: 1.35;
    max-width: 280px;
    pointer-events: none;
    display: grid;
    gap: 2px;
    z-index: 2;
  }
  .bulle span {
    opacity: 0.8;
  }
</style>
