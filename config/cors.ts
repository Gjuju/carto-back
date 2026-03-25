import { defineConfig } from '@adonisjs/cors'

export default defineConfig({
  enabled: true,
  origin: (requestOrigin) => {
    const allowedOrigins = [
      'http://localhost:4200',
      'http://localhost:3333',
      'http://localhost:8100',
      'capacitor://localhost',
      'http://localhost',
      'https://localhost',
    ]
    return allowedOrigins.includes(requestOrigin)
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})
