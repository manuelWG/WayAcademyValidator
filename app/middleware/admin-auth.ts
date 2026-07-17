export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetch } = useUserSession()
  await fetch()

  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    if (!loggedIn.value) {
      return navigateTo('/admin/login')
    }
  }

  if (to.path === '/admin/login' && loggedIn.value) {
    return navigateTo('/admin')
  }
})
