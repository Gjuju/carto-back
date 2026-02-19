/**
 * Type augmentation imports for AdonisJS.
 *
 * These ensure TypeScript picks up module augmentations from AdonisJS
 * packages (e.g. `validateUsing` on Request, `auth` on HttpContext).
 *
 * DO NOT REMOVE.
 */
import '@adonisjs/core/providers/vinejs_provider'
import '@adonisjs/auth/initialize_auth_middleware'
