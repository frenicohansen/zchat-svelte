<script lang='ts'>
  import * as Command from '$lib/components/ui/command'
  import { z } from '$lib/zero'
  import MiniSearch from 'minisearch'
  import { Query } from 'zero-svelte'

  let { open = $bindable(false) } = $props()
  const conversations = new Query(
    z.current.query.conversations.related('messages'),
  )

  const miniSearch = new MiniSearch({
    fields: ['title', 'allMessages'],
    storeFields: ['title'],
    searchOptions: {
      boost: { title: 1.5 },
    },
    extractField: (document, fieldName) => {
      if (fieldName === 'allMessages') {
        const messages = document.messages
        return messages
          .map((message: any) => message.finalText)
          .join('\n')
      }

      return document[fieldName]
    },
  })

  let searchText = $state('')
  const searchResults = $derived(miniSearch.search(searchText))

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
      <Command.Group heading='Suggestions'>
        {#each searchResults as conversation}
          <Command.LinkItem
            href={`#${conversation.id}`}
            value={conversation.id}
            onSelect={() => open = false}
          >
            {conversation.title}
          </Command.LinkItem>
        {/each}
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
