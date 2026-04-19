# TW 3002 CLI

Terminal-native client for TW 3002 AI.

## Setup

```bash
cd cli
bun install
```

## Development

Run in development mode (fast, no compile):

```bash
bun run dev
```

## Build Binary

Compile to standalone executable:

```bash
bun run build
./tw3002
```

The binary is self-contained (~103MB, includes Bun runtime).

## Project Structure

- `src/` — TypeScript source
- `src/index.tsx` — Entry point
- `dist/` — Build output
- `tw3002` — Compiled binary

## Tech Stack

- **Bun** — Runtime (v1.3.8+)
- **Ink** — React for terminals (v7.0.1)
- **React** — UI components (v19.2.5)
- **TypeScript** — Type safety

## Requirements

- Bun 1.0 or later
- Linux/macOS/Windows (Bun supported platforms)

## Notes

- First run may take a moment to render (terminal detection)
- Press `Ctrl+C` to exit
