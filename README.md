# Bahman Khanmohammadi Fitness API

Backend for a Persian RTL-ready fitness coaching web app.

## Stack

- Node.js, TypeScript, NestJS
- Prisma ORM, PostgreSQL
- JWT access token and refresh token
- Role Based Access Control: `ADMIN`, `COACH`, `STUDENT`
- Swagger: `/api/docs`
- Versioned REST API: `/api/v1`

## Run Locally

```bash
cp env.example .env
docker compose up -d postgres
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

PostgreSQL is exposed on `localhost:5433` to avoid conflicts with an existing local Postgres service.

## Seed Users

All seed users use password `Password123!`.

- Admin: `09120000000`
- Coach: `09121111111`
- Student: `09122222222`

## Main Endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register-student`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/profile`
- `POST /api/v1/auth/change-password`
- `POST /api/v1/users/students`
- `GET /api/v1/users/students`
- `GET /api/v1/users/students/:id`
- `PATCH /api/v1/users/students/:id`
- `DELETE /api/v1/users/students/:id`
- `POST /api/v1/exercises`
- `GET /api/v1/exercises`
- `GET /api/v1/exercises/:id`
- `PATCH /api/v1/exercises/:id`
- `DELETE /api/v1/exercises/:id`
- `POST /api/v1/exercises/:id/bookmark`
- `DELETE /api/v1/exercises/:id/bookmark`
- `POST /api/v1/programs`
- `GET /api/v1/programs`
- `GET /api/v1/programs/:id`
- `PATCH /api/v1/programs/:id`
- `DELETE /api/v1/programs/:id`
- `POST /api/v1/questions`
- `GET /api/v1/questions`
- `PATCH /api/v1/questions/:id/answer`
- `POST /api/v1/upload/video`
- `POST /api/v1/notifications/send`

## Response Format

```json
{
  "success": true,
  "message": "عملیات با موفقیت انجام شد",
  "data": {}
}
```

## Error Format

```json
{
  "success": false,
  "message": "اطلاعات ارسال‌شده معتبر نیست",
  "errors": []
}
```

## Deployment

### What Is Needed

- Production env values with real JWT secrets and the correct `DATABASE_URL`
- A PostgreSQL instance reachable from the API
- A process manager or Docker so the service restarts automatically
- A reverse proxy such as Nginx for HTTPS and domain routing
- Optional object storage for uploads; if S3 is not configured, uploads are stored in `public/uploads`

### VPS Deploy

```bash
cp .env.production.example .env.production
npm ci
npm run build
NODE_ENV=production npm run prisma:deploy
NODE_ENV=production npm run start:prod
```

For a real VPS, run the last command under `pm2` or `systemd`, and put Nginx in front of port `3000`.

### Docker Deploy

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.prod.yml up -d --build
```

The API will:

- wait for PostgreSQL health
- run `prisma migrate deploy` on startup
- expose `GET /api/v1/health` for health checks
- use the server-side `public` directory as a bind mount, so existing media and new uploads stay outside the image
- serve local fallback uploads from `public/uploads`

### Connect To Existing Nginx Frontend

If your frontend is already served by Nginx on the same VPS, the simplest setup is:

- keep frontend on `/`
- proxy `/api/` to this backend on `127.0.0.1:3000`
- proxy `/uploads/` to this backend so local uploaded files are reachable
- set the frontend API base URL to `/api/v1`

Use [deploy/nginx/frontend-with-api.conf.example](deploy/nginx/frontend-with-api.conf.example) as the template for your site config, or merge its `location /api/` and `location /uploads/` blocks into your current Nginx server block.

Important:

- `client_max_body_size 220M` is required if you want video upload to work through Nginx
- `FRONTEND_URL` in `.env.production` must be your real frontend domain, for example `https://app.example.com`
- in the production compose file, the backend is exposed only on `127.0.0.1:3000`, so Nginx on the same server can reach it but it is not publicly open

### Bring Up Database And API

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.prod.yml up -d postgres
docker compose -f docker-compose.prod.yml up -d api
docker compose -f docker-compose.prod.yml ps
```

Quick checks:

- API health: `curl http://127.0.0.1:3000/api/v1/health`
- DB logs: `docker compose -f docker-compose.prod.yml logs -f postgres`
- API logs: `docker compose -f docker-compose.prod.yml logs -f api`

### Manual Production Commands

```bash
NODE_ENV=production npm run prisma:deploy
NODE_ENV=production npm run build
NODE_ENV=production npm run start:prod
```
