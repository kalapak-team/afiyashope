# Afiya Shope

Khmer-first luxury abaya catalog with a public Next.js storefront, a separate Next.js owner dashboard, and a Laravel 13 JSON API backed by PostgreSQL.

```text
user-frontend/   Next.js customer catalog — http://localhost:3000
admin-frontend/  Next.js owner dashboard — http://localhost:3001
backend/         Laravel API — http://localhost:8000
```

No Docker is used. Create `afiya_shope_db` in pgAdmin before running migrations; migrations only manage tables and never create or drop the database.

## Requirements

- PHP version supported by Laravel 13 (PHP 8.3 or later) and Composer.
- Enable PHP's `pdo_pgsql` extension. Verify it with `php -m` and confirm `pdo_pgsql` appears.
- Node.js 20.9 or later and npm.
- PostgreSQL 18 running locally, with the `afiya_shope_db` database already created in pgAdmin.

## Step 1 — Backend and database

1. In `backend`, copy `.env.example` to `.env`. The local `.env` is ignored by Git.
2. Set `DB_CONNECTION=pgsql`, `DB_HOST=127.0.0.1`, `DB_PORT=5432`, `DB_DATABASE=afiya_shope_db`, `DB_USERNAME=postgres`, and your local `DB_PASSWORD`. The example file intentionally contains only a password placeholder.
3. To enable admin login, set `OWNER_EMAIL` and `OWNER_PASSWORD` in `backend/.env`; choose a strong owner password. The catalog and public settings can be seeded without owner credentials.
4. Install and initialize:

   ```powershell
   cd backend
   composer install
   php artisan key:generate
   php artisan migrate:status
   php artisan migrate --seed
   php artisan storage:link
   php artisan serve --host=127.0.0.1 --port=8000
   ```

`php artisan migrate:status` verifies the PostgreSQL connection and reports migration status before migrations are run. On a new database, `Migration table not found` is expected and indicates that Laravel connected before the first migration; continue with `php artisan migrate --seed`. If it reports that the PDO driver is missing, enable `pdo_pgsql` in the PHP configuration used by the CLI and restart the terminal. The test suite is configured to use the **separate** `afiya_shope_test` database; create that database in pgAdmin before running tests. Never point tests at `afiya_shope_db`.

The default backend seed creates shop settings and four sample products. It creates the owner account only when valid `OWNER_EMAIL` and `OWNER_PASSWORD` values are configured. To add 50 realistic Khmer demo products for pagination testing, run this separately after migrating:

```powershell
cd backend
php artisan db:seed --class=DemoProductsSeeder
```

The demo seeder is safe to rerun and adds products without replacing the four default samples. Create or edit shop products from the admin dashboard.

### Backend API tests

```powershell
cd backend
php artisan test
```

Tests use the PostgreSQL database `afiya_shope_test` as declared in `phpunit.xml`, never the development database. Ensure it exists and that the test DB user can create tables before running the suite.

## Step 2 — Admin frontend

```powershell
cd admin-frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). The owner signs in with the email/password configured for the seeded account. The application proxy stores the Sanctum token in an HttpOnly cookie; all dashboard routes require that cookie.

## Step 3 — Public frontend

```powershell
cd user-frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in each frontend's `.env.local` if it differs from the provided example. The public catalog supports server-side search, tag filtering, pagination, product detail pages, and Open Graph metadata.

For static type and production-build checks, run `npm run build` in each frontend.

## Database and environment safety

- The real local PostgreSQL password belongs only in the ignored `backend/.env`; never commit it, paste it into source, or put it in `backend/.env.example`.
- The committed example files use placeholders. Rotate any credentials that have been shared outside your local machine.
- Never expose PostgreSQL port 5432 to the public internet.
- Production must use a **new strong database password** and a dedicated least-privilege database user, not `postgres`.
- Configure `OWNER_EMAIL` and `OWNER_PASSWORD` only in the backend environment. Owner seeding is idempotent and hashes the password.
- Never place database credentials, Laravel app keys, owner credentials, or Sanctum tokens in either frontend. Frontends only need `NEXT_PUBLIC_API_URL`.

## Images and API

The API stores image paths, not Base64. In development, uploaded JPEG/PNG/WebP images use Laravel's public disk and require `php artisan storage:link`. Set `FILESYSTEM_DISK` to an S3-compatible disk and configure its environment values for Cloudflare R2 or another production object store.

API endpoints are versioned under `/api/v1`:

- Public: `GET /products`, `GET /products/{id}`, and `GET /settings`.
- Auth: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, and `PUT /auth/password`.
- Owner: product CRUD, image upload/removal/reordering, shop settings, avatar and hero-banner uploads, and dashboard stats.

Public API CORS origins come from `CORS_ALLOWED_ORIGINS`. The development example allows only `http://localhost:3000` and `http://localhost:3001`.

## Deployment

### Frontends on Vercel

Create two separate Vercel projects from the repository:

1. Customer site: set the project **Root Directory** to `user-frontend`.
2. Owner dashboard: set the project **Root Directory** to `admin-frontend`.
3. Set `NEXT_PUBLIC_API_URL` in both projects to the production Laravel API URL. Use HTTPS.
4. Deploy both Next.js projects with their default install/build settings. Configure the production storefront and dashboard origins in the backend's `CORS_ALLOWED_ORIGINS`.

### Laravel API on a VPS

Deploy `backend` to a supported PHP VPS; do not deploy Laravel as a Vercel serverless project. Configure PHP 8.3+, Composer, PostgreSQL access, a web server, and an S3-compatible image bucket as appropriate.

Production checklist:

- Set `APP_ENV=production` and **`APP_DEBUG=false`**; keep the generated `APP_KEY` private.
- Use HTTPS for the API, database connections where supported, and the S3-compatible storage endpoint.
- Use a **new strong database password** and a dedicated database user with only the required privileges.
- Restrict database network access; do not expose port 5432 publicly.
- Set `CORS_ALLOWED_ORIGINS` to the exact HTTPS origins of the two Vercel frontends.
- Run `php artisan migrate --force` as a controlled deployment step.
- Configure and monitor queue workers if queued jobs are enabled.
- Configure production cache (for example Redis) and run `php artisan config:cache`, `php artisan route:cache`, and `php artisan view:cache` as appropriate.
- Run `php artisan storage:link` only when using the local public disk. For S3/R2, configure the S3-compatible disk and public asset URL instead.
- Back up PostgreSQL and object storage; use appropriate retention, monitoring, and rate limits.

### Managed PostgreSQL 18

PostgreSQL 18 may instead be hosted by a managed PostgreSQL provider. Set the production `DB_*` values to that provider's connection details, enable SSL as required, use a dedicated database/user, restrict network access to the API host, and keep all credentials exclusively in the backend environment.
