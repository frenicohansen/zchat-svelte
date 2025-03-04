<script lang='ts'>
  import type { Conversation } from '$lib/db/zero-schema'
  import type { Snippet } from 'svelte'
  import * as Sidebar from '$lib/components/ui/sidebar'

  // eslint-disable-next-line prefer-const
  let { conversation, children }: { conversation: Conversation | null, children: Snippet | undefined } = $props()
</script>

<Sidebar.Provider open={false} class='h-screen'>
  <Sidebar.Inset>
    <header class='flex h-16 shrink-0 items-center gap-2 sticky top-0 bg-background z-50'>
      <div class='flex flex-1 items-center justify-between px-4'>
        <div class='flex items-center gap-2'>
          <div class='flex-1 mr-4'>
            <h1 class='text-lg'>
              {conversation?.title || 'Chat'}
            </h1>
          </div>
        </div>
      </div>
    </header>
    <main class='h-full overflow-hidden'>
      {@render children?.()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
