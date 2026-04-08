# CLAUDE.md

<objective>
Define a deterministic operational contract for Claude Code agent, eliminating ambiguity and ensuring consistent, secure, and predictable repository modifications.
</objective>

<scope>
Applies exclusively to Claude Code agent (claude.ai/code)
All actions MUST adhere to this document.
</scope>

<context>
<project>Scalable Discord bot</project>
<runtime>Bun</runtime>
<language>TypeScript (strict)</language>
<database>PostgreSQL</database>
<orm>Drizzle</orm>
<library>discord.js v14</library>
</context>

<commands>
<dev>
<command>bun run dev</command>
<command>bun run dev:watch</command>
<command>bun run format</command>
<command>bun run lint</command>
</dev>

<build>
<command>bun run build</command>
<command>bun run start</command>
</build>

<database>
<command>bun run migrate</command>
<command>bun run migrate:dev</command>
<command>bun run push</command>
<command>bun run push:dev</command>
<command>bun run generate</command>
<command>bun run pull</command>
<command>bun run pull:dev</command>
</database>

<discord>
<command>bun run commands:export</command>
</discord>
</commands>

<architecture>
<core_rule>
Mandatory separation:
- core/ → infrastructure
- app/ → domain logic
</core_rule>

<structure>
<path>src/index.ts</path><forbidden>business logic</forbidden>
<path>src/core/</path>
<path>src/core/base/db/</path>
<path>src/core/base/discord/</path>
<path>src/core/utils/</path>
<path>src/app/</path>
<path>src/app/discord/commands/</path>
</structure>

<principles>
<principle>low coupling</principle>
<principle>high cohesion</principle>
<principle>mandatory modularity</principle>
<principle>event-driven orientation</principle>
</principles>
</architecture>

<mandatory_rules>
<rule type="forbidden">breaking TypeScript strict mode</rule>
<rule type="forbidden">using `any` without justification</rule>
<rule type="forbidden">duplicating logic</rule>
<rule type="forbidden">altering code outside scope</rule>
<rule type="forbidden">placing logic in index.ts</rule>
<rule type="required">using aliases (@basedir)</rule>
<rule type="required">reusing core/utils</rule>
<rule type="required">maintaining sharding compatibility</rule>
</mandatory_rules>

<database>
<orm>Drizzle required</orm>
<model>schema-first</model>
<requirement>migration required for any change</requirement>
<forbidden>manual database edits</forbidden>
</database>

<decision_tree>
<step id="1">Receive task</step>
<step id="2">Check: involves code? → NO → respond in text only → END</step>
<step id="3">Check: related code exists? → YES → reuse | NO → create in correct location</step>
<step id="4">Determine type: domain → app/ | infra → core/</step>
<step id="5">Check: similar logic exists? → YES → reuse | NO → implement</step>
<step id="6">Check: affects database? → YES → generate migration (mandatory)</step>
<step id="7">Check: breaks type safety? → YES → fix before proceeding</step>
<step id="8">Check: impacts architecture? → YES → minimize impact</step>
<step id="9">Apply minimal necessary change → END</step>
</decision_tree>

<permissions>
<allowed>
<action>create files</action>
<action>edit files</action>
<action>refactor locally</action>
</allowed>
<forbidden>
<action>delete entire modules without justification</action>
<action>alter global architecture</action>
<action>add dependencies unnecessarily</action>
</forbidden>
</permissions>

<operational_limits>
<limit>changes must be minimal</limit>
<limit>avoid broad refactoring</limit>
<limit>maintain consistency with existing code</limit>
</operational_limits>

<code_patterns>
<valid>
<pattern>small functions</pattern>
<pattern>single responsibility</pattern>
<pattern>explicit typing</pattern>
</valid>
<invalid>
<pattern>overly large functions</pattern>
<pattern>duplicated logic</pattern>
<pattern>unnecessary `any` usage</pattern>
</invalid>
</code_patterns>

<quality_criteria>
<criterion>build completes without errors</criterion>
<criterion>lint passes without errors</criterion>
<criterion>code remains readable</criterion>
<criterion>behavior is predictable</criterion>
</quality_criteria>

<fallback>
<rule>DO NOT assume behavior</rule>
<rule>DO NOT invent new patterns</rule>
<rule>prioritize consistency with existing code</rule>
<rule>request additional context if uncertain</rule>
</fallback>

<final_objective>
Execute code modifications deterministically, minimally, and safely — preserving architecture, avoiding side effects, and ensuring complete system consistency.
</final_objective>