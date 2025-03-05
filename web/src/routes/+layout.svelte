<script lang='ts'>
  import { Toaster } from '$lib/components/ui/sonner'
  import { ModeWatcher } from 'mode-watcher'
  import '../app.pcss'

  const { children } = $props()
</script>

<svelte:head>
  <title>Zero Chat</title>
</svelte:head>

<Toaster />
<ModeWatcher />
{@render children?.()}
