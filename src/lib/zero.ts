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
    userID: session?.session.userId ?? 'anon',
    auth: token?.token ?? '',
    server: PUBLIC_ZERO_SERVER,
    schema,
  } as const
}

let _z: Z<Schema> | null = null

export const z = {
  get instance() {
    if (!_z) {
      throw new Error('Z instance not initialized. Call initZ() first')
    }
    return _z
  },
}

export async function initZ() {
  if (!_z) {
    const options = await get_z_options()
    _z = new Z<Schema>(options)
  }
  return _z
}

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
