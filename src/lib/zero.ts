import type { Schema } from './db/zero-schema'
import { PUBLIC_ZERO_SERVER } from '$env/static/public'
import { Z } from 'zero-svelte'
import { schema } from './db/zero-schema'

export function get_z_options() {
  return {
    userID: 'anon',
    server: PUBLIC_ZERO_SERVER,
    schema,
  } as const
}

export const z = new Z<Schema>(get_z_options())
