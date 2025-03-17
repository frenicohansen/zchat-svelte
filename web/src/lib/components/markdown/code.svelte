<script lang='ts'>
  import { highlighter } from '$lib/shiki'
  import Copy from 'lucide-svelte/icons/copy'
  import { toast } from 'svelte-sonner'

  // eslint-disable-next-line prefer-const
  let { lang, text }: { lang: string, text: string } = $props()

  async function highlight(lang: string, text: string) {
    try {
      const { bundledLanguages } = await import('shiki/langs')
      const importFn = (bundledLanguages as any)[lang]
      if (importFn) {
        await highlighter.loadLanguage(lang || '', importFn)
        return highlighter.current.codeToTokens(text, {
          lang,
          theme: 'slack-dark',
        })
      }
    }
    catch {
      console.warn(`Failed to highlight code with language: ${lang}`)
    }
    return highlighter.current.codeToTokens(text, {
      lang: 'text',
      theme: 'slack-dark',
    })
  }

  function handleCopy() {
    navigator.clipboard.writeText(text)
    toast.success('Code copied to clipboard.')
  }
</script>

<div class='relative mt-2 flex w-full flex-col'>
  <div
    class='flex w-full items-center justify-between rounded-t bg-neutral-800 px-4 py-2 text-sm text-neutral-300'
  >
    <span class='font-mono'>{lang.length ? lang : 'text'}</span>
    <button
      aria-label='Copy code to clipboard'
      onclick={handleCopy}
    >
      <Copy class='size-4' />
    </button>
  </div>
  {#await highlight(lang, text)}
    <pre class='mt-0 rounded-t-none'><code>{text}</code></pre>
  {:then t}
    <pre class='mt-0 rounded-t-none'><code>{#each t.tokens as token}<span class='line'>{#each token as { content, color }}<span style:color>{content}</span>{/each}</span>
{/each}</code
  ></pre>
  {/await}
</div>
