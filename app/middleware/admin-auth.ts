export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAdminSession()

  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    if (!isAuthenticated.value) {
      return navigateTo('/admin/login')
    }
  }

  if (to.path === '/admin/login' && isAuthenticated.value) {
    return navigateTo('/admin')
  }
})
