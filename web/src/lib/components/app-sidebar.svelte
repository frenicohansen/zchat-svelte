<script lang='ts'>
  import type { Conversation } from '$lib/db/zero-schema'
  import type { ComponentProps } from 'svelte'
  import DeleteChat from '$lib/components/delete-chat.svelte'
  import SearchChat from '$lib/components/search-chat.svelte'
  import SidebarProfile from '$lib/components/sidebar-profile.svelte'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import { z } from '$lib/zero'
  import { Bot, MessageSquarePlus, Search } from 'lucide-svelte'

  type AppSidebarProps = ComponentProps<typeof Sidebar.Root> & {
    conversations: Conversation[]
    conversation: Conversation | null
  }

  let { conversations, conversation, ref = $bindable(null), ...restProps }: AppSidebarProps = $props()

  const personalConversations = $derived(
    conversations.filter(conversation =>
      conversation.userId === z.current.userID),
  )

  let showSearch = $state(false)
  function handleOpenSearch() {
    showSearch = true
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      showSearch = !showSearch
    }
  }
</script>

<svelte:document onkeydown={handleKeydown} />

<Sidebar.Root {...restProps} bind:ref>
  <Sidebar.Header>
    <Sidebar.Menu class='gap-2'>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>
          {#snippet child({ props })}
            <a href='/chat' {...props}>
              <MessageSquarePlus class='mr-2 h-4 w-4' />
              <span>New Chat</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton
          variant='outline'
          class='border-input hover:bg-background'
          onclick={handleOpenSearch}
        >
          <Search class='mr-2 h-4 w-4' />
          <span class='flex items-center justify-between w-full'>
            Search...
            <kbd
              class='bg-sidebar-accent text-sidebar-foreground pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100'
            >
              <span class='text-xs'>⌘</span>K
            </kbd>
          </span>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <ScrollArea type='auto' orientation='vertical'>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Chats</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#if personalConversations.length > 0}
              {#each personalConversations as personalConversation (personalConversation.id)}
                <Sidebar.MenuItem>
                  <div class='flex w-full items-center'>
                    <Sidebar.MenuButton isActive={personalConversation.id === conversation?.id}>
                      {#snippet child({ props })}
                        <a href={`/chat/${personalConversation.id}`} {...props}>
                          <Bot class='mr-2 h-4 w-4' />
                          <span class='truncate'>{personalConversation.title}</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>
                    <DeleteChat conversationId={personalConversation.id} />
                  </div>
                </Sidebar.MenuItem>
              {/each}
            {:else}
              <div class='px-4 py-3 text-sm text-muted-foreground'>No conversations found</div>
            {/if}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </ScrollArea>
  </Sidebar.Content>
  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <SidebarProfile />
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
  <Sidebar.Rail />
</Sidebar.Root>
<SearchChat bind:open={showSearch} />
