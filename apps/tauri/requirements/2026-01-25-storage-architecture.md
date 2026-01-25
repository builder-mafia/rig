# Storage Architecture

## Summary

File system based storage using JSON files organized in directory hierarchy.

## Data Structure

```
storage/
├── settings.json              ← Global app settings
├── channel/{id}/
│   ├── info.json              ← Channel metadata
│   └── messages.json          ← Messages (wrapped in object)
└── agent/{id}/
    └── info.json              ← Agent metadata
```

## Code Structure

```
src/storage/
├── mod.rs          ← Storage struct + base methods (read, write, remove, list_dirs)
├── entities.rs     ← Data types (Channel, Message, Agent, AppSettings)
├── commands.rs     ← Tauri commands
├── channel.rs      ← Channel CRUD (impl Storage)
├── message.rs      ← Message CRUD (impl Storage)
├── agent.rs        ← Agent CRUD (impl Storage)
└── setting.rs      ← AppSettings CRUD (impl Storage)
```

## Key Decisions

- **Directory-based relationships** instead of foreign keys
- **MessagesFile wrapper** (`{ "messages": [...] }`) for extensibility
- **Cascade delete** via `remove_dir` - deleting channel folder removes messages too
- **Split impl blocks** by domain for maintainability

## Future Considerations

- Add `version` field to MessagesFile for migration support
- Consider SQLite if query performance becomes an issue
