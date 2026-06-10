# VPS deployment — Timeweb Cloud (replaces Vercel + Yandex Cloud)

Russia production runs on **one Timeweb VPS** — not Vercel, not Yandex Managed PostgreSQL, not Yandex Object Storage/CDN.

## Stack (MVP)

```
Internet → nginx (443, Let's Encrypt) → Next.js :3000 (Docker)
              ↘ /catalog/*  →  disk (/var/www/catalog)
PostgreSQL (Docker, localhost only)
```

| Component | Where | Notes |
|-----------|--------|--------|
| **OS** | Ubuntu 22.04 LTS | Timeweb marketplace or plain image |
| **App** | Docker (`next start` / standalone) | Behind nginx |
| **PostgreSQL** | Docker on same VPS | `DATABASE_URL` → `localhost:5432` |
| **Catalog images** | Folder on VPS disk | nginx serves `/catalog/` — no CDN for MVP |
| **Analytics** | Yandex Metrica (browser) | Free counter — not Yandex Cloud infra |
| **SSL** | certbot + Let's Encrypt | On VPS for `yourdomain.ru` |

**Target cost:** ~1 000–1 200 ₽/month (Timeweb Cloud 50: 4 GB RAM, 50 GB SSD).

---

## Timeweb VPS order checklist

| Setting | Choice |
|---------|--------|
| Provider | [Timeweb Cloud](https://timeweb.cloud) |
| Region | Russian DC closest to your customers (MSK / SPb / Novosibirsk) |
| OS | **Ubuntu 22.04 LTS** |
| Plan | **Cloud 50** (4 GB RAM, 50 GB SSD) — or Cloud 40 (2 GB) on tight budget |
| IPv4 | Yes |
| Windows | No |

---

## Server layout

```
/var/www/flower-shop/          # app repo / docker-compose
/var/www/catalog/              # product images (persistent volume)
/etc/nginx/sites-available/    # reverse proxy + static /catalog/
```

Suggested directories:

| Path | Purpose |
|------|---------|
| `/var/www/catalog/` | Image files (`bouquets/...`, `products/...`) |
| `pgdata` Docker volume | PostgreSQL data |
| `/var/backups/` | Optional `pg_dump` files |

---

## Docker Compose

Use the repo root [`docker-compose.yml`](../docker-compose.yml):

```bash
# On VPS after cloning repo and creating .env.production
docker compose up -d
```

Services:

- **postgres** — Postgres 16, port bound to `127.0.0.1:5432` only
- **app** — Next.js production container on `127.0.0.1:3000`

Apply schema once:

```bash
docker compose exec -T postgres psql -U flower -d flower_ru < db/migrations/001_catalog_schema.sql
```

---

## Environment (production)

Copy `.env.example` → `.env.production` on the VPS. Key vars:

```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.ru
DATABASE_URL=postgresql://flower:SECRET@postgres:5432/flower_ru
CATALOG_STORAGE_DIR=/data/catalog
CATALOG_PUBLIC_BASE_URL=https://yourdomain.ru/catalog
AUTH_SECRET=...
```

Inside Docker Compose, `DATABASE_URL` uses hostname `postgres` (service name).  
`CATALOG_STORAGE_DIR` is mounted at `/data/catalog` in the app container.

**Do not set** `SUPABASE_*`, `STRIPE_*`, `NEXT_PUBLIC_GTM_ID`, or `YC_*` on production.

---

## nginx

Example server block (adjust domain and paths):

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.ru www.yourdomain.ru;

    # ssl_certificate ... (certbot)

    location /catalog/ {
        alias /var/www/catalog/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

SSL:

```bash
certbot --nginx -d yourdomain.ru -d www.yourdomain.ru
```

No `cdn.` subdomain required for MVP — images load from `https://yourdomain.ru/catalog/...`.

---

## Cron jobs (replace vercel.json)

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Reminder emails | `0 2 * * *` | `GET /api/cron/send-reminders` |
| Cleanup reference images | `30 2 * * *` | `GET /api/cron/cleanup-custom-order-reference-images` |

Protect cron routes with a shared secret header. Example crontab:

```cron
0 2 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.ru/api/cron/send-reminders
```

---

## Backups (MVP — free)

| Data | What to back up | How |
|------|-----------------|-----|
| Orders, catalog rows | PostgreSQL | `pg_dump` weekly → download to your Mac |
| Images | `/var/www/catalog/` | `rsync` or archive when you upload new photos in admin |
| App code | Git repo | Already on GitHub / your machine |

```bash
docker compose exec -T postgres pg_dump -U flower flower_ru | gzip > /var/backups/flower_ru-$(date +%F).sql.gz
```

---

## One-time migration from Thailand

Run from your Mac (not on VPS):

1. `npm run mirror-catalog` — download images from Thailand Supabase → local `data/catalog/` + manifest
2. `rsync` `data/catalog/` to VPS `/var/www/catalog/`
3. `npm run import-catalog` — import rows into VPS Postgres (tunnel or temporary public DB port)

Uses `.env.export.local` for Thailand read-only credentials — never deploy that file to the VPS.

---

## Deploy checklist

- [ ] Timeweb VPS: Ubuntu 22.04, 4 GB RAM, Russian region
- [ ] Domain `A` record → VPS public IP
- [ ] `docker compose up -d` — postgres + app running
- [ ] Schema applied (`001_catalog_schema.sql`)
- [ ] Catalog images in `/var/www/catalog/`
- [ ] nginx + certbot SSL working
- [ ] `DATABASE_URL` points to Docker Postgres (not Thailand Supabase)
- [ ] `NEXT_PUBLIC_APP_URL=https://yourdomain.ru`
- [ ] No `SUPABASE_*`, `STRIPE_*`, `NEXT_PUBLIC_GTM_ID` in production env
- [ ] Weekly `pg_dump` scheduled or manual
