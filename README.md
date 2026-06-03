# Rig

Rig is a local-first desktop app for organizing scattered agent SKILL files before they become a mess.

Browse every local skill from one place, edit files without jumping between folders, and track which skills are actually being used.

## Why Rig?

Agent SKILL files are powerful, but they are easy to lose track of once they spread across projects, config folders, and local experiments.

Rig gives you one focused desktop workspace for finding, editing, and understanding the skills already living on your machine.

## MVP Features

- **Browse local SKILL files**
  Discover and inspect SKILL files from one place.
- **Edit skills directly**
  Update SKILL files in place without switching between folders and editors.
- **Track skill usage**
  See invocation counts and understand which skills are actually being used.

## Status

Rig is currently in MVP development.

## Usage

### 1. Install Rig

1. Download the latest macOS app from the [Rig releases page](https://github.com/builder-mafia/rig/releases).
2. Open the downloaded `.dmg` file.
3. Drag Rig into Applications.
4. Launch Rig.

### 2. Install Plugins

Rig tracks skill usage when OpenCode or Claude Code writes usage events to:

```text
~/.rig/usage.jsonl
```

The desktop app reads this file automatically.

#### OpenCode

Add `rig-opencode` to your OpenCode config. The config file is usually at `~/.config/opencode/opencode.json`.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["rig-opencode"]
}
```

Restart OpenCode after saving the config. OpenCode installs npm plugins automatically at startup.

#### Claude Code

Use the [Rig Claude Code plugin folder](https://github.com/builder-mafia/rig/tree/main/packages/claude-code-plugin).

Put the contents of that folder into your local Claude Code plugin setup folder, for example:

```text
~/.claude/skills/rig-claude-code
```

Restart Claude Code after copying the plugin.

## Development

```bash
pnpm install
pnpm dev:app
```


## License

See [LICENSE](LICENSE).
