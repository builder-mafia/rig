use std::sync::Mutex;

use tauri_plugin_updater::Update;

pub struct PendingUpdate(pub Mutex<Option<Update>>);
