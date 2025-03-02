<script lang='ts'>
  import { initMiniSearch } from '$lib/utils'

  const { children } = $props()
</script>

{#await initMiniSearch() then}
  {@render children?.()}
{/await}
