<script lang="ts">
  // Lien vers la définition d'un chiffre ou d'une catégorie, sur la page Méthodologie.
  let { ancre, texte = 'Comment c’est compté' }: { ancre: string; texte?: string } = $props();
</script>

<a
  class="comment"
  href="/methodologie#{ancre}"
  aria-label={texte || 'Définition sur la page Méthodologie'}
  title="Définition sur la page Méthodologie">{texte}</a
>

<style>
  .comment {
    font-size: 0.8125rem;
    white-space: nowrap;
    color: var(--ardoise);
  }
  .comment::before {
    content: '';
    display: inline-block;
    width: 13px;
    height: 13px;
    margin-right: 4px;
    vertical-align: -2px;
    border: 1.5px solid currentColor;
    border-radius: 50%;
    background:
      radial-gradient(circle at 50% 30%, currentColor 1.2px, transparent 1.5px),
      linear-gradient(currentColor, currentColor) 50% 72% / 1.5px 5px no-repeat;
  }
</style>
