# CLAUDE.md

## About The Project

Koxik is a scalable Discord bot built using:

* Runtime: Bun
* Language: TypeScript (strict mode)
* Database: PostgreSQL
* ORM: Drizzle ORM
* Discord Library: discord.js v14

The project is designed to support:

* Large servers
* Sharding
* Horizontal scaling
* Multiple locales
* Modular commands

---

# Primary Objective

When modifying code:

1. Preserve existing architecture.
2. Reuse existing code whenever possible.
3. Apply the smallest possible change.
4. Maintain strict typing.
5. Follow existing project patterns.
6. Avoid introducing new patterns unless explicitly requested.

---

# Architecture

## Core Layer

Location:

```text
src/core/
```

Contains infrastructure code.

Examples:

* Database
* Discord client
* Utilities
* Cache
* Shared services
* Framework internals

Examples:

```text
src/core/base/
src/core/base/db/
src/core/base/discord/
src/core/utils/
```

Infrastructure belongs here.

---

## Application Layer

Location:

```text
src/app/
```

Contains business logic.

Examples:

* Commands
* Services
* Jobs
* Features
* Domain logic

Examples:

```text
src/app/discord/commands/
src/app/jobs/
```

Business logic belongs here.

---

## Bootstrap

File:

```text
src/index.ts
```

Rules:

* Bootstrapping only.
* No business logic.
* No command logic.
* No feature implementation.

Only initialize systems.

---

# Development Commands

## Development

```bash
bun run dev
bun run dev:watch
bun run lint
bun run format
```

## Build

```bash
bun run build
bun run start
```

## Database

```bash
bun run migrate
bun run migrate:dev

bun run push
bun run push:dev

bun run generate

bun run pull
bun run pull:dev
```

## Discord

```bash
bun run commands:export
```

---

# TypeScript Rules

Required:

* Strict mode compliance.
* Explicit types when beneficial.
* Safe narrowing.
* Proper null handling.

Forbidden:

* any
* @ts-ignore
* disabling strict mode
* unsafe casting

If any is absolutely necessary, explain why.

---

# Import Rules

Prefer aliases.

Use:

```ts
import { createCommand } from '@base';
```

Avoid long relative paths when aliases exist.

Example of preferred imports:

```ts
@base
@fx
@app
@misc
```

Always follow existing project conventions.

---

# Command System

The project currently contains two command styles.

---

## Legacy Commands

Example:

```ts
export default createCommand({
	data: new SlashCommandBuilder(),
	run: async () => {},
});
```

Characteristics:

* Uses SlashCommandBuilder.
* Older implementation.
* Exists for compatibility.

Rules:

* Do not migrate automatically.
* Preserve style when editing.
* Only modernize when explicitly requested.

---

## Modern Commands

Preferred style:

```ts
export default createCommand({
	name: 'backpack',
	description: 'View your backpack',
	run: async () => {},
});
```

Use this style for new commands.

---

# Command Localization

Before modifying any command, verify whether localizations already exist.

Supported locales:

* en-US
* pt-BR
* es-ES

Example:

```ts
name: 'start',

name_localizations: {
	'pt-BR': 'começar',
	'es-ES': 'empezar',
},

description: 'Start your Minecraft journey!',

description_localizations: {
	'pt-BR': 'Comece sua jornada Minecraftiana!',
	'es-ES': '¡Comienza tu viaje en Minecraft!',
},
```

Rules:

* Never remove existing translations.
* Update translations when modifying text.
* Preserve localization consistency.
* Suggest translations when absent.

---

# Language System

User-facing text should use the translation system whenever possible.

Preferred:

```ts
replyLang(
	interaction.locale,
	'commands#backpack#title',
);
```

Avoid hardcoded user-facing strings when translation keys exist.

Before creating new strings:

1. Check for existing translation keys.
2. Reuse them whenever possible.

---

# Responses

Preferred patterns:

```ts
return res.raw({
	embeds: [embed],
});
```

Ephemeral:

```ts
return res.ephemeral().raw({
	embeds: [embed],
});
```

Follow existing response conventions.

---

# Cooldowns

Commands may define cooldowns.

Example:

```ts
cooldown: 50,
```

Rules:

* Preserve existing cooldowns.
* Add cooldowns when abuse is possible.
* Do not remove cooldowns without reason.

---

# Permissions

When Discord permissions are required:

```ts
default_member_permissions: [
	PermissionsBitField.Flags.ManageGuild,
],
```

Prefer metadata permissions instead of runtime permission checks.

---

# Subcommands

Parent command:

```ts
export default createCommand({
	name: 'mc',
	description: 'View minecraft users from java players!',
	cooldown: 3,
	baseCommand: true,
}).addSubCommands([
	SkinSubCommand,
]);
```

Rules:

* Use addSubCommands().
* Keep subcommands isolated.
* Preserve existing structure.

---

## Subcommand Directory Structure

Location:

```text
{category}/subcommands/{command-name}/
```

Example:

```text
minecraft/
├── mc.ts
└── subcommands/
    └── mc/
        ├── skin.ts
        ├── profile.ts
```

Always place new subcommands in the correct directory.

---

# Database Rules

Drizzle ORM is mandatory.

Schema-first workflow:

1. Modify schema.
2. Generate migration.
3. Commit migration.

Never:

* Edit production database manually.
* Skip migrations.
* Introduce another ORM.

---

# Code Quality

Prefer:

* Small functions
* Explicit naming
* Single responsibility
* Existing utilities
* Existing abstractions

Avoid:

* Large functions
* Duplicate logic
* Deep nesting
* Premature abstractions

Before creating new helpers:

* Search for an existing helper.
* Reuse if available.

---

# Sharding Compatibility

The bot must remain shard-safe.

Avoid:

* In-memory state dependencies.
* Single-process assumptions.
* Global mutable state.

New features must work correctly across multiple shards.

---

# Workflow

Before implementing:

1. Understand the task.
2. Search for existing implementations.
3. Reuse existing patterns.
4. Determine proper layer.
5. Verify localization requirements.
6. Verify command permissions.
7. Verify cooldown requirements.
8. Verify translation keys.
9. Verify sharding compatibility.
10. Apply minimal changes.

---

# Never Do

Never:

* Rewrite unrelated code.
* Refactor large sections without request.
* Remove translations.
* Remove cooldowns without reason.
* Break strict mode.
* Introduce duplicate logic.
* Add dependencies unnecessarily.
* Change architecture unnecessarily.
* Move files without justification.

---

# Success Criteria

A task is complete when:

* TypeScript compiles successfully.
* Existing architecture remains intact.
* Existing patterns are preserved.
* Localizations are handled correctly.
* Sharding compatibility is preserved.
* Database migrations exist when required.
* No duplicated logic is introduced.
* The change is minimal and focused.

If uncertain about any behavior, inspect the surrounding code and follow existing project conventions rather than inventing a new pattern.
