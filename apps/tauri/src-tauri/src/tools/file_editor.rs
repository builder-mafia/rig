use aisdk::{
    __private::schemars,
    core::{
        capabilities::{StructuredOutputSupport, TextInputSupport},
        tools::ToolExecute,
        LanguageModel, LanguageModelRequest, Tool,
    },
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Emitter};

const FILE_EDIT_SUGGESTION_EVENT: &str = "file_edit_suggestion";

#[derive(Debug, Clone, Deserialize, Serialize, schemars::JsonSchema)]
struct FileEditorInput {
    path: String,
    original_content: String,
    edit_instruction: String,
}

#[derive(Debug, Clone, Deserialize, Serialize, schemars::JsonSchema)]
struct FileEditorOutput {
    path: String,
    original_content: String,
    modified_content: String,
}

pub fn file_editor<M>(model: M, app: AppHandle) -> Tool
where
    M: LanguageModel + TextInputSupport + StructuredOutputSupport,
{
    Tool {
        name: "file_editor".to_string(),
        description: "Edit a local file by producing a structured proposal. Use this when the user asks you to modify code. Pass the target file path, the original full file content, and the edit instruction. This tool does not write files; it returns the original content and the full modified content for frontend review."
            .to_string(),
        input_schema: schemars::schema_for!(FileEditorInput),
        execute: ToolExecute::from_async(move |_ctx, input| {
            let model = model.clone();
            let app = app.clone();

            async move { execute_file_editor(model, app, input).await }
        }),
    }
}

async fn execute_file_editor<M>(model: M, app: AppHandle, input: Value) -> Result<String, String>
where
    M: LanguageModel + TextInputSupport + StructuredOutputSupport,
{
    let input: FileEditorInput =
        serde_json::from_value(input).map_err(|e| format!("Invalid file_editor input: {}", e))?;

    let prompt = format!(
        "Edit the local file below. Return only the structured output.\n\n\
Path:\n{}\n\n\
Edit instruction:\n{}\n\n\
Original full file content:\n<original_file_content>\n{}\n</original_file_content>\n\n\
The structured response must include the path, the original full file content, and the full modified file content. Do not return a diff.",
        input.path, input.edit_instruction, input.original_content,
    );

    let response = LanguageModelRequest::builder()
        .model(model)
        .prompt(prompt)
        .schema::<FileEditorOutput>()
        .build()
        .generate_text()
        .await
        .map_err(|e| e.to_string())?;

    let mut output: FileEditorOutput = response
        .into_schema()
        .map_err(|e| format!("Failed to parse file_editor output: {}", e))?;

    output.path = input.path;
    output.original_content = input.original_content;

    app.emit(FILE_EDIT_SUGGESTION_EVENT, &output)
        .map_err(|e| format!("Failed to emit file edit suggestion: {}", e))?;

    serde_json::to_string(&output)
        .map_err(|e| format!("Failed to serialize file_editor output: {}", e))
}
