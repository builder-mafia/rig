# Requirements Documentation Guidelines

## Principles

1. **One file per concern** - Each requirement document should focus on a single topic
2. **Keep it short** - Aim for under 2KB per file
3. **No implementation details** - Focus on "what" and "why", not "how"

## File Naming

```
{date}-{topic}.md

Examples:
- 2026-01-25-storage-architecture.md
- 2026-01-25-model-agent-settings.md
```

## Document Structure

```markdown
# Title

## Summary
One or two sentences explaining the requirement.

## Background
Why this is needed. What problem it solves.

## Architecture (if applicable)
Simple diagram using ASCII art.

## Key Decisions
Bullet points of important choices made.

## Future Considerations
Things that might be added later.
```

## What NOT to Include

- Detailed implementation code
- Step-by-step instructions
- File change lists
- API documentation (belongs in code comments)

## Tips

- Use ASCII diagrams over complex visuals
- Link related requirements if needed
- Update documents when decisions change
