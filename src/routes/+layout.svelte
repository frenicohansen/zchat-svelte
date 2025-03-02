<script lang='ts'>
  import { initZ } from '$lib/zero'
  import '../app.pcss'

  const { children } = $props()
</script>

{#await initZ() then}
  {@render children?.()}
{/await}
