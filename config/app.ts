import env from '#start/env'
import { defineConfig } from '@adonisjs/core/http'
import { Secret } from '@adonisjs/core/helpers'

export const appKey = new Secret(env.get('APP_KEY'))

export const http = defineConfig({
  generateRequestId: true,
  allowMethodSpoofing: false,
  useAsyncLocalStorage: false,
  cookie: {},
})
