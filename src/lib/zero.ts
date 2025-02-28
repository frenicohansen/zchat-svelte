import type { Schema } from '$lib/db/zero-schema'
import { PUBLIC_ZERO_SERVER } from '$env/static/public'
import { authClient } from '$lib/auth-client'
import { schema } from '$lib/db/zero-schema'
import { Z } from 'zero-svelte'

export async function get_z_options() {
  const [{ data: session }, { data: token }] = await Promise.all([
    authClient.getSession(),
    authClient.token(),
  ])

  return {
    userID: session?.session.userId ?? '',
    auth: token?.token ?? '',
    server: PUBLIC_ZERO_SERVER,
    schema,
  } as const
}

export const z = new Z<Schema>(await get_z_options())

let didPreload = false

export function preload(z: Z<Schema>) {
  if (didPreload) {
    return
  }

  didPreload = true

  z.current.query.conversations
    .where(({ cmp, or }) => or(
      cmp('accessLevel', 'public_read'),
      cmp('userId', 'public_write'),
      cmp('userId', z.current.userID),
    ))
    .related('messages')
    .preload()
}
