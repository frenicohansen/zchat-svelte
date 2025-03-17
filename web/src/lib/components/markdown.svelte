<script lang='ts'>
  import { highlighter } from '$lib/shiki'
  import DOMPurify from 'dompurify'
  import { Marked } from 'marked'
  import markedShiki from 'marked-shiki'
  import morphdom from 'morphdom'

  // eslint-disable-next-line prefer-const
  let { content = '', class: className }: { content: string, class?: string }
    = $props()
  let container = $state<HTMLDivElement | null>(null)
  let isLoading = $state(true)

  $effect(() => {
    new Marked()
      .use(
        { gfm: true },
        markedShiki({
          async highlight(code, lang) {
            try {
              const { bundledLanguages } = await import('shiki/langs')
              const importFn = (bundledLanguages as any)[lang]
              if (importFn) {
                await highlighter.loadLanguage(lang || '', importFn)
                return highlighter.current.codeToHtml(code, {
                  lang,
                  theme: 'github-dark',
                })
              }
            }
            catch {
              console.warn(`Failed to highlight code with language: ${lang}`)
            }
            return highlighter.current.codeToHtml(code, {
              lang: 'text',
              theme: 'github-dark',
            })
          },
        }),
      )
      .parse(content, { async: true })
      .then((html) => {
        if (!container)
          return

        morphdom(
          container,
          `<div>${DOMPurify.sanitize(html, { FORCE_BODY: true })}</div>`,
          { childrenOnly: true },
        )

        isLoading = false
      })
  })
</script>

<div class={className} bind:this={container}>
  {#if isLoading}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html DOMPurify.sanitize(new Marked().parse(content, { async: false }))}
  {/if}
</div>
