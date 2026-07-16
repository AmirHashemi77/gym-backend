# اجرای لوکال بک‌اند

این راهنما برای اجرای API پروژه با NestJS، Prisma و PostgreSQL در محیط توسعه است.

## پیش‌نیازها

- Node.js نسخه 20 LTS
- npm
- Docker Desktop و Docker Compose

## راه‌اندازی اولیه

```bash
cd /Users/amirhashemi/Desktop/gym/gym-backend
npm install
```

اگر فایل `.env` وجود ندارد، آن را از نمونه بسازید:

```bash
cp env.example .env
```

مقادیر اصلی محیط توسعه در `.env`:

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bahman_fitness?schema=public"
FRONTEND_URL="http://localhost:5173"
SWAGGER_ENABLED=true
```

دیتابیس را اجرا و وضعیت آن را بررسی کنید:

```bash
docker compose up -d postgres
docker compose ps
```

برای اولین اجرا، Prisma و دیتابیس را آماده کنید:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## اجرای روزمره

```bash
docker compose up -d postgres
npm run start:dev
```

آدرس‌ها:

- API: `http://localhost:3000/api/v1`
- Health check: `http://localhost:3000/api/v1/health`
- Swagger: `http://localhost:3000/api/docs`

## کاربران آزمایشی

پس از اجرای seed، رمز عبور همه کاربران `Password123!` است:

- مدیر: `09120000000`
- مربی: `09121111111`
- ورزشکار: `09122222222`

## متوقف کردن دیتابیس

```bash
docker compose down
```

این دستور volume دیتابیس را حذف نمی‌کند. برای حفظ اطلاعات از گزینه `-v` استفاده نکنید.

## رفع خطای اتصال Prisma به پورت 5433

```bash
docker compose ps
docker compose logs --tail=100 postgres
nc -vz localhost 5433
```

اگر کانتینر اجرا نشده بود، آن را بالا بیاورید و پس از healthy شدن، بک‌اند را دوباره اجرا کنید:

```bash
docker compose up -d postgres
npm run start:dev
```

