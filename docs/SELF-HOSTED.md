# Koxik Bot Self-Hosted

Run your own instance of **Koxik** using Docker in minutes.

---

## Prerequisites

- Docker >= 24
- Docker Compose v2
- Git

---

## Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/OZ-Org/Koxik.git
cd Koxik
````

---

### 2️⃣ Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Open `.env` and configure the required variables:

```env
DISCORD_TOKEN=your_discord_bot_token
DATABASE_URL=postgres://user:password@postgres:5432/koxik
NODE_ENV=production
LOGS_WEBHOOK_URL=https://discord.com/api/webhooks/...
TOPGG_TOKEN=your_topgg_token_optional

DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=10000
```

### Required variables

* `DISCORD_TOKEN`
* `DATABASE_URL`
* `NODE_ENV`
* `LOGS_WEBHOOK_URL`

---

### 3️⃣ Start with Docker

```bash
docker compose up -d
```

This will:

* Create and start the PostgreSQL container
* Build the Koxik image (Bun + dependencies)
* Automatically start the bot

---

## Logs

View logs in real time:

```bash
docker compose logs -f koxik-bot
```

---

## Updating

```bash
git pull
docker compose up -d --build
```

---

## Stopping services

```bash
docker compose down
```

---

## Production Notes

* Never commit your `.env` file
* Keep your `DISCORD_TOKEN` private
* Use a strong database password
* Consider running behind a reverse proxy if exposing services

---

## Support

If you encounter issues, join the Support Server: [KSS - Koxik Support Server](https://discord.gg/84u7UQYXzB)

---

[This same file, but in Portuguese](./pt-BR/SELF-HOSTED.md)
