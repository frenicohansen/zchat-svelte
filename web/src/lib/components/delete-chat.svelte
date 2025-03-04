<script lang='ts'>
  import { goto } from '$app/navigation'
  import * as AlertDialog from '$lib/components/ui/alert-dialog'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import { miniSearch } from '$lib/utils'
  import { z } from '$lib/zero'
  import X from 'lucide-svelte/icons/x'
  import { Query } from 'zero-svelte'

  let show = $state(false)

  // eslint-disable-next-line prefer-const
  let { conversationId }: { conversationId: string | null } = $props()
  const allMessagesInConversation = conversationId
    ? new Query(z.current.query.messages.where('conversationId', conversationId))
    : null

  async function handleDelete() {
    await z.current.mutateBatch(async (tx) => {
      allMessagesInConversation?.current.forEach((message) => {
        tx.messages.delete({ id: message.id })
      })
      tx.conversations.delete({ id: conversationId })
    })
    miniSearch.instance.discard(conversationId)
    miniSearch.instance.vacuum()
    show = false
    goto('/chat')
  }
</script>

<AlertDialog.Root bind:open={show}>
  <AlertDialog.Trigger onclick={() => show = true}>
    {#snippet child({ props })}
      <Sidebar.MenuAction {...props}>
        <X class='size-3 text-sidebar-foreground' />
        <span class='sr-only'>Delete</span>
      </Sidebar.MenuAction>
    {/snippet}
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
      <AlertDialog.Description>
        This action cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action variant='destructive' onclick={handleDelete}>Continue</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
