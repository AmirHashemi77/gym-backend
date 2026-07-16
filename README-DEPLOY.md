# راهنمای Deploy بک‌اند و PostgreSQL روی Ubuntu

این راهنما برای معماری production فعلی پروژه نوشته شده است:

- image بک‌اند روی سیستم توسعه ساخته می‌شود؛ سورس روی سرور کپی نمی‌شود.
- سرور Ubuntu با معماری `linux/amd64` است.
- بک‌اند روی پورت `3000` اجرا می‌شود.
- PostgreSQL 16 داخل Docker و فقط در شبکه داخلی Compose اجرا می‌شود.
- migrationهای Prisma هنگام شروع بک‌اند خودکار اجرا می‌شوند.
- داده‌های PostgreSQL و فایل‌های upload در Docker volume پایدار می‌مانند.
- فایل Compose اصلی سرور در ریشه repository با نام `docker-compose.server.yml` قرار دارد.

> دستورهای بخش «سیستم توسعه» روی Mac اجرا می‌شوند و دستورهای بخش «سرور» بعد از SSH روی Ubuntu.

## ۱. پیش‌نیازهای سرور Ubuntu

ورود به سرور:

```bash
ssh ubuntu@185.226.116.18
```

نصب Docker با کاربر root:

```bash
sudo -i
apt update
apt install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
```

```bash
cat <<EOF > /etc/apt/sources.list.d/docker.sources
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

```bash
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker --version
docker compose version
docker run --rm hello-world
exit
```

دادن دسترسی Docker به کاربر `ubuntu` اختیاری است. پس از اجرای این دستورات باید یک بار logout/login کنید:

```bash
sudo usermod -aG docker ubuntu
exit
```

## ۲. بررسی build بک‌اند روی سیستم توسعه

در ریشه repository:

```bash
cd /Users/amirhashemi/Desktop/gym
npm --prefix gym-backend ci
npm --prefix gym-backend run build
test -f gym-backend/dist/main.js && echo "Backend build is valid"
```

خروجی آخر باید `Backend build is valid` باشد.

## ۳. ساخت Docker image بک‌اند

برای هر انتشار یک version مشخص انتخاب کنید. مثال این راهنما `1.0.0` است:

```bash
cd /Users/amirhashemi/Desktop/gym
docker buildx build \
  --platform linux/amd64 \
  --load \
  -t bahman-fitness-backend:1.0.0 \
  ./gym-backend
```

بررسی image و فایل اجرایی داخل آن:

```bash
docker image ls bahman-fitness-backend:1.0.0
docker run --rm \
  --entrypoint sh \
  bahman-fitness-backend:1.0.0 \
  -c 'test -f /app/dist/main.js && echo "Backend image is valid"'
```

اگر cache باعث شد تغییر جدید وارد image نشود، build کامل انجام دهید:

```bash
docker buildx build \
  --platform linux/amd64 \
  --load \
  --no-cache \
  -t bahman-fitness-backend:1.0.0 \
  ./gym-backend
```

## ۴. تبدیل image به archive

اگر از Docker Registry استفاده نمی‌کنید، image را با `docker save` به archive تبدیل کنید. از `docker export` استفاده نکنید؛ آن دستور برای container است و metadata و tag مناسب image را نگه نمی‌دارد.

```bash
docker save bahman-fitness-backend:1.0.0 \
  | gzip > bahman-fitness-backend-1.0.0.tar.gz
```

بررسی فایل:

```bash
ls -lh bahman-fitness-backend-1.0.0.tar.gz
```

## ۵. آماده‌سازی مسیر و انتقال فایل‌ها

روی سیستم توسعه:

```bash
ssh ubuntu@185.226.116.18 "mkdir -p /home/ubuntu/bahman-fitness"
```

در deploy اولیه، image، Compose و نمونه env را منتقل کنید:

```bash
scp \
  /Users/amirhashemi/Desktop/gym/bahman-fitness-backend-1.0.0.tar.gz \
  /Users/amirhashemi/Desktop/gym/docker-compose.server.yml \
  /Users/amirhashemi/Desktop/gym/.env.example \
  ubuntu@185.226.116.18:/home/ubuntu/bahman-fitness/
```

اگر `Permission denied` دریافت شد، روی سرور مالکیت پوشه را اصلاح کنید:

```bash
sudo chown -R ubuntu:ubuntu /home/ubuntu/bahman-fitness
sudo chmod 755 /home/ubuntu/bahman-fitness
```

## ۶. ساخت فایل `.env` روی سرور

```bash
ssh ubuntu@185.226.116.18
cd /home/ubuntu/bahman-fitness
cp .env.example .env
nano .env
```

حداقل تنظیمات لازم:

```env
IMAGE_TAG=1.0.0

POSTGRES_DB=bahman_fitness
POSTGRES_USER=postgres
POSTGRES_PASSWORD=REPLACE_WITH_RANDOM_HEX_PASSWORD

JWT_ACCESS_SECRET=REPLACE_WITH_RANDOM_ACCESS_SECRET
JWT_REFRESH_SECRET=REPLACE_WITH_DIFFERENT_RANDOM_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

FRONTEND_URL=http://185.226.116.18
SWAGGER_ENABLED=false
```

تولید مقدارهای امن روی سرور:

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
echo "JWT_ACCESS_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
```

هر خروجی را در محل متناظر `.env` قرار دهید. فایل `.env` نباید commit یا منتشر شود. برای ذخیره در nano از `Ctrl+O`، Enter و سپس `Ctrl+X` استفاده کنید.

اگر S3 یا Web Push استفاده می‌شود، متغیرهای مربوط به آن‌ها را نیز در `.env` کامل کنید. `VAPID_PRIVATE_KEY` فقط متعلق به بک‌اند است و نباید داخل image فرانت قرار گیرد.

## ۷. load و اجرای بک‌اند و دیتابیس

روی سرور:

```bash
cd /home/ubuntu/bahman-fitness
docker load -i bahman-fitness-backend-1.0.0.tar.gz
docker image ls | grep bahman-fitness
docker compose -f docker-compose.server.yml config --quiet
```

ابتدا دیتابیس را اجرا کنید:

```bash
docker compose -f docker-compose.server.yml up -d postgres
docker compose -f docker-compose.server.yml ps
```

پس از healthy شدن PostgreSQL، بک‌اند را اجرا کنید:

```bash
docker compose -f docker-compose.server.yml up -d backend
sleep 45
docker compose -f docker-compose.server.yml ps
```

بک‌اند هنگام startup دستور `prisma migrate deploy` را اجرا می‌کند. وضعیت مطلوب:

```text
postgres   Up ... (healthy)
backend    Up ... (healthy)
```

بررسی API:

```bash
curl http://127.0.0.1:3000/api/v1/health
```

مشاهده لاگ:

```bash
docker compose -f docker-compose.server.yml logs backend --tail=200
docker compose -f docker-compose.server.yml logs postgres --tail=200
docker compose -f docker-compose.server.yml logs -f backend
```

## ۸. firewall

اگر دسترسی مستقیم API روی پورت 3000 لازم است:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw enable
sudo ufw status
```

اگر تمام درخواست‌ها از Nginx فرانت عبور می‌کنند، باز کردن عمومی پورت `3000` لازم نیست. Compose آن را روی host منتشر کرده، اما firewall می‌تواند دسترسی بیرونی را مسدود نگه دارد.

## ۹. انتقال دیتابیس لوکال به سرور

این عملیات داده‌های فعلی دیتابیس سرور را جایگزین می‌کند. ابتدا backup سرور بگیرید.

روی سیستم توسعه، PostgreSQL لوکال را اجرا و dump ایجاد کنید:

```bash
cd /Users/amirhashemi/Desktop/gym
docker compose -f gym-backend/docker-compose.yml up -d postgres
docker compose -f gym-backend/docker-compose.yml \
  exec -T postgres \
  pg_dump -U postgres -d bahman_fitness -Fc --no-owner --no-acl \
  > bahman-fitness-local.dump
ls -lh bahman-fitness-local.dump
```

انتقال dump:

```bash
scp bahman-fitness-local.dump \
  ubuntu@185.226.116.18:/home/ubuntu/bahman-fitness/
```

روی سرور ابتدا backup بگیرید:

```bash
cd /home/ubuntu/bahman-fitness
docker compose -f docker-compose.server.yml \
  exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner --no-acl' \
  > server-before-import.dump
```

بک‌اند و فرانت را متوقف، schema را بازسازی و dump را restore کنید:

```bash
docker compose -f docker-compose.server.yml stop frontend backend
docker compose -f docker-compose.server.yml \
  exec -T postgres \
  sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
docker compose -f docker-compose.server.yml \
  exec -T postgres \
  sh -c 'pg_restore -v --exit-on-error --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < bahman-fitness-local.dump
docker compose -f docker-compose.server.yml up -d
```

## ۱۰. انتشار نسخه جدید بک‌اند

بهتر است فرانت و بک‌اند هر release یک tag مشترک داشته باشند؛ زیرا Compose فعلی از متغیر مشترک `IMAGE_TAG` استفاده می‌کند. برای مثال نسخه بعدی `1.0.1`:

```bash
docker buildx build \
  --platform linux/amd64 \
  --load \
  -t bahman-fitness-backend:1.0.1 \
  ./gym-backend
docker save bahman-fitness-backend:1.0.1 \
  | gzip > bahman-fitness-backend-1.0.1.tar.gz
scp bahman-fitness-backend-1.0.1.tar.gz \
  ubuntu@185.226.116.18:/home/ubuntu/bahman-fitness/
```

روی سرور:

```bash
cd /home/ubuntu/bahman-fitness
docker load -i bahman-fitness-backend-1.0.1.tar.gz
nano .env
```

`IMAGE_TAG=1.0.1` قرار دهید. قبل از اجرای Compose مطمئن شوید image فرانت با همین tag نیز موجود است. سپس:

```bash
docker compose -f docker-compose.server.yml up -d --force-recreate backend
sleep 45
docker compose -f docker-compose.server.yml ps
```

اگر فقط بک‌اند تغییر کرده و نمی‌خواهید فرانت را rebuild کنید، image فعلی فرانت را با tag release جدید نیز tag کنید:

```bash
docker tag bahman-fitness-frontend:1.0.0 bahman-fitness-frontend:1.0.1
```

## ۱۱. نگهداری و عیب‌یابی

### محل ذخیره ویدیوهای آپلودشده از فرم حرکت

فرانت فایل را به endpoint زیر ارسال می‌کند:

```text
POST /api/v1/upload/video
```

اگر تنظیمات `S3_*` در `.env` خالی باشند، بک‌اند ویدیو را در مسیر زیر داخل volume پایدار ذخیره می‌کند:

```text
/app/public/uploads/videos/<uuid>.<extension>
```

پاسخ API یک URL نسبی مانند زیر برمی‌گرداند و فرانت همان مقدار را در `videoUrl` حرکت ذخیره می‌کند:

```text
/uploads/videos/550e8400-e29b-41d4-a716-446655440000.mp4
```

این فایل‌ها در volume با نام `bahman-fitness_uploads` باقی می‌مانند و با build یا recreate کردن container حذف نمی‌شوند. از `docker compose down -v` و `docker volume rm bahman-fitness_uploads` استفاده نکنید.

بررسی فایل‌های ذخیره‌شده:

```bash
docker exec bahman-fitness-backend-1 find /app/public/uploads/videos -maxdepth 1 -type f | head
curl -I http://127.0.0.1/uploads/videos/FILE_NAME.mp4
```

اگر `S3_BUCKET`، `S3_ENDPOINT`، `S3_ACCESS_KEY_ID` و `S3_SECRET_ACCESS_KEY` مقدار داشته باشند، سرویس به‌جای volume فایل را در S3 ذخیره می‌کند. برای اجبار به ذخیره local، این متغیرها را خالی نگه دارید.

## ۱۲. نگهداری عمومی و عیب‌یابی

```bash
docker compose -f docker-compose.server.yml ps -a
docker compose -f docker-compose.server.yml restart backend
docker compose -f docker-compose.server.yml logs backend --tail=200
docker inspect bahman-fitness-backend-1 --format '{{json .State.Health}}'
docker system df
```

توقف بدون حذف دیتابیس:

```bash
docker compose -f docker-compose.server.yml down
```

هرگز بدون backup از دستور زیر استفاده نکنید؛ این دستور volume دیتابیس و uploadها را حذف می‌کند:

```bash
docker compose -f docker-compose.server.yml down -v
```

پس از اطمینان از deploy موفق می‌توانید archive انتقالی را حذف کنید؛ image loadشده باقی می‌ماند:

```bash
rm bahman-fitness-backend-1.0.0.tar.gz
```
