use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::Rng;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use url::Url;

const CLIENT_ID: &str = "app_EMoamEEZ73f0CkXaXp7hrann";
const ISSUER: &str = "https://auth.openai.com";
pub const CODEX_API_BASE_URL: &str = "https://chatgpt.com/backend-api";
pub const CODEX_API_PATH: &str = "/codex/responses";
pub const OAUTH_PORT: u16 = 1455;

pub struct PkceCodes {
    pub verifier: String,
    pub challenge: String,
}

#[derive(Debug, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: String,
    #[serde(default)]
    pub id_token: Option<String>,
    #[serde(default)]
    pub expires_in: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct IdTokenClaims {
    #[serde(default)]
    pub chatgpt_account_id: Option<String>,
    #[serde(default, rename = "https://api.openai.com/auth")]
    pub openai_auth: Option<OpenAIAuthClaim>,
    #[serde(default)]
    pub organizations: Option<Vec<Organization>>,
}

#[derive(Debug, Deserialize)]
pub struct OpenAIAuthClaim {
    #[serde(default)]
    pub chatgpt_account_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Organization {
    pub id: String,
}

pub fn generate_pkce() -> PkceCodes {
    let verifier = generate_random_string(43);
    let mut hasher = Sha256::new();
    hasher.update(verifier.as_bytes());
    let hash = hasher.finalize();
    let challenge = URL_SAFE_NO_PAD.encode(hash);
    PkceCodes {
        verifier,
        challenge,
    }
}

fn generate_random_string(length: usize) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let mut rng = rand::thread_rng();
    (0..length)
        .map(|_| CHARS[rng.gen_range(0..CHARS.len())] as char)
        .collect()
}

pub fn generate_state() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

// -- Authorize URL --

pub fn build_authorize_url(redirect_uri: &str, pkce: &PkceCodes, state: &str) -> String {
    let mut url = Url::parse(&format!("{}/oauth/authorize", ISSUER)).expect("invalid issuer URL");
    {
        let mut q = url.query_pairs_mut();
        q.append_pair("response_type", "code");
        q.append_pair("client_id", CLIENT_ID);
        q.append_pair("redirect_uri", redirect_uri);
        q.append_pair("scope", "openid profile email offline_access");
        q.append_pair("code_challenge", &pkce.challenge);
        q.append_pair("code_challenge_method", "S256");
        q.append_pair("id_token_add_organizations", "true");
        q.append_pair("codex_cli_simplified_flow", "true");
        q.append_pair("state", state);
        q.append_pair("originator", "allin");
    }
    url.to_string()
}

pub fn redirect_uri() -> String {
    format!("http://localhost:{}/auth/callback", OAUTH_PORT)
}

// -- Callback Server --

pub async fn wait_for_callback(port: u16, expected_state: &str) -> Result<String, String> {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
        .await
        .map_err(|e| {
            format!(
                "Failed to bind OAuth callback server on port {}: {}",
                port, e
            )
        })?;

    let timeout = tokio::time::Duration::from_secs(300);

    tokio::time::timeout(timeout, accept_callback(&listener, expected_state))
        .await
        .map_err(|_| "OAuth callback timeout — authorization took too long (5 min)".to_string())?
}

async fn accept_callback(listener: &TcpListener, expected_state: &str) -> Result<String, String> {
    loop {
        let (mut stream, _) = listener
            .accept()
            .await
            .map_err(|e| format!("Failed to accept connection: {}", e))?;

        let mut buf = vec![0u8; 4096];
        let n = stream
            .read(&mut buf)
            .await
            .map_err(|e| format!("Failed to read request: {}", e))?;

        let request = String::from_utf8_lossy(&buf[..n]);

        // Parse first line: "GET /auth/callback?code=...&state=... HTTP/1.1"
        let path = match request
            .lines()
            .next()
            .and_then(|l| l.split_whitespace().nth(1))
        {
            Some(p) => p.to_string(),
            None => {
                let _ = send_response(&mut stream, 400, "Bad Request").await;
                continue;
            }
        };

        // Only handle /auth/callback
        if !path.starts_with("/auth/callback") {
            let _ = send_response(&mut stream, 404, "Not Found").await;
            continue;
        }

        let full_url = format!("http://localhost{}", path);
        let parsed =
            Url::parse(&full_url).map_err(|e| format!("Failed to parse callback URL: {}", e))?;
        let params: std::collections::HashMap<String, String> = parsed
            .query_pairs()
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect();

        // Check for OAuth error
        if let Some(error) = params.get("error") {
            let desc = params.get("error_description").cloned().unwrap_or_default();
            let _ = send_response(
                &mut stream,
                200,
                &error_html(&format!("{}: {}", error, desc)),
            )
            .await;
            return Err(format!("OAuth error: {}: {}", error, desc));
        }

        let code = params
            .get("code")
            .ok_or("Missing authorization code in callback")?
            .clone();

        let state = params
            .get("state")
            .ok_or("Missing state parameter in callback")?;

        if state != expected_state {
            let _ = send_response(
                &mut stream,
                200,
                &error_html("Invalid state — possible CSRF"),
            )
            .await;
            return Err("Invalid state parameter — potential CSRF attack".to_string());
        }

        let _ = send_response(&mut stream, 200, SUCCESS_HTML).await;
        return Ok(code);
    }
}

async fn send_response(
    stream: &mut tokio::net::TcpStream,
    status: u16,
    body: &str,
) -> Result<(), String> {
    let reason = match status {
        200 => "OK",
        400 => "Bad Request",
        404 => "Not Found",
        _ => "Unknown",
    };
    let resp = format!(
        "HTTP/1.1 {} {}\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        status,
        reason,
        body.len(),
        body,
    );
    stream
        .write_all(resp.as_bytes())
        .await
        .map_err(|e| format!("Failed to write response: {}", e))
}

// -- Token Exchange --

pub async fn exchange_code_for_tokens(
    code: &str,
    redirect_uri: &str,
    pkce: &PkceCodes,
) -> Result<TokenResponse, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/oauth/token", ISSUER))
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(&[
            ("grant_type", "authorization_code"),
            ("code", code),
            ("redirect_uri", redirect_uri),
            ("client_id", CLIENT_ID),
            ("code_verifier", &pkce.verifier),
        ])
        .send()
        .await
        .map_err(|e| format!("Token exchange request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Token exchange failed ({}): {}", status, text));
    }

    resp.json::<TokenResponse>()
        .await
        .map_err(|e| format!("Failed to parse token response: {}", e))
}

// -- Token Refresh --

pub async fn refresh_access_token(refresh_token: &str) -> Result<TokenResponse, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/oauth/token", ISSUER))
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(&[
            ("grant_type", "refresh_token"),
            ("refresh_token", refresh_token),
            ("client_id", CLIENT_ID),
        ])
        .send()
        .await
        .map_err(|e| format!("Token refresh request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!(
            "Token refresh failed ({}): {}. Please re-authenticate.",
            status, text
        ));
    }

    resp.json::<TokenResponse>()
        .await
        .map_err(|e| format!("Failed to parse refresh response: {}", e))
}

// -- JWT / Account ID --

pub fn parse_jwt_claims(token: &str) -> Option<IdTokenClaims> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    let payload = URL_SAFE_NO_PAD.decode(parts[1]).ok()?;
    serde_json::from_slice(&payload).ok()
}

fn extract_account_id_from_claims(claims: &IdTokenClaims) -> Option<String> {
    claims
        .chatgpt_account_id
        .clone()
        .or_else(|| {
            claims
                .openai_auth
                .as_ref()
                .and_then(|a| a.chatgpt_account_id.clone())
        })
        .or_else(|| {
            claims
                .organizations
                .as_ref()
                .and_then(|o| o.first().map(|org| org.id.clone()))
        })
}

pub fn extract_account_id(tokens: &TokenResponse) -> Option<String> {
    if let Some(ref id_token) = tokens.id_token {
        if let Some(claims) = parse_jwt_claims(id_token) {
            if let Some(id) = extract_account_id_from_claims(&claims) {
                return Some(id);
            }
        }
    }
    // Fallback: try access_token (some providers embed claims there)
    let claims = parse_jwt_claims(&tokens.access_token)?;
    extract_account_id_from_claims(&claims)
}

// -- HTML Templates --

const SUCCESS_HTML: &str = r#"<!doctype html>
<html>
<head><title>ALLIN — Authorization Successful</title>
<style>
body { font-family: system-ui, -apple-system, sans-serif; display: flex;
  justify-content: center; align-items: center; height: 100vh; margin: 0;
  background: #131010; color: #f1ecec; }
.container { text-align: center; padding: 2rem; }
h1 { color: #f1ecec; margin-bottom: 1rem; }
p { color: #b7b1b1; }
</style></head>
<body><div class="container">
  <h1>Authorization Successful</h1>
  <p>You can close this window and return to ALLIN.</p>
</div>
<script>setTimeout(() => window.close(), 2000)</script>
</body></html>"#;

fn error_html(error: &str) -> String {
    format!(
        r#"<!doctype html>
<html>
<head><title>ALLIN — Authorization Failed</title>
<style>
body {{ font-family: system-ui, -apple-system, sans-serif; display: flex;
  justify-content: center; align-items: center; height: 100vh; margin: 0;
  background: #131010; color: #f1ecec; }}
.container {{ text-align: center; padding: 2rem; }}
h1 {{ color: #fc533a; margin-bottom: 1rem; }}
p {{ color: #b7b1b1; }}
.error {{ color: #ff917b; font-family: monospace; margin-top: 1rem;
  padding: 1rem; background: #3c140d; border-radius: 0.5rem; }}
</style></head>
<body><div class="container">
  <h1>Authorization Failed</h1>
  <p>An error occurred during authorization.</p>
  <div class="error">{}</div>
</div></body></html>"#,
        error
    )
}
