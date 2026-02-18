# Ecommerce Inventory

A full-stack inventory management application with:

- Laravel 12 REST API (JWT authentication)
- Next.js 16 frontend dashboard
- Product and category CRUD
- Pagination, search, and filtering

## Tech Stack

- Backend: PHP 8.2, Laravel 12, `tymon/jwt-auth`
- Frontend: Next.js 16, React 19, TypeScript
- Database: PostgreSQL recommended

Note: Product search in `app/Repositories/ProductRepository.php` uses `ILIKE`, which is PostgreSQL-specific.

## Monorepo Structure

```text
.
|-- app/                     # Laravel backend source
|-- routes/api.php           # API routes
|-- database/migrations/     # DB schema
|-- frontend/                # Next.js frontend app
|   |-- src/app/             # App Router pages
|   |-- src/utils/fetcher.ts # API client helper
|-- docs/openapi.yaml        # Swagger/OpenAPI spec
```

## Features

- JWT-based auth: register, login, me, refresh, logout
- Products:
  - list (paginated)
  - filter by category/search
  - create/update/delete (auth protected)
- Categories:
  - list (paginated)
  - create/update/delete (auth protected)
- Frontend dashboard with:
  - auth-aware root redirect (`/` -> `/dashboard` or `/login`)
  - products/categories management pages
  - custom delete confirmation modal and success toast

## API Base URLs

- Local backend: `http://localhost:8000/api`
- Production backend (example): `https://ecommerce-inventory-production.up.railway.app/api`

## API Documentation (Swagger/OpenAPI)

OpenAPI spec is available at:

- `docs/openapi.yaml`

Use with:

1. https://editor.swagger.io (import/paste `docs/openapi.yaml`)
2. Or VS Code OpenAPI extension for local preview

## Local Setup

### 1) Backend (Laravel)

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
```

Set DB values in `.env` and run:

```bash
php artisan migrate
php artisan serve
```

Backend runs on `http://localhost:8000`.

### 2) Frontend (Next.js)

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Run:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Environment Variables

### Backend (`.env` / Railway Variables)

- `APP_ENV`
- `APP_URL`
- `DB_*`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `CORS_ALLOWED_ORIGINS_PATTERNS`

### Frontend (Vercel / `.env.local`)

- `NEXT_PUBLIC_API_URL` (must point to backend `/api` base URL)

## Deployment

### Backend (Railway)

1. Deploy this repo as Laravel service.
2. Set backend env variables (DB, JWT, CORS).
3. Ensure migrations are run.
4. Confirm API health: `GET /api/products`.

### Frontend (Vercel)

1. Import the same repository.
2. Set **Root Directory** to `frontend`.
3. Add env:
   - `NEXT_PUBLIC_API_URL=https://ecommerce-inventory-production.up.railway.app/api`
4. Deploy.

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <jwt_token>
```

Token is returned by:

- `POST /api/register`
- `POST /api/login`

## API Endpoints (Summary)

Auth:

- `POST /api/register`
- `POST /api/login`
- `GET /api/me` (auth)
- `POST /api/refresh` (auth)
- `POST /api/logout` (auth)

Products:

- `GET /api/products`
- `GET /api/products/search?q=...`
- `GET /api/products/{id}`
- `POST /api/products` (auth)
- `PUT /api/products/{id}` (auth)
- `DELETE /api/products/{id}` (auth)

Categories:

- `GET /api/categories`
- `GET /api/categories/{id}`
- `POST /api/categories` (auth)
- `PUT /api/categories/{id}` (auth)
- `DELETE /api/categories/{id}` (auth)


