# Koxik Bot - Self-Hosted 🚀

If you want to run **Koxik** on your own using Docker, follow this guide.

---

## General Steps

1. Clone the repository
2. Configure the environment
3. Start the bot via Docker

---

## Prerequisites

- [Docker](https://www.docker.com/) installed
- A text editor to configure the `.env` file

---

## Installation

### Clone the repository
```bash
git clone https://github.com/KoxikBot/Koxik.git
cd Koxik
```

### Configure the environment

```bash
cp .env.example .env
```

Open the `.env` file and fill in your credentials (bot token, database URL, etc).

### Start the bot with Docker

```bash
docker-compose up -d
```

> This will:
>
> * Create and start the Postgres container
> * Build the Koxik Bot image (with Bun and dependencies installed)
> * Automatically start the bot

---

## Extra Tips

* To view the bot logs in real time:

```bash
docker-compose logs -f koxik-bot
```

* To update the bot:

```bash
git pull
docker-compose up -d --build
```

* To stop all services:

```bash
docker-compose down
```

---

## Support

If you run into any issues, join the [Koxik Support Server](https://discord.gg/84u7UQYXzB).

---
[This same file, but in portuguese!](./pt-BR/SELF-HOSTED.md)