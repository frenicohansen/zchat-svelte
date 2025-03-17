<script lang='ts'>
  import { page } from '$app/state'
  import MessagesContainer from '$lib/components/messages-container.svelte'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import { StreamingMessagesManager } from '$lib/hooks/streaming.svelte'
  import { highlighter } from '$lib/shiki'
  import { z } from '$lib/zero'
  import { Query } from '$lib/zero-svelte'
  import { onDestroy } from 'svelte'

  const conversation = new Query(() => z.current.query.conversations.where('id', page.params.id).one())
  const streamingManager = new StreamingMessagesManager(() => page.params.id)

  onDestroy(() => {
    highlighter.close()
  })
</script>

<svelte:head>
  <title>
    {conversation?.current?.title ?? 'Zero Chat - Offline First ChatGPT'}
  </title>
</svelte:head>

<Sidebar.Provider open={false} class='h-screen'>
  <Sidebar.Inset>
    <header class='flex h-16 shrink-0 items-center gap-2 sticky top-0 bg-background z-50'>
      <div class='flex flex-1 items-center justify-between px-4'>
        <div class='flex items-center gap-2'>
          <div class='flex-1 mr-4'>
            <h1 class='text-lg'>
              {conversation.current?.title || 'Chat'}
            </h1>
          </div>
        </div>
      </div>
    </header>
    <main class='h-full overflow-hidden'>
      <div class='flex flex-col items-center h-full '>
        <ScrollArea
          type='auto'
          orientation='vertical'
          class='size-full'
        >
          <MessagesContainer messages={streamingManager.streamingMessages} />
        </ScrollArea>
      </div>
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
