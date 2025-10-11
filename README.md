# Kokik Bot 🌍🤖

O **Kokik Bot** é um bot **multilíngue** para Discord, criado para facilitar a comunicação em comunidades diversas.
Ele não usa tradução dinâmica: as respostas já estão **pré-definidas** em três idiomas — **inglês, espanhol e português brasileiro**.
A escolha da linguagem é feita com base nos dados da interação do usuário, garantindo uma experiência natural e integrada.

---

## ✨ Funcionalidades

* 🌐 **Suporte multilíngue nativo**: Inglês, Espanhol e Português Brasileiro.
* 🧠 **Detecção automática**: O bot identifica a linguagem preferida a partir da interação do usuário.
* 📝 **Interface intuitiva**: Comandos simples que respondem diretamente no idioma adequado.
* ⚙️ **Configuração flexível**: Ajuste o idioma padrão por servidor ou canal, se desejar.
* 🔔 **Respostas limpas**: O bot interage sem poluir o chat.

---

## 📚 Comandos principais

🔹 **Comando:** `/create` – Subcomando relacionado à criação.
    • **Subcomando:** `/create account` – Crie sua conta para desbloquear o sistema de economia!

🔹 **Comando:** `/koxik` – Exibe informações sobre o Kokik.
    • **Subcomando:** `/koxik analytics` – Veja estatísticas detalhadas de uso do Kokik.

🔹 **Comando:** `/eco` – Conjunto de comandos da economia.
    • **Subcomando:** `/eco balance` – Consulte seu saldo.
    • **Subcomando:** `/eco deposit` – Deposite dinheiro no banco.
    • **Subcomando:** `/eco pay` – Pague outro usuário.
    • **Subcomando:** `/eco daily` – Resgate sua recompensa diária.
    • **Subcomando:** `/eco leaderboard` – Veja os usuários mais ricos.

🔹 **Comando:** `/ping` – Veja a latência atual do bot.

---

## ⚡ Tech Stack

* **Runtime:** [Bun](https://bun.sh) `1.2.14`
* **Language:** [TypeScript](https://www.typescriptlang.org) `5.9.2`
* **Framework/Lib Discord:** [`discord.js`](https://discord.js.org) `14.22.1` + [`@magicyan/discord`](https://www.npmjs.com/package/@magicyan/discord)
* **ORM:** [Prisma](https://www.prisma.io) `6.16.1`
* **Validation:** [Zod](https://zod.dev)
* **HTTP Client:** [Axios](https://axios-http.com)
* **Env manager:** [dotenv](https://www.npmjs.com/package/dotenv) + [dotenv-cli](https://www.npmjs.com/package/dotenv-cli)
* **Build & tooling:** [tsup](https://tsup.egoist.dev) + [tsc-alias](https://www.npmjs.com/package/tsc-alias) + [tsx](https://tsx.is)
* **Code quality:** [Biome](https://biomejs.dev) (formatter + linter)

### 🔧 Extra

* **Database migrations:** Prisma Migrate (`migrate:dev`, `migrate:prod`)
* **External API:** [starlightskinapi](https://www.npmjs.com/package/starlightskinapi)

---

## 📩 Contribuição

Este é um projeto **open-source** ✨

* Abra uma issue com sugestões ou reporte bugs.
* Envie um pull request com melhorias.
* Contribua adicionando novos idiomas no futuro.

---

## 📜 Licença

Este projeto é licenciado sob a **MIT License** – sinta-se livre para usar, modificar e distribuir.

---

💡 *Kokik Bot: um só servidor, várias línguas, nenhuma barreira.*
