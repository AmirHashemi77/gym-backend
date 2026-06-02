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

The project is ready for VPS or Docker deployment. Configure `.env`, run PostgreSQL, then:

```bash
npm run prisma:deploy
npm run build
npm run start:prod
```
