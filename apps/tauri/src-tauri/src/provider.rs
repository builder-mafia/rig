use std::str::FromStr;

use crate::api_key::constants::{
    ANTHROPIC_API_KEY_NAME, GOOGLE_API_KEY_NAME, OPENAI_API_KEY_NAME, VERCEL_API_KEY_NAME,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Provider {
    OpenAI,
    Google,
    Anthropic,
    Vercel,
}

impl Provider {
    pub fn key_name(self) -> &'static str {
        match self {
            Provider::OpenAI => OPENAI_API_KEY_NAME,
            Provider::Google => GOOGLE_API_KEY_NAME,
            Provider::Anthropic => ANTHROPIC_API_KEY_NAME,
            Provider::Vercel => VERCEL_API_KEY_NAME,
        }
    }
}

impl FromStr for Provider {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "openai" => Ok(Provider::OpenAI),
            "google" => Ok(Provider::Google),
            "anthropic" => Ok(Provider::Anthropic),
            "vercel" => Ok(Provider::Vercel),
            _ => Err(format!("Invalid provider: {}", s)),
        }
    }
}
