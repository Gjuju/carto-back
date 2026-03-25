import path from 'node:path'
import url from 'node:url'

export default {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + '/../',
  title: 'Carto API',
  version: '1.0.0',
  description: 'API backend pour application de cartographie cadastrale',
  tagIndex: 2,
  info: {
    title: 'Carto API',
    version: '1.0.0',
    description: 'API backend pour application de cartographie cadastrale',
  },
  snakeCase: true,
  debug: false,
  ignore: ['/swagger', '/docs'],
  preferredPutPatch: 'PUT',
  persistAuthorization: true,
  common: {
    headers: {},
    parameters: {},
  },
  authMiddlewares: ['auth'],
  defaultSecurityScheme: 'BearerAuth',
  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
    },
  },
}
