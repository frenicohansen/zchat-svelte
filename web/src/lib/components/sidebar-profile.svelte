<script lang='ts'>
  import { goto } from '$app/navigation'
  import { authClient } from '$lib/auth-client'
  import * as Avatar from '$lib/components/ui/avatar'
  import { Button } from '$lib/components/ui/button'
  import { db } from '$lib/db/dexie'
  import { z } from '$lib/zero'
  import { LogOut } from 'lucide-svelte'

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          db.delete()
          z.destroy()
          goto('/login')
        },
      },
    })
  }
</script>

<div class='flex items-center justify-between w-full'>
  {#await authClient.getSession() then { data: session }}
    <div class='flex'>
      <Avatar.Root class='mr-2 size-6'>
        <Avatar.Fallback>
          {session?.user.name.split(' ').map(n => n[0].toUpperCase()).join('')}
        </Avatar.Fallback>
      </Avatar.Root>
      <span class='flex items-center text-sm'>{session?.user.name}</span>
    </div>
  {/await}
  <div class='flex items-center relative'>
    <Button variant="ghost" class="size-6" onclick={handleSignOut}>
      <LogOut class='size-4' />
      <span class='sr-only'>Log out</span>
    </Button>
  </div>
</div>
