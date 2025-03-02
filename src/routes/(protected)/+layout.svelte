<script lang='ts'>
  import { Toaster } from '$lib/components/ui/sonner'
  import { initMiniSearch } from '$lib/utils'
  import { initZ } from '$lib/zero'

  const { children } = $props()

  async function setup() {
    return Promise.all([
      initZ(),
      initMiniSearch(),
    ])
  }
</script>

<Toaster />
{#await setup() then}
  {@render children?.()}
{/await}
