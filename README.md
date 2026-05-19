# ClearCents

A minimal Electron desktop app for personal expense tracking. All data is stored locally — no server, no network.

> Built with Claude Code.

## Features

1. **Log expenses** — amount + description + auto-suggested category (2 taps)
2. **Money left** — home screen shows remaining budget + bar chart by category
3. **Savings goal** — set a target and track progress with a ring indicator
4. **Daily reminder** — desktop notification at a user-set time
5. **Privacy** — everything stored in `localStorage`, nothing leaves your machine

## Setup

```bash
npm install
npm start
```

Requires Node.js and npm.

## Usage

- **Settings** — set your monthly budget, savings goal, and reminder time
- **+ Expense** — enter amount and description; category is suggested automatically
- **Home** — see money left, spending breakdown, and goal progress

## Structure

```
main.js       Electron main process, notification scheduling
preload.js    contextBridge for IPC
index.html    Single-page UI (3 views)
renderer.js   UI logic, localStorage persistence, category suggestion
```
