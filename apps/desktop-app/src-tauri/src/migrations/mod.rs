pub fn sql_migrations() -> Vec<tauri_plugin_sql::Migration> {
    use tauri_plugin_sql::{Migration, MigrationKind};

    vec![Migration {
        version: 1,
        description: "init_allin_database",
        kind: MigrationKind::Up,
        sql: r#"
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY NOT NULL,
  model TEXT NOT NULL,
  providerName TEXT NOT NULL,
  reasoningEffort TEXT NOT NULL CHECK (reasoningEffort IN ('none', 'low', 'medium', 'high')),
  reasoningSummary INTEGER NOT NULL CHECK (reasoningSummary IN (0, 1)),
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  prompt TEXT,
  isEmpty INTEGER NOT NULL CHECK (isEmpty IN (0, 1)),
  pin TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY NOT NULL,
  channelId TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  parts TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (channelId) REFERENCES channels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_channelId_createdAt
ON messages(channelId, createdAt DESC);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY NOT NULL,
  lastSelectedChannelId TEXT,
  apiKeys TEXT
);

-- initialize singleton config row (key = 'userConfig')
INSERT OR IGNORE INTO config (key, lastSelectedChannelId, apiKeys)
VALUES (
  'userConfig',
  null,
  '{}'
);
"#,
    }]
}
