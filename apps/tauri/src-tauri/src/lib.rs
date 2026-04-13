mod api_key;
mod app_updates;
mod auth;
mod chat;
mod font;
mod provider;
mod storage;

use std::sync::Mutex;
use tauri::{Emitter, Manager, RunEvent, WindowEvent};

const OPEN_APP_UPDATE_EVENT: &str = "open-app-update";
const CHECK_FOR_UPDATES_MENU_ID: &str = "check-for-updates";

#[cfg(target_os = "macos")]
fn setup_macos_menu(app: &tauri::App) -> tauri::Result<()> {
    use tauri::menu::{AboutMetadata, MenuBuilder, SubmenuBuilder};

    let app_menu = SubmenuBuilder::new(app, "ALLIN")
        .about(Some(AboutMetadata::default()))
        .separator()
        .text(CHECK_FOR_UPDATES_MENU_ID, "Check for Updates...")
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;

    let window_menu = SubmenuBuilder::new(app, "Window")
        .minimize()
        .maximize()
        .fullscreen()
        .separator()
        .close_window()
        .build()?;

    let menu = MenuBuilder::new(app)
        .item(&app_menu)
        .item(&edit_menu)
        .item(&window_menu)
        .build()?;

    app.set_menu(menu)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // load environment variables from .env file
    dotenvy::dotenv().ok();

    let app = tauri::Builder::default()
        .on_menu_event(|app, event| {
            if event.id() == CHECK_FOR_UPDATES_MENU_ID {
                let _ = app.emit(OPEN_APP_UPDATE_EVENT, ());
            }
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_keyring::init())
        .setup(|app| {
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())
                .map_err(|e| e.to_string())?;
            app.manage(app_updates::PendingUpdate(Mutex::new(None)));

            #[cfg(target_os = "macos")]
            setup_macos_menu(app)?;

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
            chat::commands::abort_stream,
            api_key::commands::save_api_key,
            api_key::commands::delete_api_key,
            api_key::commands::has_api_key,
            storage::commands::get_channels,
            storage::commands::get_channel,
            storage::commands::create_channel,
            storage::commands::update_channel,
            storage::commands::delete_channel,
            storage::commands::get_messages,
            storage::commands::append_message,
            storage::commands::upsert_message,
            storage::commands::save_messages,
            storage::commands::get_all_agents,
            storage::commands::get_agent,
            storage::commands::create_agent,
            storage::commands::update_agent,
            storage::commands::delete_agent,
            storage::commands::get_app_settings,
            storage::commands::save_app_settings,
            storage::commands::get_config_files,
            storage::commands::create_config_file,
            storage::commands::check_local_path,
            storage::commands::update_config_file,
            storage::commands::delete_config_file,
            storage::commands::open_config_file_folder,
            storage::commands::open_config_file_in_opencode,
            storage::commands::open_config_file_in_cursor,
            storage::commands::open_config_file_in_zed,
            storage::commands::list_config_directory_entries,
            storage::commands::read_config_file,
            storage::commands::write_config_file,
            auth::commands::start_codex_oauth,
            auth::commands::get_codex_auth_status,
            auth::commands::revoke_codex_auth,
            app_updates::fetch_update,
            app_updates::install_update,
            font::commands::get_system_fonts,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| match event {
        RunEvent::WindowEvent {
            label,
            event: WindowEvent::CloseRequested { api, .. },
            ..
        } if label == "main" => {
            api.prevent_close();

            if let Some(window) = app_handle.get_webview_window(&label) {
                let _ = window.hide();
            }
        }
        #[cfg(target_os = "macos")]
        RunEvent::Reopen {
            has_visible_windows: false,
            ..
        } => {
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        _ => {}
    });
}
