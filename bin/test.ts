import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'
import { configure, processCLIArgs, run } from '@japa/runner'

const APP_ROOT = new URL('../', import.meta.url)

const importer = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/kernel')
    })
    app.ready(async () => {
      await import('#start/routes')
    })
    app.starting(async () => {})
  })
  .testRunner()
  .configure(async (app) => {
    const { assert } = await import('@japa/assert')
    const { apiClient } = await import('@japa/api-client')
    const { pluginAdonisJS } = await import('@japa/plugin-adonisjs')

    processCLIArgs(process.argv.splice(2))
    configure({
      suites: [
        { name: 'unit', files: ['tests/unit/**/*.spec.ts'] },
        { name: 'functional', files: ['tests/functional/**/*.spec.ts'] },
      ],
      plugins: [assert(), apiClient(), pluginAdonisJS(app)],
    })
  })
  .run(() => run())
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
