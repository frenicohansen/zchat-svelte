import { tick, untrack } from 'svelte'
import { useStreamingMessages } from './use-streaming.svelte'

export function useScrollingChat(
  conversationId: string | undefined,
  scrollContainerRef: HTMLDivElement | null,
) {
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

  // Auto scroll requirements
  // 1. When user first open a conversation, scroll to bottom
  // 2. When user sends a message, scroll to bottom once after message is sent
  // 3. When option enabled, follow message, scroll to bottom when new message is received
  // 4. When user scrolls up, disable follow message, only follow message aagain when user is at bottom
  // 5. When user is not at bottom, show scroll to bottom button, else hide it

  const streaming = $derived(useStreamingMessages(conversationId))

  $effect(() => {
    const lastMessage = streaming.messages[streaming.messages.length - 1]
    const lastMessageByUser = lastMessage && lastMessage.sender === 'user'
    const isScrollingUpUntrack = untrack(() => isScrollingUp)

    if (scrollContainerRef) {
      showScrollButton = !isBottom(scrollContainerRef)
    }

    if (lastMessageByUser || (followMessage && !isScrollingUpUntrack && scrollContainerRef && isBottom(scrollContainerRef))) {
      tick().then(() => {
        scrollToBottom()
      })
    }
  })

  return {
    get followMessage() { return followMessage },
    set followMessage(value: boolean) { followMessage = value },
    get showScrollButton() { return showScrollButton },
    scrollToBottom,
    handleScroll,
  }
}
