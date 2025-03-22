import { tick, untrack } from 'svelte'
import { StreamingMessagesManager } from './streaming.svelte'

export class ScrollingChatManager {
  followMessage = $state(true)
  scrollContainerRef: HTMLDivElement | null = $state(null)

  #streamingManager: StreamingMessagesManager
  #isScrollingUp = $state(false)
  #lastScrollTop = $state(0)
  #isBottom = $state(true)

  readonly #lastMessage = $derived.by(() => {
    const messages = this.#streamingManager.streamingMessages
    return messages.length > 0 ? messages[messages.length - 1] : null
  })

  constructor(conversationId: () => string | undefined) {
    this.#streamingManager = new StreamingMessagesManager(conversationId)

    $effect(() => {
      const _id = conversationId()
      this.#resetState()
    })

    $effect(() => {
      const _top = this.#lastScrollTop
      tick().then(() => {
        if (!this.scrollContainerRef) {
          this.#isBottom = true
          return
        }

        const threshold = 100
        const nearBottom = this.scrollContainerRef.scrollHeight - this.scrollContainerRef.scrollTop - this.scrollContainerRef.clientHeight < threshold

        this.#isBottom = nearBottom
      })
    })

    $effect(() => {
      if (!this.scrollContainerRef)
        return

      const lastMessage = this.#lastMessage
      const lastMessageByUser = lastMessage && lastMessage.sender === 'user'
      const isScrollingUpUntrack = untrack(() => this.#isScrollingUp)
      const messageNotFinal = lastMessage && !lastMessage.isFinal

      const shouldAutoScroll = lastMessageByUser || (this.followMessage && !isScrollingUpUntrack && this.#isBottom && messageNotFinal)

      if (shouldAutoScroll) {
        tick().then(() => this.scrollToBottom())
      }
    })
  }

  #resetState() {
    this.#isBottom = true
    this.#isScrollingUp = false
    this.#lastScrollTop = 0
  }

  handleScroll = () => {
    const ref = this.scrollContainerRef
    if (!ref)
      return

    const threshold = -30
    this.#isScrollingUp = ref.scrollTop - this.#lastScrollTop < threshold
    this.#lastScrollTop = ref.scrollTop
  }

  scrollToBottom = () => {
    const ref = this.scrollContainerRef
    if (!ref)
      return

    ref.scrollTo({
      top: ref.scrollHeight,
      behavior: 'smooth',
    })
  }

  get showScrollButton() { return !this.#isBottom }
}
