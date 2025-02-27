<script lang='ts'>
  import { page } from '$app/state'
  import * as Avatar from '$lib/components/ui/avatar'
  import Button from '$lib/components/ui/button/button.svelte'
  import { z } from '$lib/zero'
  import DOMPurify from 'dompurify'
  import { Bot } from 'lucide-svelte'
  import SendHorizontal from 'lucide-svelte/icons/send-horizontal'
  import { marked } from 'marked'
  import { Query } from 'zero-svelte'

  const conversationId = $derived(Number(page.url.hash.slice(1)))
  const existingMessages = $derived(new Query(z.current.query.messages.where('conversationId', '=', conversationId).orderBy('updatedAt', 'asc')))
  let prompt = $state('')

  function handleSubmit() {
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        message: prompt,
      }),
    })
  }
</script>

<svelte:head>
  <title>Zero Chat - Offline First ChatGPT</title>
</svelte:head>

<div class='flex h-full flex-col items-center scroll-smooth px-4 pt-8 gap-8'>
  {#if existingMessages.current.length > 0}
    {#each existingMessages.current as message (message.id)}
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
    <div class='flex h-[calc(100vh-12rem)] items-center justify-center'>
      <div class='text-center'>
        <div class='inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4'>
          <Bot class='h-6 w-6 text-primary' />
        </div>
        <h3 class='text-lg font-semibold'>Welcome to AI Chat</h3>
        <p class='text-muted-foreground'>Start a conversation by typing a message below.</p>
      </div>
    </div>
  {/if}
  <div class='min-h-8 flex-grow'></div>
  <div class='sticky bottom-0 mt-3 flex w-full max-w-4xl bg-background flex-col items-center justify-end rounded-t-lg pb-4'>
    <form
      class='focus-within:border-ring/20 flex w-full flex-wrap items-end rounded-lg border px-2.5 shadow-sm transition-colors ease-in'
    >
      <textarea
        class='bg-background placeholder:text-muted-foreground resize-none flex min-h-28 outline-none flex-grow px-3 py-4 text-base disabled:cursor-not-allowed disabled:opacity-50 md:text-sm max-h-40' placeholder='Write a message...'
        bind:value={prompt}
      ></textarea>
      <Button class='my-2.5' variant='default' size='icon' onclick={handleSubmit}>
        <SendHorizontal class='w-4 h-4' />
      </Button>
    </form>
  </div>
</div>
