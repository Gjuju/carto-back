import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import hash from '@adonisjs/core/services/hash'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '#validators/auth_validator'

export default class AuthController {
  /**
   * @register
   * @summary Créer un nouveau compte
   * @requestBody <registerValidator>
   * @responseBody 201 - {"user": {"id": 1, "email": "user@example.com", "fullName": "John Doe"}, "token": {"type": "bearer", "value": "oat_xxx", "expiresAt": "2026-04-17T00:00:00.000Z"}}
   * @responseBody 422 - Validation error
   */
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)
    const user = await User.create(data)
    const token = await User.accessTokens.create(user)

    return response.created({
      user: { id: user.id, email: user.email, fullName: user.fullName },
      token: {
        type: 'bearer',
        value: token.value!.release(),
        expiresAt: token.expiresAt?.toISOString() ?? null,
      },
    })
  }

  /**
   * @login
   * @summary Connexion utilisateur
   * @requestBody <loginValidator>
   * @responseBody 200 - {"user": {"id": 1, "email": "user@example.com", "fullName": "John Doe"}, "token": {"type": "bearer", "value": "oat_xxx", "expiresAt": "2026-04-17T00:00:00.000Z"}}
   * @responseBody 400 - Invalid credentials
   */
  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return response.ok({
      user: { id: user.id, email: user.email, fullName: user.fullName },
      token: {
        type: 'bearer',
        value: token.value!.release(),
        expiresAt: token.expiresAt?.toISOString() ?? null,
      },
    })
  }

  /**
   * @logout
   * @summary Déconnexion (révoque le token)
   * @responseBody 204 - No content
   */
  async logout({ auth, response }: HttpContext) {
    const user = auth.user!
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    return response.noContent()
  }

  /**
   * @me
   * @summary Profil de l'utilisateur connecté
   * @responseBody 200 - {"id": 1, "email": "user@example.com", "fullName": "John Doe", "createdAt": "2026-03-18T00:00:00.000Z"}
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.user!
    return response.ok({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt.toISO(),
    })
  }

  /**
   * @forgotPassword
   * @summary Demander un lien de réinitialisation de mot de passe
   * @requestBody <forgotPasswordValidator>
   * @responseBody 200 - {"message": "If the account exists, a reset link has been generated."}
   */
  async forgotPassword({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)

    const user = await User.findBy('email', email)

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

      await PasswordResetToken.create({
        userId: user.id,
        tokenHash,
        expiresAt: DateTime.now().plus({ hours: 1 }),
      })

      const frontendUrl = env.get('APP_FRONTEND_URL', 'http://localhost:4200')
      const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`

      if (env.get('BREVO_API_KEY')) {
        try {
          await mail.send((message) => {
            message
              .to(user.email)
              .subject('Réinitialisation de votre mot de passe')
              .html(
                `<p>Bonjour${user.fullName ? ' ' + user.fullName : ''},</p>
<p>Vous avez demandé la réinitialisation de votre mot de passe Carto.</p>
<p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe (valable 1 heure) :</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`
              )
          })
        } catch (err) {
          logger.error({ err, userId: user.id }, 'Failed to send password reset email')
        }
      } else {
        logger.info(
          { userId: user.id, resetToken: rawToken, resetUrl },
          '[dev] BREVO_API_KEY not set — password reset token logged instead of emailed'
        )
      }
    }

    return response.ok({
      message: 'If the account exists, a reset link has been generated.',
    })
  }

  /**
   * @resetPassword
   * @summary Réinitialiser le mot de passe avec un token
   * @requestBody <resetPasswordValidator>
   * @responseBody 200 - {"message": "Password has been reset."}
   * @responseBody 400 - Invalid or expired token
   */
  async resetPassword({ request, response }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const resetToken = await PasswordResetToken.query()
      .where('token_hash', tokenHash)
      .whereNull('used_at')
      .where('expires_at', '>', DateTime.now().toSQL()!)
      .first()

    if (!resetToken) {
      return response.badRequest({ message: 'Invalid or expired token.' })
    }

    const user = await User.findOrFail(resetToken.userId)
    user.password = password
    await user.save()

    resetToken.usedAt = DateTime.now()
    await resetToken.save()

    await User.accessTokens.all(user).then((tokens) =>
      Promise.all(tokens.map((t) => User.accessTokens.delete(user, t.identifier)))
    )

    return response.ok({ message: 'Password has been reset.' })
  }

  /**
   * @changePassword
   * @summary Changer le mot de passe (utilisateur connecté)
   * @requestBody <changePasswordValidator>
   * @responseBody 200 - {"message": "Password has been changed."}
   * @responseBody 400 - Current password is incorrect
   */
  async changePassword({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { currentPassword, password } = await request.validateUsing(changePasswordValidator)

    const isValid = await hash.verify(user.password, currentPassword)
    if (!isValid) {
      return response.badRequest({ message: 'Current password is incorrect.' })
    }

    user.password = password
    await user.save()

    const currentTokenId = user.currentAccessToken.identifier
    const tokens = await User.accessTokens.all(user)
    await Promise.all(
      tokens
        .filter((t) => t.identifier !== currentTokenId)
        .map((t) => User.accessTokens.delete(user, t.identifier))
    )

    return response.ok({ message: 'Password has been changed.' })
  }
}
