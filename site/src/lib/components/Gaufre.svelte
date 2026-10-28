<script lang="ts">
  // Petits multiples de la page Comparer : un carré = une loi, à la même taille d'une
  // législature à l'autre, rangés par catégorie (dans l'ordre donné) pour se lire comme des
  // parts. Décoratif pour les lecteurs d'écran : le tableau qui suit chaque gaufre donne les
  // mêmes comptes.
  interface Item {
    id: string;
    titre: string;
    couleur: string;
    /** Carré évidé, contour de la couleur (absence d'information : jamais un aplat). */
    creux?: boolean;
  }
  interface Props {
    items: Item[];
    colonnes?: number;
    taille?: number;
  }
  let { items, colonnes = 20, taille = 10 }: Props = $props();
  const pas = $derived(taille + 2);
</script>

<div class="gaufre" aria-hidden="true" style:max-width="{colonnes * pas}px">
  {#each items as it (it.id)}
    <a
      href="/lois/{it.id}"
      tabindex="-1"
      title={it.titre}
      style:width="{taille}px"
      style:height="{taille}px"
      style:background={it.creux ? 'var(--papier)' : it.couleur}
      style:box-shadow={it.creux ? `inset 0 0 0 1.5px ${it.couleur}` : undefined}
    ></a>
  {/each}
</div>

<style>
  .gaufre {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    align-content: flex-start;
  }
  a {
    display: block;
    border-radius: 2px;
  }
  a:hover {
    outline: 2px solid var(--encre);
    outline-offset: 1px;
  }
</style>
