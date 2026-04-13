import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import autoSwaggerModule from 'adonis-autoswagger'
import swagger from '#config/swagger'
import env from '#start/env'
import {
  loginThrottle,
  registerThrottle,
  forgotPasswordThrottle,
} from '#start/limiter'

// @ts-ignore CJS default export interop
const AutoSwagger = autoSwaggerModule.default || autoSwaggerModule

const AuthController = () => import('#controllers/auth_controller')
const FavoritesController = () => import('#controllers/favorites_controller')
const HistoryController = () => import('#controllers/history_controller')

// Swagger docs — exposés uniquement hors production
if (env.get('NODE_ENV') !== 'production') {
  router.get('/swagger', async () => {
    return AutoSwagger.docs(router.toJSON(), swagger)
  })

  router.get('/docs', async ({ response }) => {
    const html: string = AutoSwagger.ui('/swagger', swagger)

    // Auto-auth : intercepte la réponse de /api/auth/login (et /register) pour
    // extraire le bearer token et le pousser dans Swagger UI automatiquement.
    const interceptor = `
      responseInterceptor: function (res) {
        try {
          if (res.url && /\\/api\\/auth\\/(login|register)$/.test(res.url) && res.status >= 200 && res.status < 300) {
            var body = typeof res.body === 'object' && res.body ? res.body : JSON.parse(res.text || res.data || '{}');
            var token = body && body.token && body.token.value;
            if (token && window.ui) {
              window.ui.preauthorizeApiKey('BearerAuth', token);
              console.log('[auto-auth] BearerAuth token set from', res.url);
            }
          }
        } catch (e) { console.warn('[auto-auth] interceptor error', e); }
        return res;
      },`

    const patched = html.replace(
      'SwaggerUIBundle({',
      `window.ui = SwaggerUIBundle({${interceptor}`
    )

    return response.header('Content-Type', 'text/html').send(patched)
  })
}

router.get('/', async () => ({ name: 'carto-api' }))

// Health check
router.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }))

// Auth routes (public)
router.group(() => {
  router.post('/register', [AuthController, 'register']).use(registerThrottle)
  router.post('/login', [AuthController, 'login']).use(loginThrottle)
  router
    .post('/forgot-password', [AuthController, 'forgotPassword'])
    .use(forgotPasswordThrottle)
}).prefix('/api/auth')

// Web routes (HTML) — page de réinitialisation de mot de passe servie
// directement par Adonis (liée depuis l'email Brevo).
router.get('/auth/reset-password', [AuthController, 'showResetPasswordPage'])
router.post('/auth/reset-password', [AuthController, 'submitResetPasswordForm'])

// Authenticated routes
router.group(() => {
  router.post('/auth/change-password', [AuthController, 'changePassword'])
  router.delete('/auth/logout', [AuthController, 'logout'])
  router.get('/auth/me', [AuthController, 'me'])

  router.get('/favorites', [FavoritesController, 'index'])
  router.get('/favorites/:id', [FavoritesController, 'show'])
  router.post('/favorites', [FavoritesController, 'store'])
  router.delete('/favorites/:id', [FavoritesController, 'destroy'])

  router.get('/history', [HistoryController, 'index'])
  router.delete('/history', [HistoryController, 'clear'])
}).prefix('/api').use(middleware.auth())
