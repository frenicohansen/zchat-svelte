import type { Message } from '$lib/db/zero-schema'
import { goto } from '$app/navigation'
import { PUBLIC_BACKEND_URL } from '$env/static/public'
import { z } from '$lib/zero'
import { Query } from 'zero-svelte'

export function useStreamingMessages(conversationId: string | undefined) {
  let prompt = $state('')
  const handleSubmit = () => {
    if (!prompt.trim())
      return

    const backendUrl = PUBLIC_BACKEND_URL.replace(/\/$/, '')
    fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: conversationId ?? null,
        message: prompt,
      }),
      credentials: 'include',
    })
      .then(response => response.json())
      .then((body) => {
        prompt = ''
        if (!conversationId) {
          goto(`/chat/${body.conversationId}`)
        }
      })
  }

  let processingMessageId: number | null = $state(null)

  const messageChunks = $derived(processingMessageId
    ? new Query(z.current.query.messageChunks.where('messageId', processingMessageId).orderBy('chunkIndex', 'asc'))
    : null)

  const existingMessages = $derived(conversationId
    ? new Query(
      z.current.query.messages
        .where('conversationId', conversationId)
        .orderBy('updatedAt', 'asc'),
    )
    : null)

  let streamingMessages: Message[] = $state([])

  $effect(() => {
    const messages = existingMessages?.current
    if (!messages || !messages.length) {
      streamingMessages = []
      return
    }

    const last = messages[messages.length - 1]
    const processingMessage
    = last.sender === 'assistant' && !last.isFinal
      ? last
      : null

    if (!processingMessage) {
      streamingMessages = messages
      return
    }

    processingMessageId = processingMessage.id

    const chunks = messageChunks?.current
    if (!chunks || !chunks.length) {
      streamingMessages = messages
      return
    }

    const joinedChunks = chunks
      .map(chunk => chunk.content)
      .join('')

    streamingMessages = [
      ...messages.filter(msg => msg.id !== processingMessage.id),
      { ...processingMessage, finalText: joinedChunks },
    ]
  })

  return {
    get messages() { return streamingMessages },
    get prompt() { return prompt },
    set prompt(value: string) { prompt = value },
    handleSubmit,
  }
}
