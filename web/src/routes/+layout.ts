import type { LayoutLoad } from './$types'
import { highlighter } from '$lib/shiki'
import { initZ } from '$lib/zero'

export const load: LayoutLoad = async () => {
  await initZ()
  await highlighter.init()
}

export const ssr = false
export const prerender = true
