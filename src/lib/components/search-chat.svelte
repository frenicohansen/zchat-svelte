<script lang='ts'>
  import * as Command from '$lib/components/ui/command'
  import { loadSearchIndex, scheduleSaveIndex, splitMatchedSearch } from '$lib/utils/index'
  import { z } from '$lib/zero'
  import MiniSearch from 'minisearch'
  import { onMount } from 'svelte'
  import { Query } from 'zero-svelte'

  let { open = $bindable(false) } = $props()
  const conversations = new Query(z.current.query.conversations.related('messages'))

  type Conversation = typeof conversations.current[number]
  type ExtraFields = { title: string, allMessages: string }

  let searchText = $state('')
  let miniSearch: MiniSearch<Conversation> | null = null

  const searchResults = $derived.by(() => miniSearch
    ? miniSearch.search(searchText)
      .map(s => splitMatchedSearch<ExtraFields>(
        {
          id: s.id,
          allMessages: s.allMessages as string,
          title: s.title as string,
          match: s.match,
        },
        50,
      ))
    : [])

  onMount(async () => {
    miniSearch = await loadSearchIndex()
  })

  $effect(() => {
    conversations.current.forEach((conversation) => {
      if (!miniSearch)
        return

      scheduleSaveIndex(miniSearch.toJSON())
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
                    {#if title.text.toLowerCase().startsWith(searchText.toLowerCase())}
                      <span class='bg-amber-100 dark:bg-amber-900 rounded-sm'>
                        {title.text.slice(0, searchText.length)}
                      </span>{title.text.slice(searchText.length)}
                    {:else}
                      <span class='bg-amber-100 dark:bg-amber-900 rounded-sm'>{title.text}</span>
                    {/if}
                  {:else}
                    {title.text}
                  {/if}
                {/each}
              </div>
              <p class='text-sm text-muted-foreground truncate'>
                {#each result.allMessages as message (message.id)}
                  {#if message.isMatch}
                    {#if message.text.toLowerCase().startsWith(searchText.toLowerCase())}
                      {(message.id === result.allMessages[0].id && result.allMessages[0].start > 0) ? '...' : ''}<span class='bg-amber-100 dark:bg-amber-900 rounded-sm'>
                        {message.text.slice(0, searchText.length)}
                      </span>{message.text.slice(searchText.length)}
                    {:else}
                      {(message.id === result.allMessages[0].id && result.allMessages[0].start > 0) ? '...' : ''}<span class='bg-amber-100 dark:bg-amber-900 rounded-sm'>{message.text}</span>
                    {/if}
                  {:else}
                    {message.id === result.allMessages[0].id && result.allMessages[0].start > 0 ? '...' : ''}{message.text}
                  {/if}
                {/each}
              </p>
            </div>
          </Command.LinkItem>
        {/each}
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
