# 🤖 mmo_mc-bot.ai (V1)

An advanced, AI-powered Minecraft bot built with Node.js and Mineflayer. Features include natural language chat with memory, automated pathfinding, entity tracking, and PvP combat defense.

🌟 **Brought to you by Moha Studios**  
👨‍💻 **Developer:** mo-dev775

---

## ✨ Features

* **AI Chat Integration:** Native integration for intelligent, context-aware conversations (supports custom endpoints and major AI models).
* **Automated Pathfinding:** Issue in-game commands to make the bot seamlessly navigate the world and follow you.
* **Combat & Defense:** The bot can actively guard you, automatically equipping weapons to attack hostile mobs.
* **Smart Context Memory:** The bot remembers recent chat history and silent system actions (like successfully following a player) to maintain conversational awareness.
* **Core Utilities:** Multi-version auto-detection, anti-AFK static movements, and custom skins/nicknames.

---

## 📋 Prerequisites

* **Node.js** (v18 or higher recommended)
* A Minecraft server to connect to.
* An API Key for your AI provider.
* *(Optional)* **SkinsRestorer** and **EssentialsX** server plugins for custom aesthetics.

---

## 🚀 Installation & Setup

**1. Clone or Download the Repository**
Extract the bot files into a dedicated folder.

**2. Install Dependencies**
Open your terminal in the bot's folder and run:
```bash
npm install
```

**3. Configure the Bot**
Open the `config.json` file and adjust the settings:

```json
{
  "server": {
    "host": "localhost",
    "port": 25565,
    "version": false,
    "auth": "offline"
  },
  "identity": {
    "username": "AIBot",
    "skinName": "Dream",
    "displayName": "SmartBot"
  },
  "ai": {
    "enabled": true,
    "triggerPrefix": "!ai",
    "maxHistoryMessages": 10,
    "apiKey": "YOUR_API_KEY_HERE",
    "model": "gemini-2.5-flash",
    "systemPrompt": "You are a helpful in-game Minecraft player. Keep your responses short..."
  }
}
```

---

## 🎮 In-Game Commands

Players can trigger actions by typing these commands in the Minecraft chat:

| Command | Action |
| :--- | :--- |
| `!follow` | Bot calculates a path and follows you within 2 blocks. |
| `!defend` | Bot guards you, equipping a sword to attack nearby hostile mobs. |
| `!stop` | Cancels all active movement/combat tasks and resumes standing by. |
| `!ai <text>` | Directly prompts the AI (can also be triggered by mentioning the bot's name). |

---

## 💻 Usage

To start the bot, run the following command in your terminal:

```bash
npm start
```

**Console Output:**
You will see detailed logs confirming the bot's connection, spawned state, and any generated AI responses:
```text
[*] Connecting to localhost:25565...
[+] Successfully logged in as AIBot
[+] Bot spawned! Initializing.
[*] Generating AI response for -> player1: hi!
```

---

## 🛑 Troubleshooting

* **Pathfinding Errors:** Ensure the bot is not trapped and that the target player is within rendering distance when issuing `!follow` or `!defend`.
* **API 404 / 409 Errors:** Double-check your API Key, ensure your Base URL is correct if using a proxy, and verify the `model` in your config exactly matches your provider's available models.
* **Skin/Nick Failures:** The bot automatically attempts `/skin set` and `/nick`. Ensure it has permissions on the server to execute these commands.

---
*Created with ❤️ by **mo-dev775** | **Moha Studios***
