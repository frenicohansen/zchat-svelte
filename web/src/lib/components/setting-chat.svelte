<script lang='ts'>
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import * as Popover from '$lib/components/ui/popover'
  import { Separator } from '$lib/components/ui/separator'
  import { Switch } from '$lib/components/ui/switch'
  import Settings from 'lucide-svelte/icons/settings'

  let {
    followMessage = $bindable(false),
    sendOnEnter = $bindable(true),
  }: { followMessage?: boolean, sendOnEnter?: boolean } = $props()
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button variant='outline' size='icon' class='size-10' {...props}>
        <Settings class='size-4' />
        <span class='sr-only'>Settings</span>
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class='w-80' align='end'>
    <div class='space-y-4'>
      <div class='space-y-2'>
        <h4 class='font-medium leading-none'>Chat Settings</h4>
        <p class='text-sm text-muted-foreground'>Configure your chat experience preferences.</p>
      </div>
      <Separator />
      <div class='space-y-4'>
        <div class='flex items-center justify-between space-y-0'>
          <div class='flex flex-col gap-1'>
            <Label for='follow-messages' class='text-sm'>
              Auto-scroll
            </Label>
            <span class='font-normal text-xs text-muted-foreground'>
              Scroll to new messages when they arrive.
            </span>
          </div>
          <Switch
            id='follow-messages'
            checked={followMessage}
            onCheckedChange={() => followMessage = !followMessage}
          />
        </div>
        <Separator />
        <div class='flex items-center justify-between space-y-0'>
          <div class='flex flex-col gap-1'>
            <Label for='send-on-enter' class='text-sm'>
              Send on Enter
            </Label>
            <span class='font-normal text-xs text-muted-foreground'>
              Enter to send messages.
            </span>
          </div>
          <Switch id='send-on-enter' checked={sendOnEnter} onCheckedChange={() => sendOnEnter = !sendOnEnter} />
        </div>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
