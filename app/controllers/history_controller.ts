import type { HttpContext } from '@adonisjs/core/http'
import SearchHistory from '#models/search_history'

export default class HistoryController {
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const history = await SearchHistory.query()
      .where('userId', user.id)
      .orderBy('createdAt', 'desc')
      .limit(100)

    return response.ok(history)
  }

  async clear({ auth, response }: HttpContext) {
    const user = auth.user!
    await SearchHistory.query().where('userId', user.id).delete()
    return response.noContent()
  }
}
