# Руководство по развертыванию Project Portal

## 🚀 Варианты развертывания

### 1. Docker (Рекомендуется)

#### Предварительные требования
- Docker 20.10+
- Docker Compose 2.0+
- Минимум 2GB RAM
- 10GB свободного места

#### Быстрый старт
```bash
# Клонирование репозитория
git clone <repository-url>
cd portal-BIZ

# Создание .env файла
cp .env.example .env

# Запуск всех сервисов
docker-compose up -d

# Инициализация базы данных
docker-compose exec app npx prisma db push
docker-compose exec app npm run db:seed

# Проверка статуса
docker-compose ps
```

#### Конфигурация Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:12345@db:5432/project_portal
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-key
    depends_on:
      - db
      - minio
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=12345
      - POSTGRES_DB=project_portal
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"

  minio:
    image: minio/minio:latest
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

volumes:
  postgres_data:
  minio_data:
```

### 2. Vercel (Serverless)

#### Предварительные требования
- Vercel аккаунт
- GitHub репозиторий
- PostgreSQL база данных (Supabase, PlanetScale, Neon)

#### Развертывание
```bash
# Установка Vercel CLI
npm i -g vercel

# Логин в Vercel
vercel login

# Деплой проекта
vercel

# Настройка переменных окружения
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

#### Конфигурация vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXTAUTH_URL": "@nextauth-url"
  }
}
```

### 3. Railway

#### Предварительные требования
- Railway аккаунт
- GitHub репозиторий

#### Развертывание
1. Подключите GitHub репозиторий к Railway
2. Добавьте PostgreSQL плагин
3. Настройте переменные окружения:
   - `DATABASE_URL` (автоматически)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

#### Railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### 4. DigitalOcean App Platform

#### Предварительные требования
- DigitalOcean аккаунт
- GitHub репозиторий

#### Развертывание
1. Создайте новое приложение в DigitalOcean
2. Подключите GitHub репозиторий
3. Настройте переменные окружения
4. Добавьте PostgreSQL базу данных

#### .do/app.yaml
```yaml
name: project-portal
services:
- name: web
  source_dir: /
  github:
    repo: your-username/portal-BIZ
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
  - key: NEXTAUTH_SECRET
    value: your-secret-key
  - key: NEXTAUTH_URL
    value: https://your-app.ondigitalocean.app

databases:
- name: db
  engine: PG
  version: "15"
```

### 5. AWS (EC2 + RDS)

#### Предварительные требования
- AWS аккаунт
- EC2 инстанс (t3.medium или больше)
- RDS PostgreSQL инстанс

#### Настройка EC2
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2
sudo npm install -g pm2

# Клонирование репозитория
git clone <repository-url>
cd portal-BIZ

# Установка зависимостей
npm install

# Сборка приложения
npm run build

# Запуск с PM2
pm2 start npm --name "project-portal" -- start
pm2 save
pm2 startup
```

#### Настройка RDS
1. Создайте PostgreSQL инстанс в RDS
2. Настройте Security Groups
3. Создайте базу данных
4. Настройте переменные окружения

### 6. Google Cloud Platform

#### Предварительные требования
- GCP аккаунт
- Cloud SQL PostgreSQL
- Cloud Run или App Engine

#### Cloud Run развертывание
```bash
# Установка gcloud CLI
curl https://sdk.cloud.google.com | bash

# Логин в GCP
gcloud auth login

# Настройка проекта
gcloud config set project YOUR_PROJECT_ID

# Сборка и деплой
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/project-portal
gcloud run deploy --image gcr.io/YOUR_PROJECT_ID/project-portal --platform managed
```

## 🔧 Конфигурация

### Переменные окружения

#### Обязательные
```env
# База данных
DATABASE_URL="postgresql://username:password@host:port/database"

# Аутентификация
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key-here"

# Приложение
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

#### Опциональные
```env
# CDN
CDN_PROVIDER="cloudinary"
CDN_BASE_URL="https://res.cloudinary.com/your-cloud"
CDN_API_KEY="your-api-key"
CDN_API_SECRET="your-api-secret"

# Мониторинг
ALERTS_ENABLED="true"
ALERT_EMAIL="admin@your-domain.com"
ALERT_WEBHOOK="https://hooks.slack.com/your-webhook"

# Файлы
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
```

### Настройка базы данных

#### PostgreSQL
```sql
-- Создание базы данных
CREATE DATABASE project_portal;

-- Создание пользователя
CREATE USER portal_user WITH PASSWORD 'secure_password';

-- Назначение прав
GRANT ALL PRIVILEGES ON DATABASE project_portal TO portal_user;
```

#### Миграции
```bash
# Применение миграций
npx prisma migrate deploy

# Генерация клиента
npx prisma generate

# Заполнение тестовыми данными
npm run db:seed
```

## 📊 Мониторинг и логирование

### Health Checks
```bash
# Проверка состояния
curl https://your-domain.com/api/health

# Мониторинг в браузере
https://your-domain.com/monitoring
```

### Логи
```bash
# Docker логи
docker-compose logs -f app

# PM2 логи
pm2 logs project-portal

# Системные логи
tail -f /var/log/nginx/access.log
```

### Метрики
- **CPU**: < 70%
- **Memory**: < 80%
- **Disk**: < 85%
- **Response Time**: < 2s
- **Error Rate**: < 5%

## 🔒 Безопасность

### SSL/TLS
```bash
# Let's Encrypt (Certbot)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Firewall
```bash
# UFW настройка
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Backup
```bash
# Автоматический бэкап
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
aws s3 cp backup_*.sql s3://your-backup-bucket/
```

## 🚨 Troubleshooting

### Частые проблемы

#### 1. Ошибка подключения к базе данных
```bash
# Проверка подключения
npx prisma db pull

# Перезапуск базы данных
docker-compose restart db
```

#### 2. Ошибки миграций
```bash
# Сброс базы данных
npx prisma db push --force-reset

# Применение миграций заново
npx prisma migrate deploy
```

#### 3. Проблемы с файлами
```bash
# Проверка прав доступа
chmod -R 755 uploads/

# Очистка старых файлов
find uploads/ -type f -mtime +30 -delete
```

#### 4. Высокое использование памяти
```bash
# Перезапуск приложения
pm2 restart project-portal

# Очистка кэша
npm run build
```

### Логи и диагностика
```bash
# Проверка статуса сервисов
systemctl status nginx
systemctl status postgresql

# Анализ логов
journalctl -u nginx -f
journalctl -u postgresql -f
```

## 📈 Масштабирование

### Горизонтальное масштабирование
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
```

### Вертикальное масштабирование
- **CPU**: 2-4 ядра
- **RAM**: 4-8GB
- **Storage**: SSD 50-100GB

### Load Balancer
```nginx
# nginx.conf
upstream app {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://app;
    }
}
```

## 🎯 Production Checklist

- [ ] SSL сертификат установлен
- [ ] Переменные окружения настроены
- [ ] База данных настроена и протестирована
- [ ] Backup система настроена
- [ ] Мониторинг настроен
- [ ] Логирование настроено
- [ ] Firewall настроен
- [ ] CDN настроен (опционально)
- [ ] Health checks работают
- [ ] Performance тесты пройдены

---

**Готово к продакшену!** 🚀
