import type { LayoutLoad } from './$types'
import { authClient } from '$lib/auth-client'
import { initMiniSearch } from '$lib/utils'
import { redirect } from '@sveltejs/kit'

export const load: LayoutLoad = async () => {
  const { data } = await authClient.getSession()

  if (data) {
    await initMiniSearch()
  }
  else {
    throw redirect(302, '/login')
  }
}
