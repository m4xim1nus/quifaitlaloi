<script lang="ts">
  // Thèmes d'une loi (classement du Sénat), les plus spécifiques d'abord.
  let { themes, max = 2 }: { themes: string[]; max?: number } = $props();
</script>

{#if themes.length}
  <span class="themes" title={themes.join(', ')}>
    {#each themes.slice(0, max) as t (t)}<span class="theme">{t}</span>{/each}
  </span>
{/if}

<style>
  .themes {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 3px;
    vertical-align: 1px;
  }
  .theme {
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--ardoise);
    background: var(--puce);
    border-radius: 3px;
    padding: 0 6px;
    white-space: nowrap;
  }
</style>
