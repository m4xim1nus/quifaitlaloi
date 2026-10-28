<script lang="ts">
  // Frise des lois : une colonne par mois, un carré par loi coloré par chemin. Sur un écran
  // étroit, elle pivote (un mois par ligne). docs/CONCEPTION.md §6.
  import { CHEMINS, CONTOURNEMENTS, JALON, LIBELLE_CHEMIN, type Chemin } from '$lib/libelles';
  import { dateLongue, moisAnnee } from '$lib/format';
  import { empiler, lignesEtiquettes, moisEntre, positionDate } from '$lib/frise';
  import { dansPlage, type Plage } from '$lib/plage';
  import type { LoiResume } from '$lib/server/vues';

  interface Props {
    lois: LoiResume[];
    debut: string;
    fin: string;
    jalons: { code: string; debut: string }[];
    /** Période retenue : les lois hors plage sont atténuées. */
    plage?: Plage;
  }
  let { lois, debut, fin, jalons, plage }: Props = $props();
  const horsPlage = (date: string) => !!plage && !dansPlage(date, plage);

  let largeur = $state(1100);
  let survol = $state<{ loi: LoiResume; x: number; y: number } | null>(null);
  let focus = $state<Chemin | null>(null);

  const mois = $derived(moisEntre(debut, fin));
  const marques = $derived(empiler(lois, mois));
  const parMois = $derived(mois.map((m) => marques.filter((x) => x.colonne === m.index).length));
  const comptes = $derived(
    Object.fromEntries(
      CHEMINS.map((c) => [
        c,
        lois.filter((l) => l.chemin === c && !horsPlage(l.date_adoption)).length
      ])
    )
  );
  const vertical = $derived(largeur < 640);

  // --- Géométrie horizontale -------------------------------------------------------------
  const MG = 4;
  const colW = $derived((largeur - MG * 2) / mois.length);
  const carre = $derived(Math.max(6, Math.min(16, Math.floor((colW - 6) / 2) - 2)));
  const pas = $derived(carre + 2);
  const rangs = $derived(Math.max(1, Math.ceil(Math.max(...parMois, 1) / 2)));
  const etiquettes = $derived.by(() => {
    const items = marques
      .filter((m) => CONTOURNEMENTS.includes(m.loi.chemin))
      .map((m) => ({ m, x: MG + m.colonne * colW + colW / 2 }))
      .sort((a, b) => a.x - b.x);
    const lignes = lignesEtiquettes(
      items.map((i) => ({ x: i.x - 4, largeur: i.m.loi.titre_court.length * 6.6 + 8 }))
    );
    return items.map((i, k) => ({ ...i, ligne: lignes[k] }));
  });
  const LIGNE = 18;
  const hautAnnot = $derived((Math.max(...etiquettes.map((e) => e.ligne), -1) + 1) * LIGNE + 30);
  const base = $derived(hautAnnot + rangs * pas);

  function xy(colonne: number, rang: number) {
    const x0 = MG + colonne * colW + (colW - (2 * pas - 2)) / 2;
    return { x: x0 + (rang % 2) * pas, y: base - (Math.floor(rang / 2) + 1) * pas };
  }

  // --- Géométrie verticale ----------------------------------------------------------------
  const GAUCHE = 64;
  const carreV = 14;
  const pasV = 17;
  const hauteurV = $derived(mois.length * pasV + 8);
  function xyV(colonne: number, rang: number) {
    return { x: GAUCHE + rang * pasV, y: 4 + colonne * pasV };
  }

  const jalonsVus = $derived.by(() => {
    const vus = jalons.filter((j) => j.debut >= debut.slice(0, 7) && JALON[j.code]);
    const xs = vus.map((j) => MG + positionDate(j.debut, mois) * colW);
    const lignes = lignesEtiquettes(
      xs.map((x, i) => ({ x, largeur: JALON[vus[i].code].length * 6.4 + 6 }))
    );
    return vus.map((j, i) => ({ ...j, x: xs[i], ligne: lignes[i] }));
  });

  const hauteur = $derived(base + 48 + Math.max(0, ...jalonsVus.map((j) => j.ligne)) * 15);

  function montrer(loi: LoiResume, x: number, y: number) {
    survol = { loi, x, y };
  }
  const libelleMois = (cle: string) => moisAnnee(`${cle}-01`);
</script>

<div class="frise" bind:clientWidth={largeur}>
  <ul class="legende" aria-label="Chemins (cliquer pour isoler)">
    {#each CHEMINS as c (c)}
      <li>
        <button
          type="button"
          aria-pressed={focus === c}
          class:eteint={focus !== null && focus !== c}
          onclick={() => (focus = focus === c ? null : c)}
        >
          <span class="pastille ch-{c}"></span>
          {LIBELLE_CHEMIN[c]}
          <span class="nombre-legende chiffres">{comptes[c]}</span>
        </button>
      </li>
    {/each}
  </ul>

  {#if !vertical}
    <svg
      viewBox="0 0 {largeur} {hauteur}"
      class="horizontale"
      role="img"
      aria-labelledby="frise-titre"
    >
      <title id="frise-titre"
        >Les {lois.length} lois par mois d’adoption définitive, colorées par chemin</title
      >

      {#each jalonsVus as j (j.code)}
        <line class="jalon" x1={j.x} x2={j.x} y1={hautAnnot - 26} y2={base + 30 + j.ligne * 15} />
        <text class="jalon-texte" x={j.x + 4} y={base + 40 + j.ligne * 15}>{JALON[j.code]}</text>
      {/each}

      {#each etiquettes as e (e.m.loi.id)}
        {@const p = xy(e.m.colonne, e.m.rang)}
        {@const yt = 14 + e.ligne * LIGNE}
        <line
          class="renvoi"
          x1={p.x + carre / 2}
          x2={p.x + carre / 2}
          y1={yt + 4}
          y2={p.y - 1}
          class:eteint={(focus !== null && focus !== e.m.loi.chemin) ||
            horsPlage(e.m.loi.date_adoption)}
        />
        <a href="/lois/{e.m.loi.id}">
          <text
            class="etiquette"
            x={p.x + carre / 2 - 3}
            y={yt}
            class:eteint={(focus !== null && focus !== e.m.loi.chemin) ||
              horsPlage(e.m.loi.date_adoption)}>{e.m.loi.titre_court}</text
          >
        </a>
      {/each}

      {#each marques as m (m.loi.id)}
        {@const p = xy(m.colonne, m.rang)}
        <a
          href="/lois/{m.loi.id}"
          aria-label="{m.loi.titre_court}, {dateLongue(m.loi.date_adoption)}, {LIBELLE_CHEMIN[
            m.loi.chemin
          ]}"
          onmouseenter={() => montrer(m.loi, p.x + carre / 2, p.y)}
          onmouseleave={() => (survol = null)}
          onfocus={() => montrer(m.loi, p.x + carre / 2, p.y)}
          onblur={() => (survol = null)}
        >
          <rect
            class="carre {m.loi.chemin}"
            class:eteint={(focus !== null && focus !== m.loi.chemin) ||
              horsPlage(m.loi.date_adoption)}
            class:actif={survol?.loi.id === m.loi.id}
            x={p.x}
            y={p.y}
            width={carre}
            height={carre}
            rx="2"
          />
        </a>
      {/each}

      <line class="axe" x1={MG} x2={largeur - MG} y1={base + 1} y2={base + 1} />
      {#each mois as m (m.cle)}
        {@const x = MG + m.index * colW + colW / 2}
        {#if m.cle.endsWith('-01') || m.index === 0}
          <text class="annee" x={MG + m.index * colW + 2} y={base + 16}>{m.cle.slice(0, 4)}</text>
        {:else if colW >= 30 && Number(m.cle.slice(5)) % 3 === 1}
          <text class="mois" {x} y={base + 16}>{libelleMois(m.cle).split(' ')[0]}</text>
        {/if}
      {/each}
    </svg>
  {:else}
    <svg width={largeur} height={hauteurV} role="img" aria-labelledby="frise-titre-v">
      <title id="frise-titre-v"
        >Les {lois.length} lois par mois d’adoption définitive, colorées par chemin</title
      >

      {#each mois as m (m.cle)}
        <text class="mois-v" x={GAUCHE - 8} y={4 + m.index * pasV + carreV - 3}
          >{libelleMois(m.cle)}</text
        >
      {/each}
      {#each jalonsVus as j (j.code)}
        {@const y = 4 + positionDate(j.debut, mois) * pasV - 1.5}
        <line class="jalon" x1={GAUCHE - 4} x2={largeur} y1={y} y2={y} />
      {/each}
      {#each marques as m (m.loi.id)}
        {@const p = xyV(m.colonne, m.rang)}
        <a
          href="/lois/{m.loi.id}"
          aria-label="{m.loi.titre_court}, {dateLongue(m.loi.date_adoption)}, {LIBELLE_CHEMIN[
            m.loi.chemin
          ]}"
        >
          <rect
            class="carre {m.loi.chemin}"
            class:eteint={(focus !== null && focus !== m.loi.chemin) ||
              horsPlage(m.loi.date_adoption)}
            x={p.x}
            y={p.y}
            width={carreV}
            height={carreV}
            rx="2"
          />
        </a>
        {#if CONTOURNEMENTS.includes(m.loi.chemin) && m.rang === parMois[m.colonne] - 1}
          {@const n = marques.filter(
            (x) => x.colonne === m.colonne && CONTOURNEMENTS.includes(x.loi.chemin)
          ).length}
          <text class="etiquette" x={p.x + pasV + 2} y={p.y + carreV - 3}
            >{n > 1 ? `${n} contournements` : m.loi.titre_court.slice(0, 26)}{n === 1 &&
            m.loi.titre_court.length > 26
              ? '…'
              : ''}</text
          >
        {/if}
      {/each}
    </svg>
    <ul class="jalons-v petit secondaire">
      {#each jalonsVus as j (j.code)}
        <li>— {dateLongue(j.debut)} : {JALON[j.code]}</li>
      {/each}
    </ul>
  {/if}

  {#if survol && !vertical}
    <div
      class="bulle"
      style:left="{Math.min(Math.max(survol.x, 120), largeur - 120)}px"
      style:top="{survol.y - 8}px"
      role="presentation"
    >
      <strong>{survol.loi.titre_court}</strong>
      <span>{dateLongue(survol.loi.date_adoption)} · {LIBELLE_CHEMIN[survol.loi.chemin]}</span>
    </div>
  {/if}
</div>

<style>
  .frise {
    position: relative;
  }
  svg {
    display: block;
    overflow: visible;
  }
  .legende {
    list-style: none;
    padding: 0;
    margin: 0 0 12px;
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
  .carre.nominatif {
    fill: var(--ch-nominatif);
  }
  .carre.rejet_inverse {
    fill: var(--ch-rejet_inverse);
  }
  .carre.art_49_3 {
    fill: var(--ch-art_49_3);
  }
  .carre.sans_scrutin {
    fill: var(--papier);
    stroke: var(--ardoise);
    stroke-width: 1.5;
  }
  .carre {
    transition: opacity 0.15s;
  }
  .carre.actif {
    stroke: var(--encre);
    stroke-width: 2;
    stroke-dasharray: none;
  }
  .eteint {
    opacity: 0.18;
  }
  a:focus-visible rect {
    stroke: var(--focus);
    stroke-width: 2.5;
  }
  .axe {
    stroke: var(--gris);
  }
  .jalon {
    stroke: var(--encre);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.55;
  }
  .jalon-texte,
  .mois,
  .annee,
  .mois-v {
    font-size: 11.5px;
    fill: var(--ardoise);
  }
  .annee {
    font-weight: 700;
    fill: var(--encre);
  }
  .mois {
    text-anchor: middle;
  }
  .mois-v {
    text-anchor: end;
    font-variant-numeric: tabular-nums;
  }
  .etiquette {
    font-size: 12px;
    fill: var(--encre);
    paint-order: stroke;
    stroke: var(--papier);
    stroke-width: 4px;
    stroke-linejoin: round;
  }
  .horizontale {
    width: 100%;
    height: auto;
  }
  a:hover .etiquette {
    text-decoration: underline;
  }
  .renvoi {
    stroke: var(--gris);
  }
  .jalons-v {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
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
    max-width: 260px;
    pointer-events: none;
    display: grid;
    gap: 2px;
    z-index: 2;
  }
  .bulle span {
    opacity: 0.8;
  }
</style>
