import { tick, untrack } from 'svelte'
import { StreamingMessagesManager } from './streaming.svelte'

export function useScrollingChat(
  conversationId: () => string | undefined,
  scrollContainerRef: () => HTMLDivElement | null,
) {
  let followMessage = $state(true)
  let showScrollButton = $state(false)
  let isScrollingUp = $state(false)
  let lastScrollTop = $state(0)

  function resetState() {
    followMessage = true
    showScrollButton = false
    isScrollingUp = false
    lastScrollTop = 0
  }

  function isBottom(scrollContainerRef: HTMLDivElement) {
    const threshold = 100
    return (scrollContainerRef.scrollHeight - scrollContainerRef.scrollTop - scrollContainerRef.clientHeight) < threshold
  }

  function handleScroll() {
    const ref = scrollContainerRef()
    if (!ref)
      return

    const threshold = -30
    showScrollButton = !isBottom(ref)
    isScrollingUp = ref.scrollTop - lastScrollTop < threshold
    lastScrollTop = ref.scrollTop
  }

  function scrollToBottom() {
    const ref = scrollContainerRef()
    if (!ref)
      return

    ref.scrollTo({
      top: ref.scrollHeight,
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

  const streamingManager = new StreamingMessagesManager(conversationId)

  $effect(() => {
    const _id = conversationId()
    resetState()
  })

  $effect(() => {
    const lastMessage = streamingManager.streamingMessages[streamingManager.streamingMessages.length - 1]
    const lastMessageByUser = lastMessage && lastMessage.sender === 'user'
    const isScrollingUpUntrack = untrack(() => isScrollingUp)

    const ref = scrollContainerRef()
    if (ref) {
      showScrollButton = !isBottom(ref)
    }

    if (lastMessageByUser || (followMessage && !isScrollingUpUntrack && ref && isBottom(ref))) {
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
