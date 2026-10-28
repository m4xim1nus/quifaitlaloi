<script lang="ts">
  import type { Snippet } from 'svelte';
  let { valeur = $bindable(false), children }: { valeur: boolean; children: Snippet } = $props();
</script>

<label class="interrupteur">
  <input type="checkbox" role="switch" bind:checked={valeur} />
  <span class="piste" aria-hidden="true"></span>
  <span>{@render children()}</span>
</label>

<style>
  .interrupteur {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 0.9375rem;
  }
  input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  .piste {
    width: 34px;
    height: 20px;
    border-radius: 999px;
    background: var(--filet);
    position: relative;
    flex: none;
    transition: background 0.15s;
  }
  .piste::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--papier);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
    transition: transform 0.15s;
  }
  input:checked + .piste {
    background: var(--encre);
  }
  input:checked + .piste::after {
    transform: translateX(14px);
  }
  input:focus-visible + .piste {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }
</style>
