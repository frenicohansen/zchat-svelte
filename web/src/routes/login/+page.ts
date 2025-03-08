import type { PageLoad } from './$types'
import { authClient } from '$lib/auth-client'
import { redirect } from '@sveltejs/kit'

export const load: PageLoad = async () => {
  const { data } = await authClient.getSession()

  if (data) {
    throw redirect(307, '/chat')
  }
}
