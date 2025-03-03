import { goto } from '$app/navigation'
import { PUBLIC_BACKEND_URL } from '$env/static/public'
import { z } from '$lib/zero'
import { Query } from 'zero-svelte'

export const conversationId: { value: string | null } = $state({
  value: null,
})

export function useCurrentConversation() {
  const conversation = $derived(conversationId.value
    ? new Query(z.current.query.conversations.where('id', conversationId.value).one())
    : null)

  $inspect('update convo', conversation?.current)

  return {
    get id() { return conversationId.value },
    get data() { return conversation ? conversation?.current ? conversation.current : null : null },
  }
}

export function useStreamingMessages() {
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
        conversationId: conversationId.value ?? null,
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
        if (body.conversationId !== conversationId.value) {
          conversationId.value = body.conversation
          // TODO redirect after the conversation data is created
          goto(`/chat/${body.conversationId}`)
        }
      })
  }

  const existingMessages = $derived(conversationId.value
    ? new Query(
      z.current.query.messages
        .where('conversationId', conversationId.value)
        .orderBy('updatedAt', 'asc'),
    )
    : null)

  const responseMessageChunks = $derived(responseBody.messageId && responseBody.conversationId === conversationId.value
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
