<script lang='ts'>
  import { page } from '$app/state'
  import { authClient } from '$lib/auth-client'
  import { Button } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card'
  import Github from 'lucide-svelte/icons/github'

  const signIn = async () => {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: `${page.url.origin}/chat`,
    })
  }
</script>

<div class='flex min-h-screen items-center justify-center bg-muted/40 p-4'>
  <Card.Root class='w-full max-w-sm'>
    <Card.Header class='text-center'>
      <Card.Title class='text-2xl font-bold'>Welcome back</Card.Title>
      <Card.Description>Sign in to your account to continue</Card.Description>
    </Card.Header>
    <Card.Content class='flex justify-center'>
      <Button class='w-full gap-2' size='lg' onclick={signIn}>
        <Github class='size-4' />
        Continue with GitHub
      </Button>
    </Card.Content>
    <Card.Footer class='text-center text-sm text-muted-foreground'>
      By continuing, you agree to our Terms of Service and Privacy Policy.
    </Card.Footer>
  </Card.Root>
</div>
