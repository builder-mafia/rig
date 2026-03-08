use aisdk::{
    core::{
        capabilities::TextInputSupport, DynamicModel, LanguageModel, LanguageModelRequest, Message,
        Messages,
    },
    integrations::vercel_aisdk_ui::{VercelUIMessage, VercelUIStream, VercelUIStreamOptions},
    providers::{anthropic::Anthropic, google::Google, openai::OpenAI, vercel::Vercel},
};
use futures::StreamExt;
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use tauri::{ipc::Channel, AppHandle};
use tauri_plugin_keyring::KeyringExt;

use crate::api_key::constants::KEYRING_SERVICE;
use crate::provider::Provider;

fn cancel_map() -> &'static Mutex<HashMap<String, Arc<AtomicBool>>> {
    static MAP: OnceLock<Mutex<HashMap<String, Arc<AtomicBool>>>> = OnceLock::new();
    MAP.get_or_init(|| Mutex::new(HashMap::new()))
}

async fn do_text_request<M: LanguageModel + TextInputSupport>(
    model: M,
    messages: Messages,
    tx: tokio::sync::mpsc::Sender<VercelUIStream>,
    cancel_flag: Arc<AtomicBool>,
) -> Result<(), String> {
    println!("model: {}", model.name().clone());

    let response = LanguageModelRequest::builder()
        .model(model)
        .system("You are a helpful assistant.")
        .messages(messages)
        .build()
        .stream_text()
        .await
        .map_err(|e| e.to_string())?;

    let options = VercelUIStreamOptions {
        send_reasoning: true,
        send_start: true,
        send_finish: true,
        generate_message_id: None,
    };

    let mut stream = response.into_vercel_ui_stream(options);

    while let Some(chunk) = stream.next().await {
        if cancel_flag.load(Ordering::Relaxed) {
            break;
        }
        let ui_chunk = match chunk {
            Ok(c) => {
                println!("{:?}", c);
                c
            }
            Err(e) => VercelUIStream::Error {
                error_text: e.to_string(),
            },
        };

        if tx.send(ui_chunk).await.is_err() {
            break;
        }
    }

    Ok(())
}

fn get_api_key(app: AppHandle, provider_name: &String, key_name: &str) -> Result<String, String> {
    let result = app
        .keyring()
        .get_password(KEYRING_SERVICE, key_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| {
            format!(
                "API key not set. Please configure your {} API key in settings.",
                provider_name
            )
        })?;
    Ok(result)
}

async fn do_stream(
    app: AppHandle,
    provider_name: String,
    model_id: String,
    messages: Messages,
    tx: tokio::sync::mpsc::Sender<VercelUIStream>,
    cancel_flag: Arc<AtomicBool>,
) -> Result<(), String> {
    if cancel_flag.load(Ordering::Relaxed) {
        return Ok(());
    }

    let provider: Provider = provider_name.parse()?;

    println!("provider: {} in commands.rs", provider_name);

    if let Provider::Codex = provider {
        let auth = crate::auth::token_store::get_or_refresh(&app).await?;

        let model = OpenAI::<DynamicModel>::builder()
            .model_name(model_id)
            .base_url(crate::auth::oauth::CODEX_API_BASE_URL)
            .path(crate::auth::oauth::CODEX_API_PATH)
            .api_key(auth.access_token)
            .build()
            .map_err(|e| e.to_string())?;
        do_text_request(model, messages, tx, cancel_flag).await?;
        return Ok(());
    }

    let api_key = get_api_key(app, &provider_name, provider.key_name())?;

    match provider {
        Provider::OpenAI => {
            let model = OpenAI::<DynamicModel>::builder()
                .model_name(model_id)
                .api_key(api_key)
                .build()
                .map_err(|e| e.to_string())?;
            do_text_request(model, messages, tx, cancel_flag).await?;
        }
        Provider::Google => {
            let model = Google::<DynamicModel>::builder()
                .model_name(model_id)
                .api_key(api_key)
                .build()
                .map_err(|e| e.to_string())?;
            do_text_request(model, messages, tx, cancel_flag).await?;
        }
        Provider::Anthropic => {
            let model = Anthropic::<DynamicModel>::builder()
                .model_name(model_id)
                .api_key(api_key)
                .build()
                .map_err(|e| e.to_string())?;
            do_text_request(model, messages, tx, cancel_flag).await?;
        }
        Provider::Vercel => {
            let model = Vercel::<DynamicModel>::builder()
                .model_name(model_id)
                .api_key(api_key)
                .build()
                .map_err(|e| e.to_string())?;
            do_text_request(model, messages, tx, cancel_flag).await?;
        }
        Provider::Codex => unreachable!(),
    }

    Ok(())
}

#[tauri::command]
pub async fn stream_text(
    app: AppHandle,
    messages: Vec<VercelUIMessage>,
    provider_name: String,
    model_id: String,
    request_id: String,
    on_event: Channel<VercelUIStream>,
) -> Result<(), String> {
    let cancel_flag = Arc::new(AtomicBool::new(false));
    let cancel_flag_for_forward = cancel_flag.clone();
    {
        let mut map = cancel_map()
            .lock()
            .map_err(|_| "Cancel map poisoned".to_string())?;
        map.insert(request_id.clone(), cancel_flag.clone());
    }

    // Convert UI messages to model messages
    let model_messages = Message::from_vercel_ui_message(&messages);

    // Spawn a blocking task with its own runtime for the non-Send stream
    let (tx, mut rx) = tokio::sync::mpsc::channel::<VercelUIStream>(100);

    let handle = std::thread::spawn(move || {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();

        rt.block_on(async move {
            do_stream(
                app,
                provider_name,
                model_id,
                model_messages,
                tx,
                cancel_flag,
            )
            .await?;
            Ok::<(), String>(())
        })
    });

    // Forward events from the channel to the IPC channel
    while let Some(event) = rx.recv().await {
        if cancel_flag_for_forward.load(Ordering::Relaxed) {
            break;
        }
        let is_error = matches!(event, VercelUIStream::Error { .. });
        on_event.send(event).map_err(|e| e.to_string())?;

        if is_error {
            break;
        }
    }

    // Wait for the thread to complete
    handle.join().map_err(|_| "Thread panicked".to_string())??;

    // Cleanup cancellation registry
    {
        let mut map = cancel_map()
            .lock()
            .map_err(|_| "Cancel map poisoned".to_string())?;
        map.remove(&request_id);
    }

    Ok(())
}

#[tauri::command]
pub async fn abort_stream(request_id: String) -> Result<(), String> {
    let map = cancel_map()
        .lock()
        .map_err(|_| "Cancel map poisoned".to_string())?;
    if let Some(flag) = map.get(&request_id) {
        flag.store(true, Ordering::Relaxed);
    }
    Ok(())
}
