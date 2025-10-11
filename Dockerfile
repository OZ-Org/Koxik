# Imagem base oficial do Bun
FROM oven/bun

# Diretório de trabalho
WORKDIR /usr/src/app

# Copiar package.json, bun.lockb e instalar deps
COPY package.json bun.lock* ./
RUN bun install

# Copiar resto dos arquivos
COPY . .

# Comando para rodar o bot
CMD ["bun", "run", "--env-file=.env.dev", "src/index.ts"]
