import type { ClientInit } from '@sveltejs/kit'
import { initZ } from '$lib/zero'

export const init: ClientInit = async () => {
  await initZ()
}
