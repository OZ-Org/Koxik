# Koxik Bot - Self-Hosted

Se você quer rodar o **Koxik** por conta própria usando Docker, siga este guia.

---

## Passos Gerais

1. Clone o repositório
2. Configure o ambiente
3. Inicie o bot via Docker

---

## Pré-requisitos

- [Docker](https://www.docker.com/) instalado
- Um editor de texto para configurar o `.env`

---

## Instalação

### Clone o repositório
```bash
git clone https://github.com/KoxikBot/Koxik.git
cd Koxik
````

### Configure o ambiente

```bash
cp .env.example .env
```

Abra o `.env` e preencha com suas credenciais (token do bot, URL do banco de dados, etc).

### Inicie o bot com Docker

```bash
docker-compose up -d
```

> Isso vai:
>
> * Criar e subir o container do Postgres
> * Construir a imagem do Koxik Bot (com Bun e dependências instaladas)
> * Iniciar o bot automaticamente

---

## Dicas Extras

* Para ver logs do bot em tempo real:

```bash
docker-compose logs -f koxik-bot
```

* Para atualizar o bot:

```bash
git pull
docker-compose up -d --build
```

* Para parar os serviços:

```bash
docker-compose down
```

---

## Suporte

Se tiver problemas, entre no [Servidor de Suporte do Koxik](https://discord.gg/84u7UQYXzB).