<script lang="ts">
  // Hémicycle d'un scrutin : un siège par membre, groupes rangés de la gauche à la droite
  // (ordre des blocs), sièges colorés selon le décompte du groupe. La place d'un siège dans son
  // groupe n'est pas celle d'un député : seuls les décomptes par groupe sont publiés ici.
  import { rayonSiege, sieges } from '$lib/hemicycle';
  import type { PositionGroupe } from '$lib/types';

  interface Props {
    positions: PositionGroupe[];
    censure?: boolean;
    couleurs?: Record<string, string>;
  }
  let { positions, censure = false, couleurs = {} }: Props = $props();

  type Vote = 'pour' | 'abstention' | 'contre' | 'absent';
  const total = $derived(positions.reduce((s, p) => s + p.membres, 0));
  const places = $derived(sieges(total));
  const r = $derived(rayonSiege(total));

  // Ordre dans le groupe : pour, abstention, contre, non-votants. Sur une censure, seuls les
  // « pour » sont recueillis : ils sont peints comme une opposition au texte.
  const attribution = $derived.by(() => {
    const out: { vote: Vote; groupe: PositionGroupe }[] = [];
    for (const p of positions) {
      const n = censure
        ? { pour: 0, abstention: 0, contre: p.pour, absent: p.membres - p.pour }
        : {
            pour: p.pour,
            abstention: p.abstention,
            contre: p.contre,
            absent: Math.max(0, p.membres - p.pour - p.abstention - p.contre)
          };
      for (const v of ['pour', 'abstention', 'contre', 'absent'] as Vote[])
        for (let i = 0; i < n[v]; i++) out.push({ vote: v, groupe: p });
    }
    return out;
  });

  // Secteur de chaque groupe : angles du premier et du dernier siège, pour l'arc d'identité.
  const secteurs = $derived.by(() => {
    const m = new Map<string, { groupe: PositionGroupe; min: number; max: number; n: number }>();
    attribution.forEach((a, i) => {
      const s = places[i];
      if (!s) return;
      const ang = Math.atan2(s.y, s.x);
      const e = m.get(a.groupe.groupe_id) ?? { groupe: a.groupe, min: ang, max: ang, n: 0 };
      e.min = Math.min(e.min, ang);
      e.max = Math.max(e.max, ang);
      e.n++;
      m.set(a.groupe.groupe_id, e);
    });
    return [...m.values()];
  });

  // Coordonnées en centièmes du rayon (évite les polices minuscules dans le viewBox).
  const K = 100;
  const R = 1.05 * K;
  const arc = (a0: number, a1: number) =>
    `M ${R * Math.cos(a1)} ${-R * Math.sin(a1)} A ${R} ${R} 0 0 1 ${R * Math.cos(a0)} ${-R * Math.sin(a0)}`;
</script>

<svg viewBox="-122 -120 244 128" role="img" aria-label="Hémicycle : vote de chaque groupe">
  {#each secteurs as sct (sct.groupe.groupe_id)}
    {@const mi = (sct.min + sct.max) / 2}
    <path
      d={arc(sct.min - 0.01, sct.max + 0.01)}
      class="arc"
      style:stroke={couleurs[sct.groupe.sigle] ?? 'var(--gris)'}
    />
    {#if sct.n >= 24}
      <text
        class="sigle"
        x={1.12 * K * Math.cos(mi)}
        y={-1.12 * K * Math.sin(mi)}
        text-anchor={Math.cos(mi) > 0.25 ? 'start' : Math.cos(mi) < -0.25 ? 'end' : 'middle'}
        >{sct.groupe.sigle}</text
      >
    {/if}
  {/each}
  {#each attribution as a, i (i)}
    {@const s = places[i]}
    {#if s}
      <circle
        cx={(s.x * K).toFixed(1)}
        cy={(-s.y * K).toFixed(1)}
        r={(r * K).toFixed(2)}
        class="siege {a.vote}"
      />
    {/if}
  {/each}
</svg>

<style>
  svg {
    width: 100%;
    max-width: 640px;
    display: block;
    overflow: visible;
  }
  .siege.pour {
    fill: var(--vo-pour);
  }
  .siege.contre {
    fill: var(--vo-contre);
  }
  .siege.abstention {
    fill: var(--vo-abstention);
  }
  .siege.absent {
    fill: none;
    stroke: var(--gris);
    stroke-width: 0.45;
  }
  .arc {
    fill: none;
    stroke-width: 3;
    stroke-linecap: butt;
  }
  .sigle {
    font-size: 5.8px;
    font-weight: 700;
    fill: var(--ardoise);
    dominant-baseline: middle;
  }
</style>
