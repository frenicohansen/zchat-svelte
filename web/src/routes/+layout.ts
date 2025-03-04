import type { LayoutLoad } from './$types'
import { initZ } from '$lib/zero'

export const load: LayoutLoad = async () => {
  await initZ()
}

export const ssr = false
export const prerender = true
