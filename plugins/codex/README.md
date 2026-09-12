# Rig for Codex

This beta plugin records explicit Codex skill mentions and detected `SKILL.md`
reads in Rig's local activity log. Both are usage signals that help you judge
which skills are useful in your work.

## Install

```sh
codex plugin marketplace add builder-mafia/rig
codex plugin add rig-codex@Rig
```

The hook command requires Node.js to be available on `PATH`.

Start a new Codex session, run `/hooks`, review the Rig `UserPromptSubmit` and
`PostToolUse` hooks, and trust them. Codex stores trust against the exact hook definition, so a
changed hook must be reviewed again.

## What is recorded

The hooks append observations to:

```text
~/.rig/usage.jsonl
```

`UserPromptSubmit` records explicit `$skill` mentions. `PostToolUse` detects
reads through `cat`, `head`, `tail`, read-only `sed`, and file-read
tools (including MCP tools with `read` in their name and a `path`, `file_path`,
`filePath`, or `paths` argument). Shell reads support literal absolute and
relative paths, quoted paths, and ordinary `cd` commands. Unresolved variables,
shell substitutions, and script control flow are not interpreted. File listings,
edits, explicit failure results, and paths appearing only in output do not count.
When Codex sends raw output without an exit status, the hook keeps the detected
read as an observation; it cannot reliably distinguish every failed read.
PowerShell `Get-Content` commands are not currently detected.

Each record contains the skill name, `codex` source, timestamp, tracking mode
(`explicit` or `read`), session id, turn id, and working directory. Read events
also include the skill file path and tool-call id. The hooks do not store
prompts, commands, tool output, or skill contents.

Rig counts every recorded event. Within a single hook input, repeated explicit
skill names and repeated read paths are recorded once. Separate hook calls are
counted separately, including when a requested skill is subsequently read or
when several sections are read in separate calls.

Activity is grouped by skill name. Namespaced mentions such as `$plugin:review`
are matched as `review`, and file reads use the frontmatter name with a directory
name fallback. Same-name skills share activity.

These are activity signals, not an assessment of task success: reading a skill
for inspection can count, and reusing instructions without another read cannot
be detected. Codex does not expose a dedicated skill-use event.

Set `RIG_USAGE_DISABLED=1` or `true` to disable logging or `RIG_USAGE_LOG_PATH` to use a
different local log file.

## Test

```sh
node --test plugins/codex/scripts/log-skill-usage.test.mjs
```
