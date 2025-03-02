<script lang='ts'>
  import { cn } from '$lib/utils'
  import { Avatar as AvatarPrimitive } from 'bits-ui'

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: AvatarPrimitive.ImageProps = $props()
</script>

<AvatarPrimitive.Image bind:ref class={cn('aspect-square size-full', className)} {...restProps} />
