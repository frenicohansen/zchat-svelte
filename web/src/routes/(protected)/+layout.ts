import type { LayoutLoad } from './$types'
import { authClient } from '$lib/auth-client'
import { redirect } from '@sveltejs/kit'

export const load: LayoutLoad = async () => {
  const { data } = await authClient.getSession()

  if (!data) {
    throw redirect(302, '/login')
  }
}
