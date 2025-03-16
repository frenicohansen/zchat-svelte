<script lang='ts'>
  import type { Message } from '$lib/db/zero-schema'
  import Markdown from '$lib/components/markdown.svelte'
  import { Bot } from 'lucide-svelte'

  // eslint-disable-next-line prefer-const
  let { messages }: { messages: Message[] } = $props()
</script>

<div class='flex flex-col items-center gap-8 h-full pt-8 pb-16'>
  {#if messages.length > 0}
    {#each messages as message (message.id)}
      {#if message.sender === 'assistant'}
        <div class='flex justify-start w-full max-w-4xl px-8 lg:px-4'>
          <div class='rounded-lg px-4 py-2 max-w-[80%] bg-muted/50 backdrop-blur-sm'>
            {#if !message.finalText?.length}
              {#if message.isFinal}
                <span class='prose text-destructive dark:text-red-400'>
                  Error: Please try again.
                </span>
              {:else}
                <div
                  class='animate-pulse inline-block size-1 bg-gray-400 rounded-full mr-0.5'
                ></div>
                <div
                  class='animate-pulse inline-block size-1 bg-gray-400 rounded-full mr-0.5'
                  style='animation-delay: 0.2s'
                ></div>
                <div
                  class='animate-pulse inline-block size-1 bg-gray-400 rounded-full'
                  style='animation-delay: 0.4s'
                ></div>
              {/if}
            {:else}
              <Markdown
                class='prose prose-stone dark:prose-invert'
                content={message.finalText}
              />
            {/if}
          </div>
        </div>
      {:else if message.sender === 'user'}
        <div class='flex justify-end w-full max-w-4xl px-8 lg:px-4'>
          <div class='rounded-lg px-4 py-2 max-w-[80%] bg-primary'>
            <Markdown
              class='prose prose-invert text-primary-foreground dark:prose-neutral'
              content={message.finalText ?? ''}
            />
          </div>
        </div>
      {/if}
    {/each}
  {:else}
    <div class='flex h-full items-center justify-center'>
      <div class='text-center'>
        <div
          class='inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4'
        >
          <Bot class='h-6 w-6 text-primary' />
        </div>
        <h3 class='text-lg font-semibold'>Welcome to ZChat</h3>
        <p class='text-muted-foreground'>
          Start a conversation by typing a message below.
        </p>
      </div>
    </div>
  {/if}
</div>
