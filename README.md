# Koxik V1

**⚠️ Project Status: Unmaintained**

This is the first version of the Koxik Discord bot project. This version is no longer maintained and has been replaced by Koxik V2.

## Overview

Koxik V1 is a Discord bot written in JavaScript using Node.js and Discord.js. The bot provides various features including economy commands, fun interactions, moderation tools, and utility functions for Discord servers.

## Technologies Used

- **Node.js** - JavaScript runtime
- **Discord.js v14** - Discord API library
- **MongoDB/Mongoose** - Database for user and guild data
- **JavaScript (ES6+)** - Programming language

## Features

- **Economy System**: Balance, work, mining, betting, and shop commands
- **Fun Commands**: Games, dice rolls, 8-ball, ship calculator, and more
- **Moderation**: Ban, lock, and administrative tools
- **Information**: User info, server info, ping, and help commands
- **Utility**: Custom prefix settings, language support

## Project Structure

```
├── ComandosSlash/     # Slash commands
├── ComandosPrefix/    # Prefix commands (legacy)
├── Events/           # Discord event handlers
├── structure/        # Core bot structure and utilities
├── models/           # Database models
├── App/              # Application utilities
└── index.js          # Main entry point
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with required environment variables
4. Run the bot: `npm start`

## ⚠️ Important Notice

This version (V1) is **no longer maintained** and should not be used for production purposes.

## Upgrade to Koxik V2

We recommend migrating to **Koxik V2**, which is currently in production and offers significant improvements:

### V2 Features:
- **TypeScript** for better type safety and development experience
- **Modern Architecture** with improved code organization
- **Enhanced Performance** and reduced memory usage
- **Better Error Handling** and logging systems
- **Updated Dependencies** with latest security patches
- **Improved Command System** with better validation
- **Enhanced Database Schemas** for better data integrity

### V2 Technologies:
- TypeScript
- Modern Discord.js patterns
- Improved database architecture
- Better development tooling

## License

MIT License - See LICENSE file for details

---

**Note**: For the latest version with active maintenance and improved features, please refer to the Koxik V2 repository.