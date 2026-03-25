import type { HttpContext } from '@adonisjs/core/http'
import Favorite from '#models/favorite'

export default class FavoritesController {

  /**
   * @index
   * @summary Liste des favoris de l'utilisateur
   * @responseBody 200 - <Favorite[]>
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const favorites = await Favorite.query().where('userId', user.id).orderBy('createdAt', 'desc')
    return response.ok(favorites)
  }

  /**
   * @show
   * @summary Récupérer un favori par son ID
   * @paramPath id - ID du favori - @type(number) @required
   * @responseBody 200 - <Favorite>
   * @responseBody 404 - Favori non trouvé
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const favorite = await Favorite.query()
      .where('id', params.id)
      .where('userId', user.id)
      .firstOrFail()

    return response.ok(favorite)
  }

  /**
   * @store
   * @summary Ajouter une parcelle en favori
   * @requestBody {"parcelleIdu": "string", "commune": "string", "section": "string", "numero": "string", "label": "string|null", "geometry": {}}
   * @responseBody 201 - <Favorite>
   * @responseBody 422 - Validation error
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const data = request.only(['parcelleIdu', 'commune', 'section', 'numero', 'label', 'geometry'])

    const favorite = await Favorite.create({
      userId: user.id,
      ...data,
    })
    return response.created(favorite)
  }

  /**
   * @destroy
   * @summary Supprimer un favori
   * @paramPath id - ID du favori - @type(number) @required
   * @responseBody 204 - No content
   * @responseBody 404 - Favori non trouvé
   */
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
