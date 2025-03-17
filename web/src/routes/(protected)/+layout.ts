import type { LayoutLoad } from './$types'
import { authClient } from '$lib/auth-client'
import { highlighter } from '$lib/shiki'
import { initMiniSearch } from '$lib/utils'
import { redirect } from '@sveltejs/kit'

export const load: LayoutLoad = async () => {
  const { data } = await authClient.getSession()

  if (data) {
    await initMiniSearch()
    await highlighter.init()
  }
  else {
    throw redirect(302, '/login')
  }
}
