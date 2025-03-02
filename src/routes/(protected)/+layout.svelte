<script lang='ts'>
  import { Toaster } from '$lib/components/ui/sonner'
  import { initMiniSearch } from '$lib/utils'

  const { children } = $props()
</script>

<Toaster />
{#await initMiniSearch() then}
  {@render children?.()}
{/await}
