<script lang='ts'>
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import SidebarLayout from '$lib/components/layout/sidebar-layout.svelte'
  import MessagesContainer from '$lib/components/messages-container.svelte'
  import ScrollToBottom from '$lib/components/scroll-to-bottom.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import { StreamingMessagesManager } from '$lib/hooks/streaming.svelte'
  import { useScrollingChat } from '$lib/hooks/use-scrolling-chat.svelte'
  import { miniSearch } from '$lib/utils'
  import { z } from '$lib/zero'
  import { createQuery } from '$lib/zero-svelte'
  import SendHorizontal from 'lucide-svelte/icons/send-horizontal'
  import { tick } from 'svelte'

  const conversations = createQuery(z.current.query.conversations.where('userId', z.current.userID).orderBy('updatedAt', 'desc').related('messages'))
  const conversation = $derived(conversations.current.find(c => c.id === page.params.id))

  const streamingManager = new StreamingMessagesManager(() => page.params.id)

  let sendOnEnter = $state(true)
  let scrollContainerRef = $state<HTMLDivElement | null>(null)
  let textareaRef = $state<HTMLTextAreaElement | null>(null)
  const scrollingChat = useScrollingChat(
    () => page.params.id,
    () => scrollContainerRef,
  )

  $effect(() => {
    conversations.current.forEach((conversation) => {
      miniSearch.instance.has(conversation.id)
        ? miniSearch.instance.replace(conversation)
        : miniSearch.instance.add(conversation)
    })
    miniSearch.debouncedSave()
  })

  $effect(() => {
    const isOwner = conversation?.userId === z.current.userID
    const isPublicRead = conversation?.accessLevel === 'public_read'

    if (!isOwner && isPublicRead) {
      goto(`/share/${page.params.id}`)
    }

    tick().then(() => {
      textareaRef?.focus()
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
    {conversation?.title ?? 'Zero Chat - Offline First ChatGPT'}
  </title>
</svelte:head>

<SidebarLayout
  conversation={conversation ?? null}
  conversations={conversations.current}
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
      <MessagesContainer messages={streamingManager.streamingMessages} />
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
          bind:this={textareaRef}
          onkeydown={handleTextareaKeydown}
        ></textarea>
        <Button class='my-2.5' variant='default' size='icon' type='submit'>
          <SendHorizontal class='w-4 h-4' />
        </Button>
      </form>
    </div>
  </div>
</SidebarLayout>
