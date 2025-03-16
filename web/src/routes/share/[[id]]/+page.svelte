<script lang='ts'>
  import { page } from '$app/state'
  import ShareLayout from '$lib/components/layout/share-layout.svelte'
  import MessagesContainer from '$lib/components/messages-container.svelte'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import { StreamingMessagesManager } from '$lib/hooks/streaming.svelte'
  import { z } from '$lib/zero'
  import { createQuery } from '$lib/zero-svelte'

  const conversation = createQuery(() => z.current.query.conversations.where('id', page.params.id ?? null).one())
  const streamingManager = new StreamingMessagesManager(() => page.params.id)
</script>

<svelte:head>
  <title>
    {conversation?.current?.title ?? 'Zero Chat - Offline First ChatGPT'}
  </title>
</svelte:head>

<ShareLayout conversation={conversation?.current ?? null}>
  <div class='flex flex-col items-center h-full '>
    <ScrollArea
      type='auto'
      orientation='vertical'
      class='size-full'
    >
      <MessagesContainer messages={streamingManager.streamingMessages} />
    </ScrollArea>
  </div>
</ShareLayout>
