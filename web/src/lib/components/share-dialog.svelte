<script lang='ts'>
  import type { Conversation } from '$lib/db/zero-schema'
  import { Button } from '$lib/components/ui/button'
  import * as Dialog from '$lib/components/ui/dialog'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import * as RadioGroup from '$lib/components/ui/radio-group'
  import { z } from '$lib/zero'
  import { Check, Copy, Earth, Link2, Lock, UserRound } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'

  // eslint-disable-next-line prefer-const
  let { conversation }: { conversation: Conversation | null } = $props()

  type ShareOption = 'private' | 'public_read' | 'public_write'
  let shareOption = $state<ShareOption>('private')
  let copied = $state(false)

  const conversationAccessLevel = $derived(conversation?.accessLevel ?? null)
  const shareUrl = $derived(`${window.location.origin}/${conversationAccessLevel === 'public_read' ? 'share' : 'chat'}/${conversation?.id}`)
  const isConversationOwner = $derived(conversation?.accessLevel ?? null)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      copied = true
      setTimeout(() => copied = false, 2000)
      toast.success('Link copied to clipboard')
    }
    catch (e) {
      console.error('Failed to copy link', e)
      toast.error('Failed to copy link')
    }
  }

  function handleShare() {
    if (!conversation?.id) {
      return
    }

    z.current.mutate.conversations.update({
      id: conversation.id,
      accessLevel: shareOption,
    })
    toast.success('Sharing settings updated')
  }
</script>

{#if conversation?.id && isConversationOwner}
  <Dialog.Root>
    <Dialog.Trigger>
      {#snippet child({ props })}
        <Button variant='outline' size='icon' class='h-8 w-8' {...props}>
          <UserRound class='h-4 w-4' />
          <span class='sr-only'>Share conversation</span>
        </Button>
      {/snippet}
    </Dialog.Trigger>
    <Dialog.Content class='sm:max-w-md'>
      <Dialog.Header class='select-none'>
        <Dialog.Title>Share conversation</Dialog.Title>
        <Dialog.Description>
          Anyone with the link can access this conversation based on the permission you set.
        </Dialog.Description>
      </Dialog.Header>
      <div class='flex flex-col gap-4 py-4'>
        {#if conversationAccessLevel && ['public_read', 'public_write'].includes(conversationAccessLevel)}
          <div class='flex items-center gap-4'>
            <div class='grid flex-1 gap-1.5'>
              <Label for='link' class='sr-only'>Link</Label>
              <Input id='link' readonly value={shareUrl} class='h-9 border-dashed' />
            </div>
            <Button variant='outline' size='icon' class='h-9 w-9' onclick={handleCopy}>
              {#if copied}
                <Check class='h-4 w-4' />
              {:else}
                <Copy class='h-4 w-4' />
              {/if}
              <span class='sr-only'>Copy link</span>
            </Button>
          </div>
        {/if}
        <div class='grid gap-4 select-none'>
          <Label>Who can access this conversation?</Label>
          <RadioGroup.Root value={conversationAccessLevel ?? 'private'} onValueChange={value => shareOption = value as ShareOption} class='grid gap-3'>
            <Label
              for='private'
              class='flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent'
            >
              <RadioGroup.Item value='private' id='private' />
              <Lock class='h-5 w-5 text-muted-foreground' />
              <div class='grid gap-1'>
                <div>Private</div>
                <div class='text-sm text-muted-foreground'>Only you can access this conversation</div>
              </div>
            </Label>
            <Label
              for='public_read'
              class='flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent'
            >
              <RadioGroup.Item value='public_read' id='public_read' />
              <Earth class='h-5 w-5 text-muted-foreground' />
              <div class='grid gap-1'>
                <div>Anyone with the link can view</div>
                <div class='text-sm text-muted-foreground'>Anyone with the link can view this conversation</div>
              </div>
            </Label>
            <Label
              for='public_write'
              class='flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent'
            >
              <RadioGroup.Item value='public_write' id='public_write' />
              <Link2 class='h-5 w-5 text-muted-foreground' />
              <div class='grid gap-1'>
                <div>Logged in users with the link can edit</div>
                <div class='text-sm text-muted-foreground'>
                  Logged in users with the link can view and continue the conversation
                </div>
              </div>
            </Label>
          </RadioGroup.Root>
        </div>
      </div>
      <Dialog.Footer class='gap-2 sm:gap-0'>
        <Button onclick={handleShare} class='w-full sm:w-auto'>
          Update sharing settings
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}
