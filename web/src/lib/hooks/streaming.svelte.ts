import type { Message, MessageChunk } from '$lib/db/zero-schema'
import { goto } from '$app/navigation'
import { PUBLIC_BACKEND_URL } from '$env/static/public'
import { z } from '$lib/zero'
import { createQuery } from '$lib/zero-svelte'

export class StreamingMessagesManager {
  conversationId = $state<string>()
  prompt = $state('')

  streamingMessages = $derived.by(() => {
    const messages = this.#existingMessages.current
    const chunks = this.#messageChunks.current
    const newIncomingMessage = this.#newIncomingMessage
    if (!messages || !messages.length) {
      return []
    }
    else if (!newIncomingMessage || !chunks || !chunks.length) {
      return messages
    }

    const joinedChunks = chunks
      .map(chunk => chunk.content)
      .join('')

    return [
      ...messages.filter(msg => msg.id !== newIncomingMessage.id),
      { ...newIncomingMessage, finalText: joinedChunks },
    ]
  })

  #existingMessages: { current: Message[] | undefined }
  #messageChunks: { current: MessageChunk[] | undefined }
  #newIncomingMessage = $derived.by(() => {
    const messages = this.#existingMessages.current
    if (!messages || !messages.length) {
      return null
    }

    const last = messages[messages.length - 1]
    return last.sender === 'assistant' && !last.isFinal
      ? last
      : null
  })

  constructor(conversationId: () => string | undefined) {
    this.conversationId = conversationId()
    this.#existingMessages = createQuery(() =>
      z.current.query.messages
        .where('conversationId', this.conversationId ?? '')
        .orderBy('updatedAt', 'asc'))

    this.#messageChunks = createQuery(() =>
      z.current.query.messageChunks
        .where('messageId', this.#newIncomingMessage?.id ?? -1)
        .orderBy('chunkIndex', 'asc'))

    $effect(() => {
      this.conversationId = conversationId()
    })
  }

  handleSubmit = () => {
    if (!this.prompt.trim())
      return

    const backendUrl = PUBLIC_BACKEND_URL.replace(/\/$/, '')
    fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: this.conversationId ?? null,
        message: this.prompt,
      }),
      credentials: 'include',
    })
      .then(response => response.json())
      .then((body: ResponseBody) => {
        this.prompt = ''
        if (!this.conversationId) {
          goto(`/chat/${body.conversationId}`)
        }
      })
  }
}

interface ResponseBody {
  conversationId: string
  messageId: number
}
