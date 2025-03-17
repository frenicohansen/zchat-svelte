<script lang='ts'>
  import type { MarkedExtension } from 'marked'
  import Code from '$lib/components/markdown/code.svelte'
  import SvelteMarkdown from 'svelte-marked'

  // eslint-disable-next-line prefer-const
  let { content = '', class: className }: { content: string, class?: string }
    = $props()

  const markedOptions: MarkedExtension = {
    gfm: true,
  }

  const markedRenderers = {
    code: Code,
  }
</script>

<div class={className}>
  {/* @ts-ignore */ null}
  <SvelteMarkdown
    source={content}
    options={markedOptions}
    renderers={markedRenderers}
  />
</div>
