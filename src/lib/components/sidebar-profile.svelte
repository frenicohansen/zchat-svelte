<script lang='ts' module>
  import { authClient } from '$lib/auth-client'

  const { data: session } = await authClient.getSession()
</script>

<script lang='ts'>
  import { goto } from '$app/navigation'
  import * as Avatar from '$lib/components/ui/avatar'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import { z } from '$lib/zero'
  import { ChevronDown, LogOut, Settings, User } from 'lucide-svelte'

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          z.current.close()
          goto('/login') // redirect to login page
        },
      },
    })
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Sidebar.MenuButton {...props}>
        <Avatar.Root class='mr-2 h-6 w-6'>
          <Avatar.Fallback>
            {session?.user.name.split(' ').map(n => n[0].toUpperCase()).join('')}
          </Avatar.Fallback>
        </Avatar.Root>
        <span>{session?.user.name}</span>
        <ChevronDown class='ml-auto h-4 w-4' />
      </Sidebar.MenuButton>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align='start' class='w-[--bits-dropdown-menu-anchor-width]'>
    <DropdownMenu.Item>
      <User class='mr-2 h-4 w-4' />
      <span>Profile</span>
    </DropdownMenu.Item>
    <DropdownMenu.Item>
      <Settings class='mr-2 h-4 w-4' />
      <span>Settings</span>
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item onSelect={handleSignOut}>
      <LogOut class='mr-2 h-4 w-4' />
      <span>Log out</span>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
