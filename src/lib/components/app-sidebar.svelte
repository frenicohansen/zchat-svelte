<script lang='ts'>
  import type { ComponentProps } from 'svelte'
  import { page } from '$app/state'
  import * as Avatar from '$lib/components/ui/avatar'
  import * as Button from '$lib/components/ui/button'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import { Bot, ChevronDown, LogOut, MessageSquarePlus, Search, Settings, User, X } from 'lucide-svelte'

  type Conversations = {
    id: number | null
    title: string
  }

  type AppSidebarProps = ComponentProps<typeof Sidebar.Root> & {
    conversations: Conversations[]
  }

  let { conversations, ref = $bindable(null), ...restProps }: AppSidebarProps = $props()
  const conversationId = $derived(Number(page.url.hash.slice(1)))
</script>

<Sidebar.Root {...restProps} bind:ref>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>
          <MessageSquarePlus class='mr-2 h-4 w-4' />
          <span>New Chat</span>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
    <form class='px-2 py-2'>
      <div class='relative'>
        <Search class='absolute left-2 top-2 h-4 w-4 text-muted-foreground' />
        <Sidebar.Input
          type='search'
          placeholder='Search conversations...'
          class='pl-8'
        />
      </div>
    </form>
  </Sidebar.Header>
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Chats</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#if conversations.length > 0}
            {#each conversations as conversation (conversation.id)}
              <Sidebar.MenuItem>
                <div class='flex w-full items-center'>
                  <Sidebar.MenuButton isActive={conversation.id === conversationId}>
                    {#snippet child({ props })}
                      <a href={`#${conversation.id}`} {...props}>
                        <Bot class='mr-2 h-4 w-4' />
                        <span class='truncate'>{conversation.title}</span>
                      </a>
                    {/snippet}
                  </Sidebar.MenuButton>
                  <Button.Root
                    variant='ghost'
                    size='icon'
                    class='h-8 w-8 opacity-0 group-hover/menu-item:opacity-100'
                  >
                    <X class='h-4 w-4' />
                    <span class='sr-only'>Delete</span>
                  </Button.Root>
                </div>
              </Sidebar.MenuItem>
            {/each}
          {:else}
            <div class='px-4 py-3 text-sm text-muted-foreground'>No conversations found</div>
          {/if}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Sidebar.MenuButton {...props}>
                <Avatar.Root class='mr-2 h-6 w-6'>
                  <Avatar.Fallback>JD</Avatar.Fallback>
                </Avatar.Root>
                <span>John Doe</span>
                <ChevronDown class='ml-auto h-4 w-4' />
              </Sidebar.MenuButton>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align='start' class='w-[--bits-dropdown-menu-anchor-width]'>
            <DropdownMenu.Item>
              <User class='mr-2 h-4 w-4' />
              <span>Profile</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              <Settings class='mr-2 h-4 w-4' />
              <span>Settings</span>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item>
              <LogOut class='mr-2 h-4 w-4' />
              <span>Log out</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
  <Sidebar.Rail />
</Sidebar.Root>
