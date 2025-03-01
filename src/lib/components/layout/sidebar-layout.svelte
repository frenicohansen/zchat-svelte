<script lang='ts'>
  import { page } from '$app/state'
  import AppSidebar from '$lib/components/app-sidebar.svelte'
  import ShareDialog from '$lib/components/share-dialog.svelte'
  import * as Select from '$lib/components/ui/select'
  import { Separator } from '$lib/components/ui/separator'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import { z } from '$lib/zero'
  import { Query } from 'zero-svelte'

  const aiModels = [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
    { value: 'deepseek-r1', label: 'DeepSeek R1' },
  ]

  const conversationId = $derived(page.url.hash.slice(1))
  const conversations = new Query(z.current.query.conversations.orderBy('updatedAt', 'desc'))

  const { children } = $props()

  let value = $state('gemini-2.0-flash')

  const triggerContent = $derived(
    aiModels.find(model => model.value === value)?.label ?? 'Select a model',
  )
</script>

<Sidebar.Provider>
  <AppSidebar variant='inset' conversations={conversations.current} />
  <Sidebar.Inset>
    <header class='flex h-16 shrink-0 items-center gap-2 sticky top-0 bg-background z-50'>
      <div class='flex flex-1 items-center justify-between px-4'>
        <div class='flex items-center gap-2'>
          <Sidebar.Trigger class='-ml-1' />
          <Separator orientation='vertical' class='mr-2 h-4' />
          <div class='flex-1 mr-4'>
            <h1 class='text-lg'>
              {conversations.current.find(c => c.id === conversationId)?.title || 'Chat'}
            </h1>
          </div>
          <Select.Root type='single' name='favoriteFruit' bind:value>
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
                  >
                    {model.label}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
        <ShareDialog conversationId={conversationId} />
      </div>
    </header>
    <main class='h-full'>
      {@render children?.()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
