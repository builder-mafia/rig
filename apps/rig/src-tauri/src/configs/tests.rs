use super::{catalog, editing::save_document, files, manifest, models::*, store};
use serde_json::json;
use std::{fs, path::PathBuf};

struct Fixture {
    root: PathBuf,
    home: PathBuf,
    registry: PathBuf,
}

#[test]
fn clearing_fields_removes_keys_and_keeps_unrelated_json_and_toml() {
    let fixture = Fixture::new();
    let path = fixture.home.join("config");
    let remove = |parts| ConfigEdit::RemoveProperty { path: parts };
    let key = |key: &str| PropertyPart::Key(key.into());
    let json_file = fixture.file(ConfigFormat::Json);
    let json = r#"{
  "quoted\".key": "old",
  "keep": 9007199254740999,
  "quoted\".key": "new",
  "array": [1, 2, 3]
}"#;
    fs::write(&path, json).unwrap();
    let saved = save_document(
        &json_file,
        &fixture.home,
        Some(&files::revision(json)),
        remove(vec![key("quoted\".key")]),
    )
    .unwrap();
    assert_eq!(
        saved.content.as_deref(),
        Some("{\n  \"keep\": 9007199254740999,\n  \"array\": [1, 2, 3]\n}")
    );
    let saved = save_document(
        &json_file,
        &fixture.home,
        saved.revision.as_deref(),
        remove(vec![key("array"), PropertyPart::Index(1)]),
    )
    .unwrap();
    assert_eq!(saved.value.unwrap()["array"], json!([1, 3]));

    let toml_file = fixture.file(ConfigFormat::Toml);
    let toml = "[git_branch]\nstyle = 'bold'\ndisabled = true # retain comment\n";
    fs::write(&path, toml).unwrap();
    let saved = save_document(
        &toml_file,
        &fixture.home,
        Some(&files::revision(toml)),
        remove(vec![key("git_branch"), key("style")]),
    )
    .unwrap();
    assert_eq!(
        saved.content.as_deref(),
        Some("[git_branch]\ndisabled = true # retain comment\n")
    );
    assert!(saved.value.unwrap()["git_branch"].get("style").is_none());
    fs::remove_file(&path).unwrap();
    let missing =
        save_document(&toml_file, &fixture.home, None, remove(vec![key("unused")])).unwrap();
    assert!(!missing.exists);
    assert!(!path.exists());
}

#[test]
fn source_saves_create_files_and_keep_invalid_or_stale_edits_off_disk() {
    let fixture = Fixture::new();
    let mut file = fixture.file(ConfigFormat::Json);
    file.path = "~/.example/config.json".into();
    let path = fixture.home.join(".example/config.json");
    let source = |content: &str| ConfigEdit::Source {
        content: content.into(),
    };
    assert_eq!(
        save_document(&file, &fixture.home, None, source("{invalid"))
            .unwrap_err()
            .code,
        "invalidConfig"
    );
    assert!(!path.parent().unwrap().exists());
    let first = save_document(&file, &fixture.home, None, source("{\"enabled\":false}\n")).unwrap();
    assert!(first.exists);
    assert_eq!(first.value.unwrap()["enabled"], false);
    assert_eq!(
        save_document(&file, &fixture.home, None, source("{}\n"))
            .unwrap_err()
            .code,
        "conflict"
    );
    fs::write(&path, "{\"enabled\":true}\n").unwrap();
    assert_eq!(
        save_document(
            &file,
            &fixture.home,
            first.revision.as_deref(),
            source("{}\n")
        )
        .unwrap_err()
        .code,
        "conflict"
    );
    assert_eq!(fs::read_to_string(path).unwrap(), "{\"enabled\":true}\n");
}

#[test]
fn property_saves_preserve_unrelated_json_bytes_and_distinguish_keys_from_indices() {
    let fixture = Fixture::new();
    let file = fixture.file(ConfigFormat::Json);
    let source = "{\r\n  \"literal.dot\": {\"0\": [false, {\"mode\": \"safe\"}]},\r\n  \"large\": 9007199254740999, \"decimal\": 1.23000e+02\r\n}\r\n";
    fs::write(fixture.home.join("config"), source).unwrap();
    let key = |text: &str| PropertyPart::Key(text.into());
    let saved = save_document(
        &file,
        &fixture.home,
        Some(&files::revision(source)),
        ConfigEdit::Property {
            path: vec![
                key("literal.dot"),
                key("0"),
                PropertyPart::Index(1),
                key("mode"),
            ],
            value: "\"full\"".into(),
        },
    )
    .unwrap();
    assert_eq!(
        saved.content.as_deref(),
        Some(source.replace("\"safe\"", "\"full\"").as_str())
    );
    let added = save_document(
        &file,
        &fixture.home,
        saved.revision.as_deref(),
        ConfigEdit::Property {
            path: vec![key("features"), key("enabled")],
            value: "false".into(),
        },
    )
    .unwrap();
    assert_eq!(added.value.unwrap()["features"]["enabled"], false);
    assert!(added
        .content
        .unwrap()
        .contains("\r\n  \"features\": {\"enabled\": false}\r\n"));
}

#[test]
fn property_saves_preserve_toml_comments_and_edit_array_of_table_children() {
    let fixture = Fixture::new();
    let file = fixture.file(ConfigFormat::Toml);
    let source = "# settings\nratio = 1.0 # retain float\n\n[[servers]]\nname  =  'first' # retain comment\nargs = ['a', 'b']\nstarted = 2026-11-07T01:02:03Z\n";
    fs::write(fixture.home.join("config"), source).unwrap();
    let key = |text: &str| PropertyPart::Key(text.into());
    let saved = save_document(
        &file,
        &fixture.home,
        Some(&files::revision(source)),
        ConfigEdit::Property {
            path: vec![key("servers"), PropertyPart::Index(0), key("name")],
            value: "\"second\"".into(),
        },
    )
    .unwrap();
    assert_eq!(
        saved.content.as_deref(),
        Some(source.replace("'first'", "\"second\"").as_str())
    );
    assert_eq!(
        saved.value.as_ref().unwrap()["servers"][0]["started"],
        "2026-11-07T01:02:03Z"
    );
    let invalid = save_document(
        &file,
        &fixture.home,
        saved.revision.as_deref(),
        ConfigEdit::Property {
            path: vec![
                key("servers"),
                PropertyPart::Index(0),
                key("args"),
                PropertyPart::Index(0),
            ],
            value: "null".into(),
        },
    )
    .unwrap_err();
    assert_eq!(invalid.code, "invalidValue");
    assert_eq!(
        fs::read_to_string(fixture.home.join("config")).unwrap(),
        saved.content.unwrap()
    );
}

#[cfg(unix)]
#[test]
fn saving_a_link_preserves_the_link_and_target_permissions() {
    use std::os::unix::fs::{symlink, PermissionsExt};
    let fixture = Fixture::new();
    let file = fixture.file(ConfigFormat::Text);
    let target = fixture.home.join("dotfile");
    fs::write(&target, "old\n").unwrap();
    fs::set_permissions(&target, fs::Permissions::from_mode(0o640)).unwrap();
    let link = fixture.home.join("config");
    symlink(&target, &link).unwrap();
    save_document(
        &file,
        &fixture.home,
        Some(&files::revision("old\n")),
        ConfigEdit::Source {
            content: "new\n".into(),
        },
    )
    .unwrap();
    assert!(link.symlink_metadata().unwrap().is_symlink());
    assert_eq!(fs::read_to_string(&target).unwrap(), "new\n");
    assert_eq!(
        target.metadata().unwrap().permissions().mode() & 0o777,
        0o640
    );
}
impl Fixture {
    fn new() -> Self {
        let root = std::env::temp_dir().join(format!("rig-config-test-{}", uuid::Uuid::new_v4()));
        let home = root.join("home");
        fs::create_dir_all(&home).unwrap();
        Self {
            registry: root.join("registry"),
            root,
            home,
        }
    }
    fn file(&self, format: ConfigFormat) -> ConfigFile {
        ConfigFile {
            id: "config".into(),
            label: "Configuration".into(),
            path: "~/config".into(),
            environment: None,
            format,
            schema: Some(json!({"type":"object","properties":{"enabled":{"type":"boolean"}}})),
        }
    }
    fn plugin(&self) -> ConfigPlugin {
        ConfigPlugin {
            schema_version: 1,
            id: "fixture".into(),
            name: "Fixture".into(),
            version: "1.0.0".into(),
            description: "Configuration fixture".into(),
            icon: "settings".into(),
            homepage: None,
            files: vec![self.file(ConfigFormat::Json)],
        }
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

#[test]
fn bundled_plugins_have_valid_embedded_schemas() {
    assert_eq!(catalog::builtins().len(), 6);
    for plugin in catalog::builtins() {
        manifest::validate(plugin).unwrap();
    }
    let codex = &catalog::builtins()[0].files[0].schema.as_ref().unwrap()["properties"];
    assert!(codex.get("model").is_some());
    assert!(codex.get("mcp_servers").is_some());
}

#[test]
fn newly_bundled_plugin_does_not_retarget_an_existing_custom_manifest() {
    let fixture = Fixture::new();
    let mut custom = fixture.plugin();
    custom.id = "starship".into();
    fs::create_dir_all(&fixture.registry).unwrap();
    fs::write(
        fixture.registry.join("config-plugins-v1.json"),
        serde_json::to_vec(&store::Registry {
            installed: vec![custom.id.clone()],
            custom: vec![custom],
        })
        .unwrap(),
    )
    .unwrap();

    let catalog = store::list(&fixture.registry, &fixture.home).unwrap();
    let matching: Vec<_> = catalog
        .iter()
        .filter(|plugin| plugin.id == "starship")
        .collect();
    assert_eq!(matching.len(), 1);
    assert!(!matching[0].builtin);
    let installed = store::find_installed(&fixture.registry, "starship").unwrap();
    assert_eq!(installed.files[0].path, "~/config");

    store::remove(&fixture.registry, "starship").unwrap();
    let catalog = store::list(&fixture.registry, &fixture.home).unwrap();
    let builtin = catalog
        .iter()
        .find(|plugin| plugin.id == "starship")
        .unwrap();
    assert!(builtin.builtin);
    assert!(!builtin.installed);
}

#[test]
fn new_bundled_plugins_read_and_save_their_structured_formats() {
    let fixture = Fixture::new();
    let cases = [
        (
            "claude-code",
            r#"{"permissions":{"defaultMode":"default"}}"#,
            "permissions",
            "defaultMode",
            "\"plan\"",
            json!("plan"),
        ),
        (
            "starship",
            "[git_branch]\ndisabled = false # keep\n",
            "git_branch",
            "disabled",
            "true",
            json!(true),
        ),
        (
            "gemini-cli",
            r#"{"general":{"vimMode":false}}"#,
            "general",
            "vimMode",
            "true",
            json!(true),
        ),
    ];

    for (id, source, section, key, value, expected) in cases {
        store::install(&fixture.registry, id).unwrap();
        let plugin = store::find_installed(&fixture.registry, id).unwrap();
        let mut file = plugin.files.into_iter().next().unwrap();
        file.environment = None;
        let path = fixture.home.join(file.path.strip_prefix("~/").unwrap());
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, source).unwrap();
        let before = files::read_document(&file, &fixture.home).unwrap();
        assert!(before.schema.is_some());
        assert!(before.parse_error.is_none());
        let updated = save_document(
            &file,
            &fixture.home,
            before.revision.as_deref(),
            ConfigEdit::Property {
                path: vec![
                    PropertyPart::Key(section.into()),
                    PropertyPart::Key(key.into()),
                ],
                value: value.into(),
            },
        )
        .unwrap();
        assert_eq!(updated.value.unwrap()[section][key], expected);
        assert_eq!(
            files::read_document(&file, &fixture.home).unwrap().revision,
            updated.revision
        );
        if id == "starship" {
            assert_eq!(
                fs::read_to_string(path).unwrap(),
                "[git_branch]\ndisabled = true # keep\n"
            );
        }
    }
}

#[test]
fn installing_and_removing_only_changes_plugin_registry() {
    let fixture = Fixture::new();
    fs::write(fixture.home.join("config"), "keep this file").unwrap();
    assert!(store::find_installed(&fixture.registry, "codex").is_err());
    store::install(&fixture.registry, "codex").unwrap();
    store::install(&fixture.registry, "codex").unwrap();
    assert_eq!(
        store::load(&fixture.registry).unwrap().installed,
        vec!["codex"]
    );
    assert_eq!(
        store::find_installed(&fixture.registry, "codex")
            .unwrap()
            .id,
        "codex"
    );
    let summaries =
        serde_json::to_value(store::list(&fixture.registry, &fixture.home).unwrap()).unwrap();
    assert!(summaries[0]["installed"].as_bool().unwrap());
    assert!(summaries[0]["files"][0].get("schema").is_none());
    store::remove(&fixture.registry, "codex").unwrap();
    assert!(store::find_installed(&fixture.registry, "codex").is_err());
    assert_eq!(
        fs::read_to_string(fixture.home.join("config")).unwrap(),
        "keep this file"
    );
}

#[test]
fn reads_json_without_losing_unknown_null_or_false_values() {
    let fixture = Fixture::new();
    let content = "{\"enabled\":false,\"unknown\":null,\"count\":0}";
    fs::write(fixture.home.join("config"), content).unwrap();
    let document = files::read_document(&fixture.file(ConfigFormat::Json), &fixture.home).unwrap();
    assert!(document.exists);
    assert_eq!(document.content.as_deref(), Some(content));
    assert_eq!(
        document.value.unwrap(),
        json!({"enabled":false,"unknown":null,"count":0})
    );
    assert_eq!(
        document.revision.as_deref(),
        Some(files::revision(content).as_str())
    );
}

#[test]
fn toml_is_parsed_but_shell_files_are_never_evaluated() {
    let fixture = Fixture::new();
    fs::write(
        fixture.home.join("config"),
        "model = 'fixture'\n[mcp_servers.example]\ncommand = 'echo'\n",
    )
    .unwrap();
    let document = files::read_document(&fixture.file(ConfigFormat::Toml), &fixture.home).unwrap();
    assert_eq!(
        document.value.unwrap()["mcp_servers"]["example"]["command"],
        "echo"
    );
    let content = format!(
        "touch {}/must-not-exist\nexport EXAMPLE=1",
        fixture.home.display()
    );
    fs::write(fixture.home.join("config"), &content).unwrap();
    let document = files::read_document(&fixture.file(ConfigFormat::Text), &fixture.home).unwrap();
    assert_eq!(document.content, Some(content));
    assert!(!fixture.home.join("must-not-exist").exists());
}

#[test]
fn missing_files_keep_schema_and_malformed_files_keep_source() {
    let fixture = Fixture::new();
    let file = fixture.file(ConfigFormat::Json);
    let missing = files::read_document(&file, &fixture.home).unwrap();
    assert!(!missing.exists);
    assert!(missing.content.is_none());
    assert!(missing.schema.is_some());
    let content = "{invalid json";
    fs::write(fixture.home.join("config"), content).unwrap();
    let invalid = files::read_document(&file, &fixture.home).unwrap();
    assert_eq!(invalid.content.as_deref(), Some(content));
    assert_eq!(
        invalid.parse_error.as_deref(),
        Some("Invalid JSON at line 1, column 2.")
    );
    assert!(invalid.value.is_none());
    assert!(files::read_bounded(&fixture.home.join("config"), 3).is_err());
    assert!(files::read_bounded(&fixture.home, 100).is_err());
}

#[test]
fn environment_paths_support_file_and_directory_overrides() {
    let fixture = Fixture::new();
    let mut file = fixture.file(ConfigFormat::Json);
    file.environment = Some(EnvironmentPath {
        name: "EXAMPLE_HOME".into(),
        append: Some("config.json".into()),
    });
    let (path, allowed) =
        files::resolve_path(&file, &fixture.home, |_| Some("/tmp/rig-fixture".into())).unwrap();
    assert_eq!(path, PathBuf::from("/tmp/rig-fixture/config.json"));
    assert_eq!(allowed, PathBuf::from("/tmp/rig-fixture"));
    file.environment.as_mut().unwrap().append = None;
    assert_eq!(
        files::resolve_path(&file, &fixture.home, |_| Some("~/custom.json".into()))
            .unwrap()
            .0,
        fixture.home.join("custom.json")
    );
    assert!(files::resolve_path(&file, &fixture.home, |_| Some("relative/path".into())).is_err());
    assert_eq!(
        files::resolve_path(&file, &fixture.home, |_| None)
            .unwrap()
            .0,
        fixture.home.join("config")
    );
}

#[cfg(unix)]
#[test]
fn home_symlinks_work_but_undeclared_outside_files_are_rejected() {
    let fixture = Fixture::new();
    fs::write(fixture.root.join("outside"), "{}").unwrap();
    std::os::unix::fs::symlink(fixture.root.join("outside"), fixture.home.join("config")).unwrap();
    assert_eq!(
        files::read_document(&fixture.file(ConfigFormat::Json), &fixture.home)
            .unwrap_err()
            .code,
        "invalidPath"
    );
    fs::remove_file(fixture.home.join("config")).unwrap();
    fs::write(fixture.home.join("inside"), "{}").unwrap();
    std::os::unix::fs::symlink(fixture.home.join("inside"), fixture.home.join("config")).unwrap();
    assert!(
        files::read_document(&fixture.file(ConfigFormat::Json), &fixture.home)
            .unwrap()
            .exists
    );
}

#[test]
fn manifests_reject_traversal_remote_refs_and_executable_icons() {
    let fixture = Fixture::new();
    for path in ["/etc/passwd", "~/../private", "~/a/../../b"] {
        let mut plugin = fixture.plugin();
        plugin.files[0].path = path.into();
        assert!(manifest::validate(&plugin).is_err());
    }
    for icon in ["https://example.com/icon.png", "data:image/svg+xml,<svg/>"] {
        let mut plugin = fixture.plugin();
        plugin.icon = icon.into();
        assert!(manifest::validate(&plugin).is_err());
    }
    let mut plugin = fixture.plugin();
    plugin.files[0].schema = Some(json!({"$ref":"https://example.com/schema.json"}));
    assert!(manifest::validate(&plugin).is_err());
    plugin.files[0].schema = Some(json!({"properties":{"setting":{"description":{}}}}));
    assert!(manifest::validate(&plugin).is_err());
    plugin.files[0].schema =
        Some(json!({"properties":{"setting":{"type":"string","default":{"$ref":"literal data"}}}}));
    assert!(manifest::validate(&plugin).is_ok());
    plugin = fixture.plugin();
    plugin.files.push(plugin.files[0].clone());
    assert!(manifest::validate(&plugin).is_err());
    plugin = fixture.plugin();
    plugin.schema_version = 2;
    assert!(manifest::validate(&plugin).is_err());
    let mut value = serde_json::to_value(fixture.plugin()).unwrap();
    value["script"] = json!("run this");
    assert!(serde_json::from_value::<ConfigPlugin>(value).is_err());
}

#[test]
fn custom_import_detects_preview_changes_and_persists_a_snapshot() {
    let fixture = Fixture::new();
    let path = fixture.root.join("plugin.json");
    fs::write(&path, serde_json::to_vec(&fixture.plugin()).unwrap()).unwrap();
    let (_, old_revision) = manifest::load(&path).unwrap();
    let mut updated = fixture.plugin();
    updated.description = "Updated".into();
    fs::write(&path, serde_json::to_vec(&updated).unwrap()).unwrap();
    assert_eq!(
        store::import(&fixture.registry, &path, &old_revision)
            .unwrap_err()
            .code,
        "conflict"
    );
    let (_, revision) = manifest::load(&path).unwrap();
    assert_eq!(
        store::import(&fixture.registry, &path, &revision).unwrap(),
        "fixture"
    );
    assert!(store::import(&fixture.registry, &path, &revision).is_err());
    fs::remove_file(path).unwrap();
    assert_eq!(
        store::find_installed(&fixture.registry, "fixture")
            .unwrap()
            .description,
        "Updated"
    );
    store::remove(&fixture.registry, "fixture").unwrap();
    assert!(store::load(&fixture.registry).unwrap().custom.is_empty());
}

#[test]
fn corrupt_registry_is_reported_without_overwriting_it() {
    let fixture = Fixture::new();
    fs::create_dir_all(&fixture.registry).unwrap();
    let path = fixture.registry.join("config-plugins-v1.json");
    fs::write(&path, "broken").unwrap();
    assert!(store::install(&fixture.registry, "codex").is_err());
    assert_eq!(fs::read_to_string(path).unwrap(), "broken");
}
