export default defineNuxtRouteMiddleware((to) => {
  const userId = localStorage.getItem('userId')
  
  // If user is not logged in and trying to access protected route
  if (!userId && to.path !== '/register') {
    return navigateTo('/register')
  }
  
  // If user is logged in and trying to access register page
  if (userId && to.path === '/register') {
    return navigateTo('/users')
  }
})
