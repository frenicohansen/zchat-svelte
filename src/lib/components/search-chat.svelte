<script lang='ts'>
  import type { SearchResult } from 'minisearch'
  import * as Command from '$lib/components/ui/command'
  import { z } from '$lib/zero'
  import MiniSearch from 'minisearch'
  import { Query } from 'zero-svelte'

  let { open = $bindable(false) } = $props()
  const conversations = new Query(
    z.current.query.conversations.related('messages'),
  )

  const searchableConversations = $derived(
    conversations.current.map(conversation => ({
      id: conversation.id,
      title: conversation.title,
      allMessages: conversation.messages.map(message => message.finalText).join('\n'),
    })),
  )

  const miniSearch = new MiniSearch({
    fields: ['title', 'allMessages'],
    storeFields: ['title'],
  })

  let searchText = $state('')
  let searchResults: SearchResult[] = $state([])

  function handleInput() {
    searchResults = miniSearch.search(searchText)
  }

  $effect(() => {
    searchableConversations.forEach((conversation) => {
      miniSearch.has(conversation.id)
        ? miniSearch.replace(conversation)
        : miniSearch.add(conversation)
    })
  })
</script>

<Command.Dialog
  shouldFilter={false}
  onValueChange={handleInput}
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
          <Command.Item>{conversation.title}</Command.Item>
        {/each}
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
