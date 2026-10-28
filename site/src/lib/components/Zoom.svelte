<script lang="ts">
  // Un récit inséré dans le fil d'une législature (cycle Fiches) : titre, accroche, lien.
  import type { Zoom } from '$lib/server/recits';

  let { zoom }: { zoom: Zoom } = $props();
</script>

<aside class="zoom">
  <span class="sur petit">Zoom</span>
  <a class="titre" href="/lois/{zoom.loi}">{zoom.titre}</a>
  <!-- texte échappé par lib/markdown avant mise en forme -->
  <p>{@html zoom.accroche}</p>
  <a class="lire petit" href="/lois/{zoom.loi}">Lire le récit →</a>
</aside>

<style>
  .zoom {
    display: grid;
    gap: 6px;
    max-width: 44rem;
    padding: 14px 18px;
    border-left: 4px solid var(--encre);
    background: var(--puce);
    border-radius: 0 var(--rayon) var(--rayon) 0;
  }
  .sur {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: var(--ardoise);
  }
  .titre {
    font-family: var(--serif);
    font-size: 1.375rem;
    line-height: 1.25;
    color: var(--encre);
  }
  p {
    margin: 0;
  }
</style>
