<script lang='ts'>
  import SidebarLayout from '$lib/components/layout/sidebar-layout.svelte'
  import * as Avatar from '$lib/components/ui/avatar'
  import { useStreamingMessages } from '$lib/hooks/use-conversation.svelte'
  import DOMPurify from 'dompurify'
  import { Bot } from 'lucide-svelte'
  import { marked } from 'marked'

  const streaming = useStreamingMessages()
</script>

<svelte:head>
  <title>Zero Chat - Offline First ChatGPT</title>
</svelte:head>

<SidebarLayout>
  <div class='flex h-full flex-col items-center scroll-smooth px-4 pt-8 gap-8'>
    {#if streaming.messages && streaming.messages.length > 0}
      {#each streaming.messages as message (message.id)}
        {#if message.sender === 'assistant'}
          <div class='flex justify-start w-full max-w-4xl'>
            <Avatar.Root class='mr-2 h-8 w-8'>
              <Avatar.Fallback>AI</Avatar.Fallback>
            </Avatar.Root>
            <div class='rounded-lg px-4 py-2 max-w-[80%] bg-muted/50 backdrop-blur-sm prose'>
              {/* @ts-ignore */ null}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html DOMPurify.sanitize(marked.parse(message.finalText ?? ''))}
            </div>
          </div>
        {:else if message.sender === 'user'}
          <div class='flex justify-end w-full max-w-4xl'>
            <div class='rounded-lg px-4 py-2 max-w-[80%] bg-primary text-primary-foreground prose'>
              {/* @ts-ignore */ null}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html DOMPurify.sanitize(marked.parse(message.finalText ?? ''))}
            </div>
            <Avatar.Root class='ml-2 h-8 w-8'>
              <Avatar.Fallback>JD</Avatar.Fallback>
            </Avatar.Root>
          </div>
        {/if}
      {/each}
    {:else}
      <div class='flex h-full items-center justify-center'>
        <div class='text-center'>
          <div class='inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4'>
            <Bot class='h-6 w-6 text-primary' />
          </div>
          <h3 class='text-lg font-semibold'>
            Welcome to ZChat!
          </h3>
          <p class='text-muted-foreground'>
            There are no messages in this conversation yet.
          </p>
        </div>
      </div>
    {/if}
  </div>
</SidebarLayout>
