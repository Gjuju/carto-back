# carto-back

API backend AdonisJS 6 pour une application de cartographie (parcelles cadastrales françaises).
Authentification par tokens, gestion de favoris, historique de recherche et reset de mot de passe par email.

## Stack

- **Framework** : [AdonisJS 6](https://adonisjs.com) (ESM, TypeScript)
- **ORM** : Lucid (SQLite en dev via `better-sqlite3`, adaptable à MySQL/PostgreSQL en prod)
- **Auth** : tokens opaques (`oat_`, expiration 30j)
- **Validation** : [VineJS](https://vinejs.dev)
- **Mail** : [Brevo](https://www.brevo.com) (via `@adonisjs/mail`)
- **Rate limiting** : `@adonisjs/limiter` (store database)
- **Doc API** : `adonis-autoswagger` → `/docs`
- **Tests** : Japa

## Prérequis

- Node.js ≥ 20.6
- npm

## Installation (développement)

```bash
git clone <url-du-repo> carto-back
cd carto-back
npm install
```

### 1. Variables d'environnement

Copier le fichier d'exemple et le compléter :

```bash
cp .env.example .env
```

### 2. Générer une `APP_KEY`

La `APP_KEY` est une clé secrète utilisée pour signer/chiffrer les cookies, sessions et tokens.
**Ne jamais commiter ni partager cette clé.** Chaque environnement (dev / staging / prod) doit avoir la sienne.

```bash
node ace generate:key
```

La commande affiche une clé : copiez-la dans la variable `APP_KEY` de votre `.env`.

### 3. Migrations

```bash
node ace migration:run
```

Cela crée la base SQLite locale dans `tmp/db.sqlite3` (ignoré par git) avec toutes les tables.

### 4. Lancer le serveur de dev

```bash
node ace serve --watch
```

L'API est disponible sur <http://localhost:3333>.
La documentation Swagger UI est sur <http://localhost:3333/docs> (uniquement hors production).

## Configuration mail (reset de mot de passe)

Le flow "mot de passe oublié" envoie un email contenant un lien de reset.

- **En dev** : laisser `BREVO_API_KEY` vide dans le `.env`. Le token de reset sera affiché dans les logs de la console au lieu d'être envoyé par email.
- **En prod** : renseigner `BREVO_API_KEY`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` et `APP_FRONTEND_URL` pour que l'email contienne un lien pointant vers le frontend.

## Commandes utiles

```bash
node ace serve --watch      # Serveur de dev avec hot reload
node ace build              # Build production (→ dossier build/)
node ace test               # Lancer les tests (Japa)
node ace migration:run      # Appliquer les migrations
node ace migration:rollback # Revenir en arrière
node ace generate:key       # Générer une nouvelle APP_KEY
npm run lint                # ESLint
npm run typecheck           # Vérification TypeScript
```

## Déploiement (production)

### 1. Variables d'environnement

Sur le serveur de prod, définir **impérativement** :

```env
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
LOG_LEVEL=info
APP_KEY=<clé-générée-spécifiquement-pour-la-prod>
DB_CONNECTION=sqlite
LIMITER_STORE=database

BREVO_API_KEY=<clé-api-brevo>
MAIL_FROM_ADDRESS=noreply@votre-domaine.fr
MAIL_FROM_NAME=Carto
APP_FRONTEND_URL=https://votre-frontend.fr
```

⚠️ **Générer une `APP_KEY` dédiée à la prod** via `node ace generate:key` — ne jamais réutiliser celle de dev.

### 2. Build

```bash
npm ci --omit=dev   # ou : npm ci puis rm -rf node_modules après build
node ace build
cd build
npm ci --omit=dev
cp .env build/
```

### 3. Migrations

```bash
node ace migration:run --force
```

### 4. Lancer

```bash
node bin/server.js
```

Derrière un reverse proxy (nginx, Caddy) avec TLS.

### Sécurité production

- Swagger UI (`/docs`, `/swagger`) est **automatiquement désactivé** quand `NODE_ENV=production`.
- CORS : la liste des origines autorisées est définie dans [config/cors.ts](config/cors.ts). À adapter au domaine du frontend de prod.
- Rate limiting actif sur `/api/auth/login`, `/api/auth/register` et `/api/auth/forgot-password`.
- Tokens de reset stockés en SHA-256 hash (jamais en clair), valables 1 heure.

## API

Documentation interactive via Swagger UI : <http://localhost:3333/docs> (dev uniquement).
