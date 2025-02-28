<script lang='ts'>
  import * as Command from '$lib/components/ui/command'
  import { splitMatchedSearch } from '$lib/utils/index'
  import { z } from '$lib/zero'
  import MiniSearch from 'minisearch'
  import removeMd from 'remove-markdown'
  import { Query } from 'zero-svelte'

  let { open = $bindable(false) } = $props()
  const conversations = new Query(
    z.current.query.conversations.related('messages'),
  )

  type Conversation = typeof conversations.current[number]
  type ExtraFields = { title: string, allMessages: string }
  const miniSearch = new MiniSearch<Conversation>({
    fields: ['title', 'allMessages'],
    storeFields: ['title', 'allMessages'],
    searchOptions: {
      boost: { title: 1.5 },
      fuzzy: true,
      prefix: true,
    },
    extractField: (document, fieldName) => {
      if (fieldName === 'allMessages') {
        const messages = document.messages
        return messages
          .map((message: any) => removeMd(message.finalText))
          .join(' ')
      }
      const value = document[fieldName as keyof typeof document]
      return value ? String(value) : ''
    },
  })

  let searchText = $state('')
  const searchResults = $derived(miniSearch.search(searchText)
    .map(s => splitMatchedSearch<ExtraFields>(
      {
        id: s.id,
        allMessages: s.allMessages as string,
        title: s.title as string,
        match: s.match,
      },
      50,
    )))

  $effect(() => {
    conversations.current.forEach((conversation) => {
      miniSearch.has(conversation.id)
        ? miniSearch.replace(conversation)
        : miniSearch.add(conversation)
    })
  })
</script>

<Command.Dialog
  shouldFilter={false}
  bind:open
>
  <Command.Input
    placeholder='Type a command or search...'
    bind:value={searchText}
  />
  <Command.List>
    {#if searchResults.length === 0}
      <Command.Empty>No results found.</Command.Empty>
    {/if}
    {#if searchResults.length > 0}
      <Command.Group heading='Recent Conversations'>
        {#each searchResults as result (result.id)}
          <Command.LinkItem
            href={`#${result.id}`}
            value={result.id}
            onSelect={() => open = false}
          >
            <div class='flex flex-col space-y-1 overflow-hidden whitespace-nowrap'>
              <div class='text-sm text-foreground truncate'>
                {#each result.title as title (title.id)}
                  {#if title.isMatch}
                    <span class='bg-amber-100 dark:bg-amber-900 rounded-sm'>{title.text}</span>
                  {:else}
                    {title.text}
                  {/if}
                {/each}
              </div>
              <div class='text-sm text-muted-foreground truncate'>
                {#if result.allMessages[0].start > 0}
                  ...
                {/if}
                {#each result.allMessages as message (message.id)}
                  {#if message.isMatch}
                    <span class='bg-amber-100 dark:bg-amber-900 rounded-sm'>{message.text}</span>
                  {:else}
                    {message.text}
                  {/if}
                {/each}
              </div>
            </div>
          </Command.LinkItem>
        {/each}
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
