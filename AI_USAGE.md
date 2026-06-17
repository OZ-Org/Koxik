## Purpose

This document defines how AI tools may be used within the Koxik project.

The goal is to use AI as a productivity tool while preserving code quality, maintainability, and project identity.

---

# Allowed Uses

AI may be used for:

* Boilerplate generation
* Documentation writing
* Refactoring suggestions
* Bug investigation
* Test generation
* Type generation
* Translation assistance
* Code review assistance
* Architecture discussions

---

# Restricted Uses

AI should not be used to generate entire features without human review.

Generated code must always be:

* Read by a developer
* Understood by a developer
* Reviewed before merging

No code should be merged solely because "the AI generated it".

---

# Human Responsibility

The developer remains responsible for:

* Correctness
* Security
* Performance
* Maintainability
* Architecture decisions

AI output is a suggestion, not a source of truth.

---

# Project Identity

Koxik should not become a "vibe coded" project.

Features should be intentionally designed.

Developers should:

* Understand every change
* Be able to explain every change
* Be capable of maintaining every change

If a developer cannot explain how generated code works, it should not be merged.

---

# Code Review Requirements

AI-generated code must be reviewed for:

* Type safety
* Security issues
* Performance problems
* Existing project patterns
* Localization support
* Sharding compatibility
* Database impact

---

# Architecture Rules

AI must follow existing architecture.

It must not:

* Introduce random design patterns
* Create unnecessary abstractions
* Add dependencies without justification
* Ignore existing utilities
* Bypass established conventions

Existing project patterns always take precedence.

---

# Database Changes

AI-generated database changes require additional verification.

Before merging:

* Verify schema changes
* Verify migration generation
* Verify rollback safety
* Verify data integrity

---

# Security

Never trust AI-generated code blindly.

Special attention is required for:

* Authentication
* Authorization
* Database queries
* External APIs
* User input validation
* File operations

---

# Documentation

When AI creates significant functionality, documentation should be updated if necessary.

Documentation must reflect actual behavior rather than generated assumptions.

---

Use AI to accelerate development.

Do not use AI to replace understanding.
