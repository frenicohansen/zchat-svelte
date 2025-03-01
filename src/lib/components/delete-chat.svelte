<script lang='ts'>
  import { goto } from '$app/navigation'
  import * as AlertDialog from '$lib/components/ui/alert-dialog'
  import { buttonVariants } from '$lib/components/ui/button'
  import { cn, miniSearch } from '$lib/utils'
  import { z } from '$lib/zero'
  import X from 'lucide-svelte/icons/x'
  import { Query } from 'zero-svelte'

  let show = $state(false)

  // eslint-disable-next-line prefer-const
  let { conversationId }: { conversationId: string | null } = $props()
  const allMessagesInConversation = conversationId
    ? new Query(z.instance.current.query.messages.where('conversationId', conversationId))
    : null

  async function handleDelete() {
    await z.instance.current.mutateBatch(async (tx) => {
      allMessagesInConversation?.current.forEach((message) => {
        tx.messages.delete({ id: message.id })
      })
      tx.conversations.delete({ id: conversationId })
    })
    miniSearch.instance.remove(conversationId)
    show = false
    goto('/')
  }
</script>

<AlertDialog.Root bind:open={show}>
  <AlertDialog.Trigger
    class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8 opacity-0 group-hover/menu-item:opacity-100')}
    onclick={() => show = true}
  >
    <X class='h-4 w-4' />
    <span class='sr-only'>Delete</span>
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
      <AlertDialog.Action onclick={handleDelete}>Continue</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
