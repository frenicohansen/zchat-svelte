<script lang='ts'>
  import { page } from '$app/state'
  import { authClient } from '$lib/auth-client'
  import { Button } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'

  const signIn = async () => {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: `${page.url.origin}/chat`,
    })
  }
</script>

<div class='flex h-screen w-full items-center justify-center px-4'>
  <Card.Root class='mx-auto max-w-sm'>
    <Card.Header>
      <Card.Title class='text-2xl'>Login</Card.Title>
      <Card.Description>Enter your email below to login to your account</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class='grid gap-4'>
        <div class='grid gap-2'>
          <Label for='email'>Email</Label>
          <Input id='email' type='email' placeholder='m@example.com' required disabled />
        </div>
        <div class='grid gap-2'>
          <div class='flex items-center'>
            <Label for='password'>Password</Label>
            <a href='##' class='ml-auto inline-block text-sm underline'>
              Forgot your password?
            </a>
          </div>
          <Input id='password' type='password' required disabled />
        </div>
        <Button type='submit' class='w-full' disabled>Login</Button>
        <Button variant='outline' class='w-full' onclick={signIn}>Login with Github</Button>
      </div>
      <div class='mt-4 text-center text-sm'>
        Don't have an account?
        <a href='##' class='underline'> Sign up </a>
      </div>
    </Card.Content>
  </Card.Root>
</div>
