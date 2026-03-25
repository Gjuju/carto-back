import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'brevo',

  from: {
    address: env.get('MAIL_FROM_ADDRESS', 'noreply@example.com'),
    name: env.get('MAIL_FROM_NAME', 'Carto'),
  },

  mailers: {
    brevo: transports.brevo({
      key: env.get('BREVO_API_KEY', ''),
      baseUrl: 'https://api.brevo.com/v3',
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
