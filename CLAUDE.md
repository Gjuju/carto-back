# CLAUDE.md — carto-back

API backend AdonisJS 6 pour une application de cartographie (parcelles cadastrales). Authentification par tokens, gestion de favoris et historique de recherche.

## Commandes

```bash
node ace serve --watch  # Serveur de dev avec hot reload
node ace build          # Build production
node ace test           # Lancer les tests (Japa)
node ace migration:run  # Appliquer les migrations
npm run lint            # ESLint
npm run typecheck       # Vérification TypeScript
```

## Stack technique

- **Framework** : AdonisJS 6 (ESM, TypeScript)
- **ORM** : Lucid (SQLite via better-sqlite3, fichier `tmp/db.sqlite3`)
- **Auth** : Tokens opaques (préfixe `oat_`, expiration 30j, table `auth_access_tokens`)
- **Validation** : VineJS (`@vinejs/vine`)
- **Hash** : Scrypt
- **Tests** : Japa avec `@japa/api-client`, `@japa/assert`, `@japa/plugin-adonisjs`

## Architecture & conventions AdonisJS 6

### Structure des fichiers

```
app/controllers/   # Contrôleurs HTTP (snake_case: auth_controller.ts)
app/models/        # Modèles Lucid (PascalCase: User.ts, Favorite.ts)
app/validators/    # Validateurs Vine (snake_case: auth_validator.ts)
app/middleware/    # Middleware (snake_case: auth_middleware.ts)
app/exceptions/    # Gestionnaires d'erreurs
app/services/      # Services métier (à créer selon besoin)
config/            # Fichiers de configuration
start/             # Bootstrap (routes.ts, kernel.ts, env.ts)
database/migrations/  # Migrations Lucid
tests/unit/        # Tests unitaires (*.spec.ts)
tests/functional/  # Tests fonctionnels / API (*.spec.ts)
```

### Imports (subpath imports)

Toujours utiliser les alias `#` définis dans `package.json` :

```ts
import User from '#models/User'
import { registerValidator } from '#validators/auth_validator'
import AuthController from '#controllers/auth_controller'
```

Ne **jamais** utiliser de chemins relatifs (`../models/User`).

### Conventions de nommage

- **Fichiers contrôleurs/validators/middleware** : `snake_case` (ex: `auth_controller.ts`)
- **Fichiers modèles** : `PascalCase` (ex: `User.ts`, `Favorite.ts`)
- **Tables BDD** : `snake_case` pluriel (ex: `users`, `search_histories`)
- **Colonnes BDD** : `snake_case` (ex: `full_name`, `created_at`)
- **Propriétés modèles** : `camelCase` (ex: `fullName`) — Lucid convertit automatiquement
- **Routes API** : préfixe `/api`, snake_case (ex: `/api/auth/register`, `/api/favorites`)

### Routes

- Routes publiques : `/api/auth/register`, `/api/auth/login`
- Routes protégées : encadrées par `middleware.auth()` dans un groupe
- Toujours utiliser les méthodes HTTP appropriées (GET lecture, POST création, DELETE suppression)

### Contrôleurs

- Un contrôleur par ressource, actions CRUD comme méthodes
- Utiliser `HttpContext` destructuré : `async login({ request, response }: HttpContext)`
- Valider les entrées avec les validators Vine avant tout traitement

### Modèles Lucid

- Décorateurs : `@column()`, `@column.dateTime({ autoCreate: true })`, `@hasMany()`, `@belongsTo()`
- Utiliser `DbAccessTokensProvider` pour les tokens d'auth sur le modèle User
- Toujours déclarer `declare` pour les propriétés (pas d'initialisation)

### Validation (VineJS)

- Définir les schémas dans `app/validators/` et les exporter
- Utiliser `vine.compile()` pour créer des validators réutilisables
- Appeler `request.validateUsing(validator)` dans le contrôleur

### Migrations

- Créer via `node ace make:migration <nom>`
- Méthodes `up()` et `down()` obligatoires
- Clés étrangères avec `onDelete('CASCADE')` quand approprié

### Tests

- Framework : Japa (pas Jest ni Vitest)
- Tests fonctionnels : `tests/functional/*.spec.ts` — tester les endpoints API
- Tests unitaires : `tests/unit/*.spec.ts`
- Lancer : `node ace test` ou `node ace test --files="functional"`

## Base de données

Tables : `users`, `auth_access_tokens`, `favorites`, `search_histories`
- `favorites` : stocke les parcelles favorites (parcelle_idu, commune, section, numero, label, geometry)
- `search_histories` : historique de recherche (query, type, result_count, metadata JSON)

## Swagger / AutoSwagger

- **Package** : `adonis-autoswagger` — génération automatique de la doc OpenAPI
- **Config** : `config/swagger.ts`
- **Routes** : `GET /swagger` (JSON OpenAPI), `GET /docs` (UI Swagger)
- **UI** : <http://localhost:3333/docs>

### Annotations JSDoc (contrôleurs)

Chaque méthode de contrôleur doit avoir un bloc JSDoc dont **la première ligne est `@<nomDeLaMethode>`** (obligatoire pour qu'AutoSwagger associe le commentaire à la bonne action).

```ts
/**
 * @index
 * @summary Liste des favoris
 * @responseBody 200 - <Favorite[]>
 */
async index({ auth, response }: HttpContext) { ... }

/**
 * @store
 * @summary Créer un favori
 * @requestBody <myValidator>
 * @responseBody 201 - <Favorite>
 * @responseBody 422 - Validation error
 */
async store({ auth, request, response }: HttpContext) { ... }

/**
 * @destroy
 * @paramPath id - Description - @type(number) @required
 * @responseBody 204 - No content
 */
async destroy({ params, response }: HttpContext) { ... }
```

### Annotations disponibles

- `@summary` : résumé court de l'endpoint
- `@responseBody <status> - <Model>` / `<Model[]>` / `{"json": "inline"}` / texte libre
- `@requestBody <ValidatorName>` / `<Model>` / `{"json": "inline"}`
- `@paramPath <nom> - Description - @type(string) @required`
- `@paramQuery <nom> - Description - @type(string)`

### Modifiers sur les modèles

- `.with(relation)` : inclure une relation
- `.exclude(prop1, prop2)` : exclure des propriétés
- `.only(prop1, prop2)` : sélectionner des propriétés
- `.append("key":"value")` : ajouter des propriétés
- `.paginated()` : structure paginée `{"data": [], "meta": {}}`

## CORS

Origines autorisées : `localhost:4200` (frontend Angular/Ionic), `localhost:3333`, `capacitor://localhost` (app mobile)
