import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const session = locals.session

  if (url.pathname === '/login') {
    return
  }
  if (!session) {
    throw redirect(302, '/login')
  }
}
