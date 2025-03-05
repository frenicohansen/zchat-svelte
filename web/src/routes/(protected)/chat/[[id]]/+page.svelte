<script lang='ts'>
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import SidebarLayout from '$lib/components/layout/sidebar-layout.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import {
    conversationId,
    useCurrentConversation,
    useStreamingMessages,
  } from '$lib/hooks/use-conversation.svelte'
  import { z } from '$lib/zero'
  import DOMPurify from 'dompurify'
  import { Bot } from 'lucide-svelte'
  import SendHorizontal from 'lucide-svelte/icons/send-horizontal'
  import { marked } from 'marked'

  const conversationSignal = useCurrentConversation()
  const streaming = useStreamingMessages()

  $effect(() => {
    conversationId.value = page.params.id

    const isOwner = conversationSignal.data?.userId === z.current.userID
    const isPublicRead = conversationSignal.data?.accessLevel === 'public_read'

    if (!isOwner && isPublicRead) {
      goto(`/share/${page.params.id}`)
    }
  })

  function handleTextareaKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!streaming.prompt.includes('\n') || e.metaKey || e.ctrlKey) {
        streaming.handleSubmit()
        e.preventDefault()
      }
    }
  }
</script>

<svelte:head>
  <title>Zero Chat - Offline First ChatGPT</title>
</svelte:head>

<SidebarLayout conversation={conversationSignal.data}>
  <div class='flex flex-col items-center h-full'>
    <ScrollArea type='auto' orientation='vertical' class='size-full'>
      <div class='flex flex-col items-center gap-8 h-full py-8'>
        {#if streaming.messages && streaming.messages.length > 0}
          {#each streaming.messages as message (message.id)}
            {#if message.sender === 'assistant'}
              <div class='flex justify-start w-full max-w-4xl ai-message'>
                <div
                  class='rounded-lg px-4 py-2 max-w-[80%] bg-muted/50 text-foreground backdrop-blur-sm prose'
                >
                  {#if message.finalText?.length === 0}
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
                  {:else}
                    {/* @ts-ignore */ null}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html DOMPurify.sanitize(marked.parse(message.finalText.length ? message.finalText : '...'))}
                  {/if}
                </div>
              </div>
            {:else if message.sender === 'user'}
              <div class='flex justify-end w-full max-w-4xl'>
                <div
                  class='rounded-lg px-4 py-2 max-w-[80%] bg-primary text-primary-foreground prose'
                >
                  {message.finalText}
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
    <div
      class='flex w-full max-w-4xl bg-background flex-col items-center justify-end rounded-t-lg pb-4'
    >
      <form
        class='focus-within:border-ring/20 flex w-full flex-wrap items-end rounded-lg border px-2.5 shadow-sm transition-colors ease-in'
        onsubmit={streaming.handleSubmit}
      >
        <textarea
          class='bg-background placeholder:text-muted-foreground resize-none flex min-h-28 outline-none flex-grow px-3 py-4 text-base disabled:cursor-not-allowed disabled:opacity-50 md:text-sm max-h-40'
          placeholder='Write a message...'
          bind:value={streaming.prompt}
          onkeydown={handleTextareaKeydown}
        ></textarea>
        <Button class='my-2.5' variant='default' size='icon' type='submit'>
          <SendHorizontal class='w-4 h-4' />
        </Button>
      </form>
    </div>
  </div>
</SidebarLayout>

<style>
  .ai-message {
    :global(h1, h2, h3, h4, h5, h6, strong) {
      @apply text-foreground;
    }
  }
</style>
