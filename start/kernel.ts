import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.errorHandler(() => import('#exceptions/handler'))

server.use([
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
])

router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
])

export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
})
