<script lang='ts'>
  import * as Command from '$lib/components/ui/command'
  import { miniSearch, splitMatchedSearch } from '$lib/utils'
  import { z } from '$lib/zero'
  import { Query } from 'zero-svelte'

  let { open = $bindable(false) } = $props()
  const conversations = new Query(z.current.query.conversations.related('messages'))
  type ExtraFields = { title: string, allMessages: string }

  let searchText = $state('')
  const searchResults = $derived(miniSearch.instance.search(searchText)
    .map(s => splitMatchedSearch<ExtraFields>(
      {
        id: s.id,
        allMessages: s.allMessages as string,
        title: s.title as string,
        match: s.match,
      },
      50,
    )))

  const updateSearch = (docs: typeof conversations) => {
    docs.current.forEach((conversation) => {
      miniSearch.instance.has(conversation.id)
        ? miniSearch.instance.replace(conversation)
        : miniSearch.instance.add(conversation)
    })
  }

  $effect(() => {
    try {
      updateSearch(conversations)
    }
    catch {
      miniSearch.instance.removeAll()
      updateSearch(conversations)
    }
    miniSearch.debouncedSave()
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
            href={`/chat/${result.id}`}
            value={result.id}
            onSelect={() => open = false}
          >
            <div class='flex flex-col space-y-1 overflow-hidden whitespace-nowrap'>
              <div class='text-sm text-foreground truncate'>
                {#each result.title as title (title.id)}
                  {#if title.isMatch}
                    {@const pos = title.text.toLowerCase().indexOf(searchText.toLowerCase())}
                    {#if pos >= 0}
                      {title.text.slice(0, pos)}<span class='bg-amber-100 dark:bg-amber-900 rounded-sm'>
                        {title.text.slice(pos, pos + searchText.length)}
                      </span>{title.text.slice(pos + searchText.length)}
                    {:else}
                      <span class='bg-amber-100 dark:bg-amber-900 rounded-sm'>
                        {title.text}
                      </span>
                    {/if}
                  {:else}
                    {title.text}
                  {/if}
                {/each}
              </div>
              <p class='text-sm text-muted-foreground truncate'>
                {#each result.allMessages as message (message.id)}
                  {@const threeDots = (message.id === result.allMessages[0].id && result.allMessages[0].start > 0) ? '...' : ''}
                  {#if message.isMatch}
                    {@const pos = message.text.toLowerCase().indexOf(searchText.toLowerCase())}
                    {#if pos >= 0}
                      {threeDots + message.text.slice(0, pos)}<span class='bg-amber-100 dark:bg-amber-900 rounded-sm'>
                        {message.text.slice(pos, pos + searchText.length)}
                      </span>{message.text.slice(pos + searchText.length)}
                    {:else}
                      {threeDots}<span class='bg-amber-100 dark:bg-amber-900 rounded-sm'>
                        {message.text}
                      </span>
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
