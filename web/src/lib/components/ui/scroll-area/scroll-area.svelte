<script lang='ts'>
  import type { WithoutChild } from 'bits-ui'
  import { cn } from '$lib/utils'
  import { ScrollArea as ScrollAreaPrimitive } from 'bits-ui'
  import { Scrollbar } from './index.js'

  let {
    ref = $bindable(null),
    refViewport = $bindable(null),
    class: className,
    orientation = 'vertical',
    scrollbarXClasses = '',
    scrollbarYClasses = '',
    onscroll,
    children,
    ...restProps
  }: WithoutChild<ScrollAreaPrimitive.RootProps> & {
    refViewport?: HTMLDivElement | null
    orientation?: 'vertical' | 'horizontal' | 'both' | undefined
    scrollbarXClasses?: string | undefined
    scrollbarYClasses?: string | undefined
  } = $props()
</script>

<ScrollAreaPrimitive.Root bind:ref {...restProps} class={cn('relative overflow-hidden', className)}>
  <ScrollAreaPrimitive.Viewport
    bind:ref={refViewport}
    onscroll={onscroll}
    class='h-full w-full rounded-[inherit]'
  >
    {@render children?.()}
  </ScrollAreaPrimitive.Viewport>
  {#if orientation === 'vertical' || orientation === 'both'}
    <Scrollbar orientation='vertical' class={scrollbarYClasses} />
  {/if}
  {#if orientation === 'horizontal' || orientation === 'both'}
    <Scrollbar orientation='horizontal' class={scrollbarXClasses} />
  {/if}
  <ScrollAreaPrimitive.Corner />
</ScrollAreaPrimitive.Root>
