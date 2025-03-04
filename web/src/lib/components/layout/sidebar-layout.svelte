<script lang='ts'>
  import type { Conversation } from '$lib/db/zero-schema'
  import type { Snippet } from 'svelte'
  import AppSidebar from '$lib/components/app-sidebar.svelte'
  import ShareDialog from '$lib/components/share-dialog.svelte'
  import * as Select from '$lib/components/ui/select'
  import { Separator } from '$lib/components/ui/separator'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import { z } from '$lib/zero'
  import { Query } from 'zero-svelte'

  const aiModels = [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', enabled: true },
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet', enabled: false },
    { value: 'deepseek-r1', label: 'DeepSeek R1', enabled: false },
  ]

  const conversations = new Query(z.current.query.conversations.orderBy('updatedAt', 'desc'))

  // eslint-disable-next-line prefer-const
  let { conversation, children }: { conversation: Conversation | null, children: Snippet | undefined } = $props()

  let value = $state('gemini-2.0-flash')

  const triggerContent = $derived(
    aiModels.find(model => model.value === value)?.label ?? 'Select a model',
  )
</script>

<Sidebar.Provider class='h-screen'>
  <AppSidebar variant='inset' conversations={conversations.current} conversation={conversation} />
  <Sidebar.Inset>
    <header class='flex h-16 shrink-0 items-center gap-2 sticky top-0 bg-background z-50'>
      <div class='flex flex-1 items-center justify-between px-4'>
        <div class='flex items-center gap-2'>
          <Sidebar.Trigger class='-ml-1' />
          <Separator orientation='vertical' class='mr-2 h-4' />
          <div class='flex-1 mr-4'>
            <h1 class='text-lg'>
              {conversation?.title || 'Chat'}
            </h1>
          </div>
          <Select.Root type='single' name='aiModel' bind:value>
            <Select.Trigger class='w-[180px]'>
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
        <ShareDialog conversation={conversation} />
      </div>
    </header>
    <main class='h-full overflow-hidden'>
      {@render children?.()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
