<script lang="ts">
  // Barre de majorité : les voix de chaque groupe, empilées, face à la majorité requise. Le
  // groupe décisif hors socle est souligné, et son contre-factuel écrit en clair.
  import { censureAvec, siContre } from '$lib/majorite';
  import { groupes } from '$lib/recit';
  import { entier } from '$lib/format';
  import type { PositionGroupe, ScrutinDetaille } from '$lib/types';

  let { s }: { s: ScrutinDetaille } = $props();

  const censure = $derived(s.objet === 'motion_censure');
  const decisifs = $derived(
    (s.signature?.pivots_hors_socle ?? [])
      .map((sigle) => s.positions.find((p) => p.sigle === sigle))
      .filter((p): p is PositionGroupe => !!p)
  );
  const echelle = $derived(
    censure ? Math.max(s.pour, s.requis) * 1.12 : Math.max(s.pour, s.contre, s.requis) * 1.08
  );
  const largeur = (n: number) => `${(100 * n) / echelle}%`;

  const rangees = $derived(
    censure
      ? [
          {
            cle: 'contre' as const,
            libelle: 'Pour la censure',
            total: s.pour,
            champ: 'pour' as const
          }
        ]
      : [
          {
            cle: 'pour' as const,
            libelle: s.objet === 'motion_rejet' ? 'Pour la motion' : 'Pour',
            total: s.pour,
            champ: 'pour' as const
          },
          {
            cle: 'contre' as const,
            libelle: s.objet === 'motion_rejet' ? 'Contre la motion' : 'Contre',
            total: s.contre,
            champ: 'contre' as const
          }
        ]
  );
</script>

<figure class="majorite">
  <figcaption class="visuellement-cache">
    Voix {censure ? 'pour la censure' : 'pour et contre'} par groupe, face à la majorité requise
  </figcaption>
  {#each rangees as r (r.cle)}
    <div class="rangee">
      <span class="libelle">{r.libelle} <span class="nombre total">{entier(r.total)}</span></span>
      <span class="piste">
        {#each s.positions.filter((p) => p[r.champ] > 0) as p (p.groupe_id)}
          {@const decisif = decisifs.some((d) => d.groupe_id === p.groupe_id) && r.champ === 'pour'}
          <span
            class="segment {r.cle}"
            class:decisif
            style:width={largeur(p[r.champ])}
            title="{p.sigle} : {p[r.champ]}"
          >
            {#if p[r.champ] / echelle > 0.055}<span class="sigle">{p.sigle}</span>{/if}
          </span>
        {/each}
        {#if censure}
          {#each decisifs as d (d.groupe_id)}
            <span
              class="segment fantome"
              style:width={largeur(d.membres - d.pour)}
              title="{d.sigle} : {d.membres - d.pour} membres qui n’ont pas voté la censure"
            >
              {#if (d.membres - d.pour) / echelle > 0.07}<span class="sigle">{d.sigle} ?</span>{/if}
            </span>
          {/each}
        {/if}
        {#if r.cle === 'pour' || censure}
          <span class="seuil" style:left={largeur(s.requis)}>
            <span class="seuil-texte petit" class:fin={s.requis / echelle > 0.6}
              >majorité requise&#8239;: {entier(s.requis)}</span
            >
          </span>
        {/if}
      </span>
    </div>
  {/each}

  {#if decisifs.length}
    <ul class="contrefactuels">
      {#each decisifs as d (d.groupe_id)}
        {#if censure}
          {@const c = censureAvec(s, d)}
          <li>
            Si {groupes([d.sigle])} avait voté la censure en bloc ({d.membres} députés)&#8239;: {entier(
              c.pour
            )} voix, {c.adoptee ? 'au-dessus' : 'en dessous'} des {entier(c.requis)} requises. Le Gouvernement
            {c.adoptee ? 'tombait' : 'restait en place'}.
          </li>
        {:else}
          {@const c = siContre(s, d)}
          <li>
            Si les {d.pour} députés {groupes([d.sigle]).replace('le groupe', 'du groupe')} qui ont voté
            pour avaient voté contre&#8239;: {entier(c.pour)} pour, {entier(c.contre)} contre. {s.objet ===
            'motion_rejet'
              ? `La motion ${c.adopte ? 'passait quand même' : 'était rejetée'}.`
              : `Le texte ${c.adopte ? 'passait quand même' : 'était rejeté'}.`}
          </li>
        {/if}
      {/each}
    </ul>
  {/if}
</figure>

<style>
  .majorite {
    margin: 22px 0 0;
    display: grid;
    gap: 10px;
  }
  .rangee {
    display: grid;
    grid-template-columns: 8.5rem 1fr;
    gap: 12px;
    align-items: center;
  }
  .libelle {
    font-weight: 700;
    font-size: 0.9375rem;
  }
  .total {
    font-weight: 500;
    margin-left: 4px;
  }
  .piste {
    position: relative;
    display: flex;
    gap: 2px;
    height: 30px;
    background: var(--plan);
    border-radius: var(--rayon);
  }
  .segment {
    height: 100%;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    min-width: 1px;
  }
  .segment.pour {
    background: var(--vo-pour);
  }
  .segment.contre {
    background: var(--vo-contre);
  }
  .segment.decisif {
    outline: 2px solid var(--encre);
    outline-offset: 1px;
    z-index: 1;
  }
  .segment.fantome {
    background: transparent;
    box-shadow: inset 0 0 0 1.5px var(--encre);
    background-image: repeating-linear-gradient(
      135deg,
      var(--vo-contre) 0 1.5px,
      transparent 1.5px 5px
    );
  }
  .sigle {
    font-size: 0.75rem;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
  }
  .fantome .sigle {
    color: var(--encre);
    background: var(--papier);
    padding: 0 3px;
    border-radius: 2px;
  }
  .seuil {
    position: absolute;
    top: -6px;
    bottom: -6px;
    border-left: 2px solid var(--encre);
  }
  .seuil-texte {
    position: absolute;
    bottom: 100%;
    left: -2px;
    white-space: nowrap;
    color: var(--ardoise);
    transform: translateX(-50%);
  }
  .seuil-texte.fin {
    transform: translateX(calc(-100% + 2px));
  }
  .contrefactuels {
    margin: 22px 0 0;
    padding-left: 1.1em;
    display: grid;
    gap: 6px;
  }
  @media (max-width: 640px) {
    .rangee {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
</style>
