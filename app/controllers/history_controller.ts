import type { HttpContext } from '@adonisjs/core/http'
import SearchHistory from '#models/search_history'

export default class HistoryController {
  /**
   * @index
   * @summary Liste de l'historique de recherche
   * @responseBody 200 - <SearchHistory[]>
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const history = await SearchHistory.query()
      .where('userId', user.id)
      .orderBy('createdAt', 'desc')
      .limit(100)

    return response.ok(history)
  }

  /**
   * @clear
   * @summary Effacer tout l'historique de recherche
   * @responseBody 204 - No content
   */
  async clear({ auth, response }: HttpContext) {
    const user = auth.user!
    await SearchHistory.query().where('userId', user.id).delete()
    return response.noContent()
  }
}
