<script lang="ts">
  // Groupes décisifs dans le temps (page Coalitions) : une rangée par groupe hors socle décisif
  // au moins une fois, une colonne par trimestre, alignée sur la chronologie des coalitions.
  // Carré plein : décisif par son vote ; contour : par son abstention ; contour pointillé : par
  // la non-censure d'un 49.3. Sous l'axe, le nombre de lois votées nominativement (le
  // dénominateur). La période sans groupe décisif (XVe) est une bande grisée qui porte les noms
  // des rangées. Sur téléphone, l'axe commence après cette bande et les noms passent à gauche.
  import { dateLongue } from '$lib/format';
  import { lignesEtiquettes } from '$lib/frise';
  import {
    positionTrimestre,
    rangeesDecisives,
    trimestresEntre,
    voteesParTrimestre,
    type LoiDecisive,
    type Poids
  } from '$lib/coalitions';

  interface LoiD extends LoiDecisive {
    titre_court: string;
    censure: boolean;
    /** Législature du vote décisif quand ce n'est pas celle de l'adoption (point blanc). */
    autre_leg: number | null;
  }
  interface Props {
    lois: LoiD[];
    /** Groupes de la gauche vers la droite. */
    groupes: { sigle: string; nom: string; couleur: string | null }[];
    debut: string;
    fin: string;
    /** Fin de la période sans groupe décisif (bande grisée), et sa légende. */
    vide: { fin: string; texte: string };
    jalons: { code: string; date: string; nom: string }[];
    /** Groupes entrés dans le socle à une date : leur rangée est hachurée ensuite. */
    socle?: { sigle: string; depuis: string; texte: string }[];
  }
  let { lois, groupes, debut, fin, vide, jalons, socle = [] }: Props = $props();

  let largeur = $state(1100);
  let survol = $state<{ loi: LoiD; sigle: string; poids: Poids; x: number; y: number } | null>(
    null
  );

  const etroit = $derived(largeur < 640);
  // Sur téléphone, l'axe commence après la période vide.
  const depart = $derived(etroit ? vide.fin : debut);
  const trimestres = $derived(trimestresEntre(depart, fin));
  const GAUCHE = $derived(etroit ? 66 : 0);
  const MG = 4;
  const colW = $derived((largeur - GAUCHE - MG * 2) / Math.max(trimestres.length, 1));
  const parRangee = $derived(colW >= 28 ? 2 : 1);
  const carre = $derived(Math.max(6, Math.min(14, Math.floor((colW - 4) / parRangee) - 2)));
  const pas = $derived(carre + 2);
  const xCol = (i: number) => GAUCHE + MG + i * colW;

  const couleurDe = $derived(new Map(groupes.map((g) => [g.sigle, g.couleur ?? 'var(--gris)'])));
  const nomDe = $derived(new Map(groupes.map((g) => [g.sigle, g.nom])));
  const rangees = $derived.by(() => {
    const rs = rangeesDecisives(
      lois,
      groupes.map((g) => g.sigle),
      trimestres
    );
    let y = 26;
    return rs.map((r) => {
      const n = Math.max(1, ...r.marques.map((m) => Math.floor(m.rang / parRangee) + 1));
      const h = n * pas + 12;
      const out = { ...r, y, h };
      y += h;
      return out;
    });
  });
  const finRangees = $derived(rangees.length ? rangees.at(-1)!.y + rangees.at(-1)!.h : 26);
  const votees = $derived(voteesParTrimestre(lois, trimestres));
  const yVotees = $derived(finRangees + 30);

  const xVide = $derived(xCol(positionTrimestre(vide.fin, trimestres)));
  const jalonsVus = $derived.by(() => {
    const vus = jalons.filter((j) => j.date >= depart && j.date <= fin);
    const xs = vus.map((j) => xCol(positionTrimestre(j.date, trimestres)));
    const lignes = lignesEtiquettes(
      xs.map((x, i) => ({ x, largeur: vus[i].nom.length * 6.4 + 6 }))
    );
    return vus.map((j, i) => ({ ...j, x: xs[i], ligne: lignes[i] }));
  });
  const hauteur = $derived(
    yVotees + (etroit ? 16 : 34 + Math.max(0, ...jalonsVus.map((j) => j.ligne)) * 15) + 12
  );

  function xy(colonne: number, rang: number, y0: number) {
    const largeurCase = parRangee * pas - 2;
    return {
      x: xCol(colonne) + (colW - largeurCase) / 2 + (rang % parRangee) * pas,
      y: y0 + 6 + Math.floor(rang / parRangee) * pas
    };
  }
  const ROMAIN: Record<number, string> = { 15: 'XVe', 16: 'XVIe', 17: 'XVIIe' };
  const libellePoids = (l: LoiD, poids: Poids) =>
    (poids === 'abstention'
      ? 'décisif par son abstention'
      : l.censure
        ? 'décisif en ne votant pas la censure (49.3)'
        : 'décisif par son vote') +
    (l.autre_leg ? `, vote tenu sous la ${ROMAIN[l.autre_leg]}` : '');
  const pluriel = (n: number) => (n > 1 ? 's' : '');
</script>

<div class="chrono" bind:clientWidth={largeur}>
  <svg viewBox="0 0 {largeur} {hauteur}" role="img" aria-labelledby="chrono-d-titre">
    <title id="chrono-d-titre"
      >Lois où un groupe hors socle a été décisif, par groupe et par trimestre d’adoption</title
    >
    <defs>
      <pattern id="hachures" width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" class="hachure" />
      </pattern>
    </defs>

    {#if !etroit}
      <rect class="bande" x={xCol(0)} y={0} width={xVide - xCol(0)} height={yVotees - 18} />
      <text class="bande-texte" x={xCol(0) + 8} y={16}>{vide.texte}</text>
    {/if}

    {#each rangees as r (r.sigle)}
      <line class="filet" x1={GAUCHE} x2={largeur} y1={r.y} y2={r.y} />
      {#each socle.filter((s) => s.sigle === r.sigle && s.depuis <= fin) as s (s.sigle)}
        {@const x0 = xCol(positionTrimestre(s.depuis, trimestres))}
        <rect
          class="dans-socle"
          x={x0}
          y={r.y + 1}
          width={xCol(trimestres.length) - x0}
          height={r.h - 1}
        />
        <text class="socle-texte" x={x0 + 6} y={r.y + r.h / 2 + 4}>{s.texte}</text>
      {/each}
      <g class="nom">
        <circle
          cx={(etroit ? 0 : xCol(0)) + 10}
          cy={r.y + r.h / 2}
          r="5"
          style:fill={couleurDe.get(r.sigle)}
        />
        <text x={(etroit ? 0 : xCol(0)) + 20} y={r.y + r.h / 2 + 4}>
          <tspan class="sigle">{r.sigle}</tspan>
          <tspan class="effectif" dx="6">{r.vote}</tspan>
          {#if r.abst && !etroit}<tspan class="abst" dx="4">+{r.abst} par abstention</tspan>{/if}
        </text>
      </g>
      {#each r.marques as m (m.loi.id)}
        {@const p = xy(m.colonne, m.rang, r.y)}
        {@const c = couleurDe.get(r.sigle)}
        {@const libelle = libellePoids(m.loi, m.poids)}
        <a
          href="/lois/{m.loi.id}"
          aria-label="{m.loi.titre_court}, {dateLongue(m.loi.date_adoption)} : {r.sigle} {libelle}"
          onmouseenter={() =>
            (survol = { loi: m.loi, sigle: r.sigle, poids: m.poids, x: p.x + carre / 2, y: p.y })}
          onmouseleave={() => (survol = null)}
          onfocus={() =>
            (survol = { loi: m.loi, sigle: r.sigle, poids: m.poids, x: p.x + carre / 2, y: p.y })}
          onblur={() => (survol = null)}
        >
          <rect
            class="carre"
            class:creux={m.poids === 'abstention' || m.loi.censure}
            class:pointille={m.poids === 'vote' && m.loi.censure}
            class:actif={survol?.loi.id === m.loi.id && survol?.sigle === r.sigle}
            style:--c={c}
            x={p.x}
            y={p.y}
            width={carre}
            height={carre}
            rx="2"
          />
          {#if m.loi.autre_leg}
            <circle class="point" cx={p.x + carre / 2} cy={p.y + carre / 2} r={carre / 6} />
          {/if}
        </a>
      {/each}
    {/each}
    <line class="axe" x1={GAUCHE} x2={largeur} y1={finRangees} y2={finRangees} />

    {#each jalonsVus as j (j.code)}
      <line
        class="jalon"
        x1={j.x}
        x2={j.x}
        y1={0}
        y2={etroit ? yVotees + 4 : yVotees + 20 + j.ligne * 15}
      />
      {#if !etroit}
        <text class="jalon-texte" x={j.x + 4} y={yVotees + 30 + j.ligne * 15}>{j.nom}</text>
      {/if}
    {/each}

    <text class="votees-titre" x={etroit ? 0 : xCol(0) + 8} y={finRangees + 14}
      >Lois votées nominativement, par trimestre</text
    >
    {#each trimestres as t (t.cle)}
      <text class="votees" class:serre={colW < 22} x={xCol(t.index) + colW / 2} y={yVotees}
        >{votees[t.index] || ''}</text
      >
      {#if t.t === 1}
        <text class="annee" x={xCol(t.index) + 2} y={yVotees + (etroit ? 16 : 14)}
          >{etroit ? `’${String(t.annee).slice(2)}` : t.annee}</text
        >
      {/if}
    {/each}
  </svg>

  {#if survol}
    <div
      class="bulle"
      style:left="{Math.min(Math.max(survol.x, 130), largeur - 130)}px"
      style:top="{survol.y - 8}px"
      role="presentation"
    >
      <strong>{survol.loi.titre_court}</strong>
      <span
        >{dateLongue(survol.loi.date_adoption)} · {survol.sigle}
        {libellePoids(survol.loi, survol.poids)}</span
      >
    </div>
  {/if}

  <ul class="visuellement-cache">
    {#each rangees as r (r.sigle)}
      <li>
        {r.sigle} ({nomDe.get(r.sigle)}) : décisif sur {r.vote} loi{pluriel(r.vote)} par son vote{r.abst
          ? `, ${r.abst} par son abstention`
          : ''}.
      </li>
    {/each}
  </ul>
</div>

<style>
  .chrono {
    position: relative;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .bande {
    fill: var(--plan);
  }
  .bande-texte,
  .socle-texte,
  .votees-titre {
    font-size: 12px;
    fill: var(--ardoise);
  }
  .dans-socle {
    fill: url(#hachures);
  }
  .hachure {
    stroke: var(--filet);
    stroke-width: 1.5;
  }
  .socle-texte {
    paint-order: stroke;
    stroke: var(--papier);
    stroke-width: 4px;
    stroke-linejoin: round;
  }
  .filet {
    stroke: var(--filet);
  }
  .axe {
    stroke: var(--gris);
  }
  .nom text {
    font-size: 13px;
    fill: var(--encre);
  }
  .nom circle {
    stroke: rgb(0 0 0 / 0.15);
  }
  .sigle {
    font-weight: 700;
  }
  .effectif {
    font-family: var(--serif);
    font-size: 15px;
    font-variant-numeric: tabular-nums;
  }
  .abst {
    font-size: 11.5px;
    fill: var(--ardoise);
  }
  .carre {
    fill: var(--c);
    stroke: rgb(0 0 0 / 0.12);
  }
  .carre.creux {
    fill: var(--papier);
    stroke: var(--c);
    stroke-width: 2;
  }
  .carre.pointille {
    stroke-dasharray: 2.5 1.5;
  }
  .point {
    fill: var(--papier);
    pointer-events: none;
  }
  .carre.creux + .point {
    fill: var(--c);
  }
  .carre.actif {
    stroke: var(--encre);
    stroke-width: 2;
  }
  a:focus-visible rect {
    stroke: var(--focus);
    stroke-width: 2.5;
  }
  .jalon {
    stroke: var(--encre);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.55;
  }
  .jalon-texte,
  .annee,
  .votees {
    font-size: 11.5px;
    fill: var(--ardoise);
  }
  .votees {
    text-anchor: middle;
    font-variant-numeric: tabular-nums;
  }
  .votees.serre {
    font-size: 8.5px;
    letter-spacing: -0.03em;
  }
  .annee {
    font-weight: 700;
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
