<script lang='ts'>
  import { Toaster } from '$lib/components/ui/sonner'
  import { initZ } from '$lib/zero'
  import '../app.pcss'

  const { children } = $props()
</script>

<Toaster />

{#await initZ()}
  <div>Loading...</div>
{:then}
  {@render children?.()}
{/await}
