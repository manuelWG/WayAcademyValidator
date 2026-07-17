import { revalidateSessionUser } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = session.user?.id

  if (!userId) {
    return { authenticated: false, user: null }
  }

  try {
    const user = await revalidateSessionUser(userId)
    if (!user) {
      await clearUserSession(event)
      return { authenticated: false, user: null }
    }
    return { authenticated: true, user }
  } catch {
    await clearUserSession(event)
    return { authenticated: false, user: null }
  }
})
