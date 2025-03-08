<script lang='ts'>
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import ShareLayout from '$lib/components/layout/share-layout.svelte'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import { useCurrentConversation, useStreamingMessages } from '$lib/hooks/use-conversation.svelte'
  import { z } from '$lib/zero'
  import DOMPurify from 'dompurify'
  import { Bot } from 'lucide-svelte'
  import { marked } from 'marked'

  const streaming = $derived(useStreamingMessages(page.params.id))
  const conversationSignal = $derived(useCurrentConversation(page.params.id))

  $effect(() => {
    const isOwner = conversationSignal.data?.userId === z.current.userID
    const isPublicWrite = conversationSignal.data?.accessLevel === 'public_write'

    if (isOwner || isPublicWrite) {
      goto(`/chat/${page.params.id}`)
    }
  })

</script>

<svelte:head>
  <title>
    {conversationSignal.data?.title ?? 'Zero Chat - Offline First ChatGPT'}
  </title>
</svelte:head>

<ShareLayout conversation={conversationSignal.data}>
  <div class='flex flex-col items-center h-full '>
    <ScrollArea
      type='auto'
      orientation='vertical'
      class='size-full'
    >
      <div class='flex flex-col items-center gap-8 h-full py-8'>
        {#if streaming.messages && streaming.messages.length > 0}
          {#each streaming.messages as message (message.id)}
            {#if message.sender === 'assistant'}
              <div class='flex justify-start w-full max-w-4xl px-8 lg:px-4'>
                <div
                  class='rounded-lg px-4 py-2 max-w-[80%] bg-muted/50 text-foreground backdrop-blur-sm prose prose-stone dark:prose-invert'
                >
                  {#if !message.finalText?.length}
                    {#if message.isFinal}
                      <span class='text-destructive dark:text-red-400'>Error: Please try again.</span>
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
                    {/* @ts-ignore */ null}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html DOMPurify.sanitize(marked.parse(message.finalText))}
                  {/if}
                </div>
              </div>
            {:else if message.sender === 'user'}
              <div class='flex justify-end w-full max-w-4xl px-8 lg:px-4'>
                <div
                  class='rounded-lg px-4 py-2 max-w-[80%] bg-primary text-primary-foreground prose prose-stone dark:prose-invert'
                >
                  {/* @ts-ignore */ null}
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html DOMPurify.sanitize(marked.parse(message.finalText))}
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
    </ScrollArea>
  </div>
</ShareLayout>
