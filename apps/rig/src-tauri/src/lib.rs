use std::sync::Mutex;
use tauri::{Emitter, Manager, RunEvent, WindowEvent};
mod skills;
mod update;

const OPEN_APP_UPDATE_EVENT: &str = "open-app-update";
const CHECK_FOR_UPDATES_MENU_ID: &str = "check-for-updates";

#[cfg(target_os = "macos")]
fn setup_macos_menu(app: &tauri::AppHandle, korean: bool) -> tauri::Result<()> {
    use tauri::menu::{AboutMetadata, MenuBuilder, SubmenuBuilder};

    let text = |en, ko| if korean { ko } else { en };
    let app_menu = SubmenuBuilder::new(app, "Rig")
        .about_with_text(
            text("About Rig", "Rig 정보"),
            Some(AboutMetadata::default()),
        )
        .separator()
        .text(
            CHECK_FOR_UPDATES_MENU_ID,
            text("Check for Updates...", "업데이트 확인…"),
        )
        .separator()
        .services_with_text(text("Services", "서비스"))
        .separator()
        .hide_with_text(text("Hide Rig", "Rig 가리기"))
        .hide_others_with_text(text("Hide Others", "다른 항목 가리기"))
        .show_all_with_text(text("Show All", "모두 보기"))
        .separator()
        .quit_with_text(text("Quit Rig", "Rig 종료"))
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, text("Edit", "편집"))
        .undo_with_text(text("Undo", "실행 취소"))
        .redo_with_text(text("Redo", "실행 복귀"))
        .separator()
        .cut_with_text(text("Cut", "잘라내기"))
        .copy_with_text(text("Copy", "복사"))
        .paste_with_text(text("Paste", "붙여넣기"))
        .select_all_with_text(text("Select All", "모두 선택"))
        .build()?;

    let window_menu = SubmenuBuilder::new(app, text("Window", "윈도우"))
        .minimize_with_text(text("Minimize", "최소화"))
        .maximize_with_text(text("Zoom", "확대/축소"))
        .fullscreen_with_text(text("Enter Full Screen", "전체 화면 시작"))
        .separator()
        .close_window_with_text(text("Close Window", "윈도우 닫기"))
        .build()?;

    let menu = MenuBuilder::new(app)
        .item(&app_menu)
        .item(&edit_menu)
        .item(&window_menu)
        .build()?;

    app.set_menu(menu)?;

    Ok(())
}

#[tauri::command]
async fn set_app_language(app: tauri::AppHandle, locale: String) -> Result<(), String> {
    if locale != "en" && locale != "ko" {
        return Err("Unsupported language".into());
    }
    #[cfg(target_os = "macos")]
    setup_macos_menu(&app, locale == "ko").map_err(|error| error.to_string())?;
    #[cfg(not(target_os = "macos"))]
    let _ = app;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // load environment variables from .env file
    dotenvy::dotenv().ok();

    let mut builder = tauri::Builder::default()
        .on_menu_event(|app, event| {
            if event.id() == CHECK_FOR_UPDATES_MENU_ID {
                let _ = app.emit(OPEN_APP_UPDATE_EVENT, ());
            }
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_keyring::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .max_file_size(1_000_000)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepSome(3))
                .build(),
        );

    #[cfg(debug_assertions)]
    {
        builder = builder.plugin(tauri_plugin_mcp_bridge::init());
    }

    let app = builder
        .setup(|app| {
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())
                .map_err(|e| e.to_string())?;
            app.manage(update::state::PendingUpdate(Mutex::new(None)));

            #[cfg(target_os = "macos")]
            setup_macos_menu(app.handle(), false)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_app_language,
            update::commands::fetch_update,
            update::commands::install_update,
            skills::commands::copy_skill,
            skills::commands::import_skill_root,
            skills::commands::check_skill_updates,
            skills::commands::update_skill,
            skills::commands::list_skill_versions,
            skills::commands::read_skill_version,
            skills::commands::restore_skill_version,
            skills::commands::list_archived_skills,
            skills::commands::list_skill_roots,
            skills::commands::list_skills,
            skills::commands::remove_skill,
            skills::commands::remove_skill_root,
            skills::commands::restore_skill,
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
