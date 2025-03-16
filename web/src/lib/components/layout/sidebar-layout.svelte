<script lang='ts'>
  import type { Conversation } from '$lib/db/zero-schema'
  import type { Snippet } from 'svelte'
  import DeleteChat from '$lib/components/delete-chat.svelte'
  import SearchChat from '$lib/components/search-chat.svelte'
  import SettingChat from '$lib/components/setting-chat.svelte'
  import ShareDialog from '$lib/components/share-dialog.svelte'
  import SidebarProfile from '$lib/components/sidebar-profile.svelte'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import * as Select from '$lib/components/ui/select'
  import { Separator } from '$lib/components/ui/separator'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import { MessageSquare, MessageSquarePlus, Search } from 'lucide-svelte'

  const aiModels = [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', enabled: true },
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet', enabled: false },
    { value: 'deepseek-r1', label: 'DeepSeek R1', enabled: false },
  ]

  interface SidebarLayoutProps {
    conversation: Conversation | null
    conversations: Conversation[]
    followMessage?: boolean
    sendOnEnter?: boolean
    children?: Snippet
  }

  let {
    conversation,
    conversations,
    followMessage = $bindable(false),
    sendOnEnter = $bindable(true),
    children,
  }: SidebarLayoutProps = $props()

  let selectModel = $state('gemini-2.0-flash')

  const triggerContent = $derived(
    aiModels.find(model => model.value === selectModel)?.label ?? 'Select a model',
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

<Sidebar.Provider class='h-svh'>
  <Sidebar.Root class='select-none' variant='inset'>
    <Sidebar.Header>
      <Sidebar.Menu class='gap-2'>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton>
            {#snippet child({ props })}
              <a href='/chat' draggable='false' {...props}>
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
              {#if conversations.length > 0}
                {#each conversations as personalConversation (personalConversation.id)}
                  <Sidebar.MenuItem>
                    <div class='flex w-full items-center'>
                      <Sidebar.MenuButton isActive={personalConversation.id === conversation?.id}>
                        {#snippet child({ props })}
                          <a href={`/chat/${personalConversation.id}`} draggable='false' {...props}>
                            <MessageSquare class='mr-2 h-4 w-4' />
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
  </Sidebar.Root>
  <Sidebar.Inset class='overflow-auto'>
    <header class='flex h-16 shrink-0 items-center gap-2'>
      <div class='flex flex-1 items-center justify-between px-4 gap-3'>
        <div class='flex items-center gap-2'>
          <Sidebar.Trigger class='-ml-1' />
          <Separator orientation='vertical' class='mr-2 h-4' />
          <div class='hidden mr-4 md:flex'>
            <h1 class='text-lg'>
              {conversation?.title || 'Chat'}
            </h1>
          </div>
          <Select.Root type='single' name='aiModel' bind:value={selectModel}>
            <Select.Trigger class='w-44'>
              {triggerContent}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.GroupHeading class='py-3'>Models</Select.GroupHeading>
                {#each aiModels as model}
                  <Select.Item
                    class='h-10 rounded-button text-sm'
                    value={model.value}
                    label={model.label}
                    disabled={!model.enabled}
                  >
                    {model.label}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
        <div class='flex items-center gap-3'>
          <SettingChat bind:followMessage={followMessage} bind:sendOnEnter={sendOnEnter} />
          <ShareDialog conversation={conversation} />
        </div>
      </div>
    </header>
    <div class='h-full overflow-auto'>
      {@render children?.()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
<SearchChat bind:open={showSearch} />
