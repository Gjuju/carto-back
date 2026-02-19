import type { HttpContext } from '@adonisjs/core/http'
import Favorite from '#models/favorite'

export default class FavoritesController {
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const favorites = await Favorite.query().where('userId', user.id).orderBy('createdAt', 'desc')
    return response.ok(favorites)
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const data = request.only(['parcelleIdu', 'commune', 'section', 'numero', 'label', 'geometry'])

    const favorite = await Favorite.create({
      userId: user.id,
      ...data,
    })

    return response.created(favorite)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const favorite = await Favorite.query()
      .where('id', params.id)
      .where('userId', user.id)
      .firstOrFail()

    await favorite.delete()
    return response.noContent()
  }
}
