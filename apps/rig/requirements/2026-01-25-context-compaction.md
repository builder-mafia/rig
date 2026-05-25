# Context Compaction

## Summary

Single message storage with field-based filtering. UI shows all messages, AI context excludes compacted ones.

## Background

- AI context window has token limits
- Long conversations exceed limits
- Need to compact/summarize old messages
- But UI should still show full history

## Architecture

```
Messages (single storage)
│
├─→ UI: Show all messages
│
└─→ AI Context: Filter out compacted, include summaries
```

## Message Fields

```rust
pub struct Message {
    pub id: String,
    pub role: String,
    pub parts: Vec<serde_json::Value>,
    pub created_at: i64,
    pub is_summary: Option<bool>,      // true if this is a compaction summary
    pub compacted_at: Option<i64>,     // timestamp when pruned (exclude from AI context)
}
```

## Filtering Logic

```typescript
// UI: render all messages

// AI Context: filter
function buildContext(messages) {
  return messages.filter(msg => !msg.compacted_at)
}
```

## Compaction Flow

1. Detect context overflow (token count > limit)
2. Send conversation to LLM with "summarize" prompt
3. Create new message with `is_summary: true`
4. Mark old tool outputs with `compacted_at: timestamp`
5. Next AI call uses summary instead of old messages

## UI Considerations

- Compacted messages can be styled differently (e.g., dimmed)
- Summary messages can show indicator icon
- User can still see full history

## Future Considerations

- Auto-compaction threshold configuration
- Manual compaction trigger (user command)
- Pruning strategy for tool outputs vs regular messages
- Token estimation for compaction trigger

## References

- [OpenCode Context Management](https://deepwiki.com/sst/opencode/2.4-context-management-and-compaction)
