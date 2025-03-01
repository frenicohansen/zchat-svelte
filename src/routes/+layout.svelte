<script lang='ts'>
  import { Toaster } from '$lib/components/ui/sonner'
  import '../app.pcss'

  const { children } = $props()
</script>

<Toaster />

{@render children?.()}
