import { goto } from '$app/navigation'
import { page } from '$app/state'
import { PUBLIC_BACKEND_URL } from '$env/static/public'
import { z } from '$lib/zero'
import { Query } from 'zero-svelte'

export function useCurrentConversation() {
  // TODO need to be set from src/routes/chat/[[id]]/+page.svelte
  const conversationId = $derived(page.params.id)
  const conversation = $derived(conversationId
    ? new Query(z.current.query.conversations.where('id', conversationId).one())
    : null)

  return {
    get id() { return conversationId },
    get data() { return conversation ? conversation?.current ? conversation.current : null : null },
  }
}

export function useStreamingMessages() {
  // TODO need to be set from src/routes/chat/[[id]]/+page.svelte
  const conversationId = $derived(page.params.id)
  let responseBody: { conversationId?: string, messageId?: number } = $state({})
  let prompt = $state('')

  const handleSubmit = () => {
    if (!prompt.trim())
      return

    fetch(`${PUBLIC_BACKEND_URL}/chat`, {
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
        responseBody = {
          conversationId: body.conversationId,
          messageId: Number(body.messageId),
        }

        prompt = ''
        if (body.conversationId !== conversationId)
          goto(`/chat/${body.conversationId}`)
      })
  }

  const existingMessages = $derived(conversationId
    ? new Query(
      z.current.query.messages
        .where('conversationId', conversationId)
        .orderBy('updatedAt', 'asc'),
    )
    : null)

  const responseMessageChunks = $derived(responseBody.messageId && responseBody.conversationId === conversationId
    ? new Query(
      z.current.query.messageChunks
        .where('messageId', responseBody.messageId)
        .orderBy('chunkIndex', 'asc'),
    )
    : null)

  const streamingMessages = $derived.by(() => {
    const messages = existingMessages?.current
    if (!messages || !messages.length)
      return []

    const chunks = responseMessageChunks?.current
    if (!chunks || !chunks.length)
      return messages

    const lastMessage = messages[messages.length - 1]
    const isProcessingAssistantMessage
      = lastMessage?.sender === 'assistant'
        && !messages.find(msg => msg.id === responseBody.messageId)?.isFinal

    if (isProcessingAssistantMessage && chunks) {
      const joinedChunks = chunks
        .map(chunk => chunk.content)
        .join('')

      return [
        ...messages.slice(0, -1),
        { ...lastMessage, finalText: joinedChunks },
      ]
    }

    return messages
  })

  return {
    get messages() { return streamingMessages },
    get prompt() { return prompt },
    set prompt(value: string) { prompt = value },
    handleSubmit,
  }
}
