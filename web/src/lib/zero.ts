import type { Schema } from '$lib/db/zero-schema'
import { PUBLIC_ZERO_SERVER } from '$env/static/public'
import { authClient } from '$lib/auth-client'
import { schema } from '$lib/db/zero-schema'
import { decodeJwt } from 'jose'
import { Z } from 'zero-svelte'

export async function get_z_options() {
  const { data: token } = await authClient.token()
  let payload = token ? decodeJwt(token.token) : null

  const currentTime = Math.floor(Date.now() / 1000)
  if (payload?.exp && payload.exp < currentTime) {
    payload = null
  }

  return {
    userID: payload?.sub ?? 'anon',
    server: PUBLIC_ZERO_SERVER,
    schema,
    auth: (error?: 'invalid-token') => {
      if (error === 'invalid-token') {
        authClient.signOut()
        destroyZ()
        return undefined
      }
      return token?.token
    },
  } as const
}

let _z: Z<Schema> | null = null

export const z = {
  get current() {
    if (!_z) {
      throw new Error('Z instance not initialized. Call initZ() first')
    }
    return _z.current
  },
  destroy: destroyZ,
}

export async function initZ() {
  if (!_z) {
    const options = await get_z_options()
    _z = new Z<Schema>(options)
    preload(_z)
  }
  return _z
}

function destroyZ() {
  if (_z) {
    _z.close()
    _z = null
  }
}

let didPreload = false
function preload(z: Z<Schema>) {
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
