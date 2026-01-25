mod api_key;
mod chat;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // load environment variables from .env file
    dotenvy::dotenv().ok();

    tauri::Builder::default()
        .plugin(tauri_plugin_keyring::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            chat::commands::stream_text,
            api_key::commands::save_api_key,
            api_key::commands::get_api_key,
            api_key::commands::delete_api_key,
            api_key::commands::has_api_key,
            storage::commands::get_channels,
            storage::commands::get_channel,
            storage::commands::create_channel,
            storage::commands::update_channel,
            storage::commands::delete_channel,
            storage::commands::get_messages,
            storage::commands::save_messages,
            storage::commands::get_all_agents,
            storage::commands::get_agent,
            storage::commands::create_agent,
            storage::commands::update_agent,
            storage::commands::delete_agent,
            storage::commands::get_app_settings,
            storage::commands::save_app_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
