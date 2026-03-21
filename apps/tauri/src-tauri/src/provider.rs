use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Provider {
    OpenAI,
    Google,
    Anthropic,
    Vercel,
    Codex,
}

impl FromStr for Provider {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "openai" => Ok(Provider::OpenAI),
            "google" => Ok(Provider::Google),
            "anthropic" => Ok(Provider::Anthropic),
            "vercel" => Ok(Provider::Vercel),
            "codex" => Ok(Provider::Codex),
            _ => Err(format!("Invalid provider: {}", s)),
        }
    }
}
