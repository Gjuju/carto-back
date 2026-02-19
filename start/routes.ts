import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const FavoritesController = () => import('#controllers/favorites_controller')
const HistoryController = () => import('#controllers/history_controller')

// Health check
router.get('/', async () => ({ status: 'ok', app: 'carto-api' }))

// Auth routes (public)
router.group(() => {
  router.post('/register', [AuthController, 'register'])
  router.post('/login', [AuthController, 'login'])
}).prefix('/api/auth')

// Authenticated routes
router.group(() => {
  router.delete('/auth/logout', [AuthController, 'logout'])
  router.get('/auth/me', [AuthController, 'me'])

  router.get('/favorites', [FavoritesController, 'index'])
  router.post('/favorites', [FavoritesController, 'store'])
  router.delete('/favorites/:id', [FavoritesController, 'destroy'])

  router.get('/history', [HistoryController, 'index'])
  router.delete('/history', [HistoryController, 'clear'])
}).prefix('/api').use(middleware.auth())
