<script lang="ts">
  // Un carré = une loi : le gabarit commun à tous les graphiques d'unités du site.
  interface Props {
    href: string;
    titre: string;
    couleur?: string;
    classe?: string;
    taille?: number;
  }
  let { href, titre, couleur, classe = '', taille = 12 }: Props = $props();
</script>

<a
  {href}
  class="carre {classe}"
  title={titre}
  aria-label={titre}
  style:background={couleur}
  style:width="{taille}px"
  style:height="{taille}px"
></a>

<style>
  .carre {
    display: inline-block;
    border-radius: 2px;
    flex: none;
  }
  .carre:hover {
    outline: 2px solid var(--encre);
    outline-offset: 1px;
  }
</style>
