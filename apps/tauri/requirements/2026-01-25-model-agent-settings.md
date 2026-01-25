# Model, Agent, and Global Settings

## Summary

Decouple model/provider from Channel. Agent entity owns model configuration. Default Agent auto-created when none exists.

## Background

- Channel had `model`, `provider_name` fields → tightly coupled
- Need Agent entity to own model configuration
- Need global "last used model" for convenience

## Architecture

```
Channel (conversation)
  └── agentId (optional) ──→ Agent
                               └── provider, model (required)
                                        ↓ fallback
                             AppSettings.lastUsedModel (for new agents)
```

## Default Agent

- **id**: `"default"`
- **name**: `"Default Agent"`
- **provider_name**: `"openai"`
- **model**: `"gpt-4.1-nano"`
- **Auto-created**: When `get_all_agents()` returns 0 agents
- **Minimum count**: At least 1 agent must exist (last agent cannot be deleted)

## Model Resolution Priority

1. Channel has agentId? → Use that Agent's model
2. No agentId? → Use default Agent (or first available)

## Key Changes

- **Channel**: Remove `model`, `provider_name`. Add `agent_id`
- **Agent**: `id`, `name`, `provider_name`, `model`, `prompt`, timestamps
- **AppSettings**: `lastUsedProvider`, `lastUsedModel` only (removed `defaultFree*`)

## Deletion Rules

- Agent count minimum: 1
- Attempting to delete last agent returns error: `"Cannot delete the last agent"`

## Future Considerations

- Agent config: `temperature`, `max_tokens`
- Multiple system prompts per Agent
- Agent deletion handling when channels reference it
