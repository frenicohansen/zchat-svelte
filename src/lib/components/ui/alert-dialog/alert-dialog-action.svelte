<script lang='ts'>
  import type { ButtonVariant } from '$lib/components/ui/button/index.js'
  import { buttonVariants } from '$lib/components/ui/button/index.js'
  import { cn } from '$lib/utils'
  import { AlertDialog as AlertDialogPrimitive } from 'bits-ui'

  let {
    ref = $bindable(null),
    class: className,
    variant = 'default',
    ...restProps
  }: AlertDialogPrimitive.ActionProps & { variant?: ButtonVariant } = $props()
</script>

<AlertDialogPrimitive.Action bind:ref class={cn(buttonVariants({ variant }), className)} {...restProps} />
