# Model, Agent, and Global Settings Architecture

## Overview

Redesign the model/provider selection system to decouple channels from model configuration. Introduce an Agent entity that owns model settings, and add global app settings for fallback behavior.

## Current State

### Problems
- `ChannelInfo` contains `model` and `provider_name` fields
- This couples channels (conversations) with model configuration
- No concept of Agent entity
- No global settings for default/fallback model

### Current Structure
```
Channel
├── id
├── model          ← to be removed
├── provider_name  ← to be removed
├── title
├── messages
└── ...
```

## Proposed Architecture

### Entity Relationships
```
┌─────────────────────────────────────────────────────────┐
│ AppSettings (Global)                                    │
├─────────────────────────────────────────────────────────┤
│ - lastUsedProvider: string                              │
│ - lastUsedModel: string                                 │
│ - defaultFreeProvider: string (fallback)                │
│ - defaultFreeModel: string (fallback)                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Agent                                                   │
├─────────────────────────────────────────────────────────┤
│ - id: string                                            │
│ - name: string                                          │
│ - description: string (optional)                        │
│ - provider: string (optional)                           │
│ - model: string (optional)                              │
│ - systemPrompt: string (optional)                       │
│ - createdAt: timestamp                                  │
│ - updatedAt: timestamp                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Channel                                                 │
├─────────────────────────────────────────────────────────┤
│ - id: string                                            │
│ - agentId: string (optional, reference to Agent)        │
│ - title: string (optional)                              │
│ - description: string (optional)                        │
│ - isempty: boolean                                      │
│ - pin: string (optional)                                │
│ - createdAt: timestamp                                  │
│ - updatedAt: timestamp                                  │
└─────────────────────────────────────────────────────────┘
```

### Model Resolution Priority
When sending a chat request, determine which model to use:

```
1. Agent has model specified?
   └── YES → Use agent.provider + agent.model
   └── NO  ↓

2. AppSettings.lastUsedModel exists?
   └── YES → Use lastUsedProvider + lastUsedModel
   └── NO  ↓

3. Use AppSettings.defaultFreeProvider + defaultFreeModel
```

## Implementation Plan

### Phase 1: Backend (Rust/Tauri)

#### 1.1 Update ChannelInfo
- Remove `model` field
- Remove `provider_name` field
- Remove `reasoning_effort` field
- Remove `reasoning_summary` field
- Add `agent_id: Option<String>` field

#### 1.2 Create AppSettings
Location: `storage/settings.json`

```rust
pub struct AppSettings {
    pub last_used_provider: Option<String>,
    pub last_used_model: Option<String>,
    pub default_free_provider: String,
    pub default_free_model: String,
}
```

Commands:
- `get_app_settings() -> AppSettings`
- `update_app_settings(settings: AppSettings) -> ()`
- `set_last_used_model(provider: String, model: String) -> ()`

#### 1.3 Create Agent Entity
Location: `storage/agent/{agent_id}/info.json`

```rust
pub struct AgentInfo {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub system_prompt: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}
```

Commands:
- `get_agents() -> Vec<AgentInfo>`
- `get_agent(id: String) -> AgentInfo`
- `create_agent(info: AgentInfo) -> ()`
- `update_agent(info: AgentInfo) -> ()`
- `delete_agent(id: String) -> ()`

#### 1.4 Update stream_text Command
- Accept optional `agent_id` parameter
- Resolve model using priority chain
- Auto-update `lastUsedModel` after successful request

### Phase 2: Frontend (TypeScript/React)

#### 2.1 Update ModelSelectView
- On model selection, call `set_last_used_model`
- Update UI to show current model from AppSettings

#### 2.2 Create Agent Management UI
- Agent list view
- Agent create/edit form
- Agent selection in channel

#### 2.3 Update Session Class
- Remove hardcoded provider/model
- Fetch model configuration from AppSettings or Agent

## Free/Cheap Model Recommendations

For `defaultFreeProvider` and `defaultFreeModel`, consider:

| Provider | Model | Notes |
|----------|-------|-------|
| Groq | llama-3.1-70b-versatile | Free tier, fast, OpenAI-compatible |
| Google | gemini-1.5-flash | Free tier available, already implemented |
| DeepSeek | deepseek-chat | Very cheap (~$0.14/1M tokens) |
| OpenRouter | various free models | Aggregator with 25+ free models |

**Recommendation:** Use OpenAI GPT-4.1-nano as it's already implemented and cost-effective.

## File Changes Summary

### Rust (src-tauri/src/)
- `storage/types.rs` - Update ChannelInfo, add AppSettings, add AgentInfo
- `storage/mod.rs` - Add settings and agent operations
- `storage/commands.rs` - Add new Tauri commands
- `chat/commands.rs` - Update stream_text to resolve model
- `lib.rs` - Register new commands

### TypeScript (src/)
- `business/command-k/views/ModelSelectView.tsx` - Persist selection
- `business/session/Session.ts` - Dynamic model resolution
- New: `business/agent/` - Agent management module
- New: `business/settings/` - App settings management

## Open Questions

1. ~~Should Agent have additional configuration like temperature, max_tokens?~~ → Add later as needed
2. Should we support multiple system prompts per Agent?
3. How to handle Agent deletion when channels reference it?

## Decisions Made

- **Default free model:** OpenAI `gpt-4.1-nano` (cost-effective, already implemented)
- **Agent config (temperature, max_tokens):** Defer to future iteration

## References

- [aisdk crate](https://github.com/lazy-hq/aisdk) - Rust AI SDK with DynamicModel support
- [tauri-plugin-store](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/store) - Alternative to JSON file storage
