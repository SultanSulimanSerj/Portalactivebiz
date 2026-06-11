# Production deployment (Manexa)

Manexa требует **custom Node server** (`node server.js`) — WebSocket и cron не работают на Vercel serverless.

## Минимальный стек (до ~500 пользователей, ~50–100 online)

1. VPS 4 vCPU / 8 GB RAM (для PDF — 8 GB+, отдельный CPU под Gotenberg)
2. `docker compose up -d` — Postgres, PgBouncer, Redis, MinIO, Gotenberg, **document-export-worker**
3. Скопировать `.env.example` → `.env`, **сменить все пароли**
4. `npm run build && pm2 start ecosystem.config.js` (поднимает app + **manexa-export-worker**)
5. HTTPS через Caddy/Nginx (см. `deploy/Caddyfile.example`)
6. `DATABASE_URL` через PgBouncer (`localhost:6432`) в production

### Переменные окружения (обязательные для интернета)

| Переменная | Назначение |
|------------|------------|
| `NEXTAUTH_SECRET` | Секрет JWT |
| `NEXTAUTH_URL` | Публичный URL с HTTPS |
| `CRON_SECRET` | Защита `/api/notifications/check-deadlines` |
| `REDIS_URL` | Socket.IO, rate limit, **очередь экспорта УПД** |
| `GOTENBERG_URL` | PDF из Excel (шаблон ФНС) |
| `POSTGRES_PASSWORD` | Пароль БД |
| `MINIO_ROOT_PASSWORD` | Пароль хранилища |

### Бэкапы

```bash
chmod +x scripts/backup-db.sh
# crontab: 0 3 * * * /path/to/scripts/backup-db.sh
```

## Экспорт УПД (Excel + PDF) — production

Экспорт **асинхронный**: API ставит задачу в Redis (BullMQ), воркер генерирует Excel и конвертирует в PDF через Gotenberg.

1. `REDIS_URL` обязателен
2. Запустить воркер: `npm run worker:export` или PM2-процесс `manexa-export-worker`
3. `docker compose up -d gotenberg document-export-worker`
4. Повторный экспорт без изменений — **мгновенный ответ** (кэш по `exportContentHash`)

### Масштабирование под нагрузку

| Компонент | Настройка |
|-----------|-----------|
| Воркеры экспорта | `DOCUMENT_EXPORT_WORKER_INSTANCES=2` в PM2, `DOCUMENT_EXPORT_WORKER_CONCURRENCY=3` |
| Gotenberg | Несколько реплик за LB, `GOTENBERG_URL` на балансировщик |
| Лимиты | `DOCUMENT_EXPORT_RATE_LIMIT_USER` / `DOCUMENT_EXPORT_RATE_LIMIT_COMPANY` |

Мониторинг: таблица `DocumentExportJob`, логи `pm2-export-worker-*.log`, длина очереди Redis `document-export`.

## Несколько инстансов (100–300+ online)

1. Установить `REDIS_URL=redis://localhost:6379` — Socket.IO Redis adapter
2. `PM2_INSTANCES=2` в `ecosystem.config.js` (cluster mode)
3. `DISABLE_IN_PROCESS_CRON=true` на app-инстансах
4. Отдельный worker: `node scripts/check-deadlines-worker.js` (cron 9:00)
5. Load balancer с **sticky sessions** или Redis adapter (рекомендуется)

### PgBouncer + Prisma

```
DATABASE_URL="postgresql://user:pass@localhost:6432/project_portal?pgbouncer=true&connection_limit=10"
```

Миграции выполняйте напрямую к Postgres (порт 5432), не через PgBouncer.

## Read replica (10k+ concurrent)

Prisma пока не поддерживает read replicas из коробки. Варианты:

- Тяжёлые read-only запросы (отчёты) — отдельный `DATABASE_READ_URL` + raw `pg` client
- Managed Postgres (RDS, Supabase) с автоматическим routing

## Мониторинг

- PM2: `pm2 monit`, логи в `./logs/`
- Postgres: `pg_stat_activity`, размер таблиц
- Алерты на disk, memory, connection pool exhaustion

## Чеклист перед публикацией

- [ ] HTTPS включён
- [ ] Дефолтные пароли изменены
- [ ] `CRON_SECRET` задан
- [ ] Rate limiting на login (встроен)
- [ ] `REDIS_URL` и воркер экспорта УПД запущены
- [ ] Gotenberg доступен (`GOTENBERG_URL`)
- [ ] Ежедневные бэкапы БД
- [ ] Firewall: открыты только 443, 22
