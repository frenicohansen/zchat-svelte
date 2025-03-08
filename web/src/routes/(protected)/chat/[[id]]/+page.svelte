<script lang='ts'>
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import SidebarLayout from '$lib/components/layout/sidebar-layout.svelte'
  import ScrollToBottom from '$lib/components/scroll-to-bottom.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import { useStreamingMessages } from '$lib/hooks/use-streaming.svelte'
  import { z } from '$lib/zero'
  import DOMPurify from 'dompurify'
  import { Bot } from 'lucide-svelte'
  import SendHorizontal from 'lucide-svelte/icons/send-horizontal'
  import { marked } from 'marked'
  import { tick, untrack } from 'svelte'
  import { Query } from 'zero-svelte'

  const conversation = $derived(page.params.id
    ? new Query(z.current.query.conversations.where('id', page.params.id).one())
    : null)
  const streaming = $derived(useStreamingMessages(page.params.id))

  let sendOnEnter = $state(true)
  let scrollContainerRef = $state<HTMLDivElement | null>(null)
  let followMessage = $state(true)
  let showScrollButton = $state(false)
  let isScrollingUp = $state(false)
  let lastScrollTop = $state(0)

  function isBottom(scrollContainerRef: HTMLDivElement) {
    const threshold = 100
    return (scrollContainerRef.scrollHeight - scrollContainerRef.scrollTop - scrollContainerRef.clientHeight) < threshold
  }

  function handleScroll() {
    if (!scrollContainerRef)
      return

    showScrollButton = !isBottom(scrollContainerRef)
    isScrollingUp = scrollContainerRef.scrollTop < lastScrollTop
    lastScrollTop = scrollContainerRef.scrollTop
  }

  function scrollToBottom() {
    if (!scrollContainerRef)
      return

    scrollContainerRef.scrollTo({
      top: scrollContainerRef.scrollHeight,
      behavior: 'smooth',
    })

    showScrollButton = false
  }

  $effect(() => {
    const isOwner = conversation?.current?.userId === z.current.userID
    const isPublicRead = conversation?.current?.accessLevel === 'public_read'

    if (!isOwner && isPublicRead) {
      goto(`/share/${page.params.id}`)
    }

    isScrollingUp = false
    lastScrollTop = 0
    showScrollButton = false

    tick().then(() => {
      if (page.params.id) {
        scrollToBottom()
      }
    })
  })

  // Auto scroll requirements
  // v 1. When user first open a conversation, scroll to bottom
  // v 2. When user sends a message, scroll to bottom once after message is sent
  // v 3. When option enabled, follow message, scroll to bottom when new message is received
  // 4. When user scrolls up, disable follow message, only follow message aagain when user is at bottom
  // v 5. When user is not at bottom, show scroll to bottom button, else hide it

  $effect(() => {
    const lastMessage = streaming.messages[streaming.messages.length - 1]
    const lastMessageByUser = lastMessage && lastMessage.sender === 'user'
    const isScrollingUpUntrack = untrack(() => isScrollingUp)

    if (lastMessageByUser || (followMessage && !isScrollingUpUntrack && scrollContainerRef && isBottom(scrollContainerRef))) {
      tick().then(() => {
        scrollToBottom()
      })
    }
  })

  function handleTextareaKeydown(e: KeyboardEvent) {
    const isEnterKey = e.key === 'Enter'
    const isModifierKey = e.metaKey || e.ctrlKey
    const hasNewline = streaming.prompt.includes('\n')

    if (!isEnterKey)
      return

    if (sendOnEnter && !e.shiftKey && (!hasNewline || isModifierKey)) {
      e.preventDefault()
      streaming.handleSubmit()
    }
    else if (!sendOnEnter && isModifierKey) {
      e.preventDefault()
      streaming.handleSubmit()
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
  bind:followMessage
  bind:sendOnEnter
>
  <div class='flex flex-col items-center h-full'>
    <ScrollArea
      bind:refViewport={scrollContainerRef}
      onscroll={handleScroll}
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
    <div
      class='flex w-full max-w-4xl bg-background flex-col items-center justify-end rounded-t-lg pb-4 px-8 lg:px-4'
    >
      <form
        class='focus-within:border-ring/20 flex relative w-full flex-wrap items-end rounded-lg border px-2.5 shadow-sm transition-colors ease-in'
        onsubmit={streaming.handleSubmit}
      >
        <ScrollToBottom visible={showScrollButton} scrollToBottom={scrollToBottom} />
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
