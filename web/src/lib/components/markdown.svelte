<script lang='ts'>
  import DOMPurify from 'dompurify'
  import { marked } from 'marked'
  import morphdom from 'morphdom'

  // eslint-disable-next-line prefer-const
  let { content = '', class: className }: { content: string, class?: string } = $props()
  let container = $state<HTMLDivElement | null>(null)

  $effect(() => {
    if (!container)
      return

    const html = marked.parse(content, { async: false })
    morphdom(
      container,
      `<div>${DOMPurify.sanitize(html)}</div>`,
      { childrenOnly: true },
    )
  })

</script>

<div class={className} bind:this={container}></div>
