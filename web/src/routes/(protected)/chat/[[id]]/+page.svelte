<script lang='ts'>
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import SidebarLayout from '$lib/components/layout/sidebar-layout.svelte'
  import Markdown from '$lib/components/markdown.svelte'
  import ScrollToBottom from '$lib/components/scroll-to-bottom.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import { StreamingMessagesManager } from '$lib/hooks/streaming.svelte'
  import { useScrollingChat } from '$lib/hooks/use-scrolling-chat.svelte'
  import { z } from '$lib/zero'
  import { createQuery } from '$lib/zero-svelte'
  import { Bot } from 'lucide-svelte'
  import SendHorizontal from 'lucide-svelte/icons/send-horizontal'
  import { tick } from 'svelte'

  const conversation = createQuery(() => z.current.query.conversations.where('id', page.params.id ?? null).one())
  const streamingManager = new StreamingMessagesManager(() => page.params.id)

  let sendOnEnter = $state(true)
  let scrollContainerRef = $state<HTMLDivElement | null>(null)
  const scrollingChat = useScrollingChat(
    () => page.params.id,
    () => scrollContainerRef,
  )

  $effect(() => {
    const isOwner = conversation?.current?.userId === z.current.userID
    const isPublicRead = conversation?.current?.accessLevel === 'public_read'

    if (!isOwner && isPublicRead) {
      goto(`/share/${page.params.id}`)
    }

    tick().then(() => {
      if (page.params.id) {
        scrollingChat.scrollToBottom()
      }
    })
  })

  function handleTextareaKeydown(e: KeyboardEvent) {
    const isEnterKey = e.key === 'Enter'
    const isModifierKey = e.metaKey || e.ctrlKey
    const hasNewline = streamingManager.prompt.includes('\n')

    if (!isEnterKey)
      return

    if (sendOnEnter && !e.shiftKey && (!hasNewline || isModifierKey)) {
      e.preventDefault()
      streamingManager.handleSubmit()
    }
    else if (!sendOnEnter && isModifierKey) {
      e.preventDefault()
      streamingManager.handleSubmit()
    }
  }
</script>

<svelte:head>
  <title>
    {conversation?.current?.title ?? 'Zero Chat - Offline First ChatGPT'}
  </title>
</svelte:head>

<SidebarLayout
  conversation={conversation?.current ?? null}
  bind:followMessage={scrollingChat.followMessage}
  bind:sendOnEnter
>
  <div class='flex flex-col items-center h-full'>
    <ScrollArea
      bind:refViewport={scrollContainerRef}
      onscroll={scrollingChat.handleScroll}
      type='auto'
      orientation='vertical'
      class='size-full'
    >
      <div class='flex flex-col items-center gap-8 h-full py-8'>
        {#if streamingManager.streamingMessages && streamingManager.streamingMessages.length > 0}
          {#each streamingManager.streamingMessages as message (message.id)}
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
    </ScrollArea>
    <div
      class='flex w-full max-w-4xl bg-background flex-col items-center justify-end rounded-t-lg pb-4 px-8 lg:px-4'
    >
      <form
        class='focus-within:border-ring/20 flex relative w-full flex-wrap items-end rounded-lg border px-2.5 shadow-sm transition-colors ease-in'
        onsubmit={streamingManager.handleSubmit}
      >
        <ScrollToBottom
          visible={scrollingChat.showScrollButton}
          scrollToBottom={scrollingChat.scrollToBottom}
        />
        <textarea
          class='bg-background placeholder:text-muted-foreground resize-none flex min-h-28 outline-none flex-grow px-3 py-4 text-base disabled:cursor-not-allowed disabled:opacity-50 md:text-sm max-h-40'
          placeholder='Write a message...'
          bind:value={streamingManager.prompt}
          onkeydown={handleTextareaKeydown}
        ></textarea>
        <Button class='my-2.5' variant='default' size='icon' type='submit'>
          <SendHorizontal class='w-4 h-4' />
        </Button>
      </form>
    </div>
  </div>
</SidebarLayout>
