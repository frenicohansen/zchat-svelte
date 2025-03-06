<script lang='ts'>
  import { Button } from '$lib/components/ui/button'
  import ChevronDown from 'lucide-svelte/icons/chevron-down'
  import { fade } from 'svelte/transition'

  // eslint-disable-next-line prefer-const
  let { visible, scrollToBottom }: { visible: boolean, scrollToBottom: () => void } = $props()
</script>

{#if visible}
  <div
    class='absolute inset-x-0 -top-10 z-10 m-auto flex w-fit items-center justify-center'
    in:fade|local={{ duration: 150 }}
    out:fade|local={{ duration: 150 }}
  >
    <Button
      onclick={scrollToBottom}
      size='icon'
      class='size-6 rounded-full shadow-md bg-primary/90 text-gray-300 dark:text-gray-500 hover:bg-primary'
    >
      <ChevronDown class='!size-3' />
      <span class='sr-only'>Scroll to bottom</span>
    </Button>
  </div>
{/if}
