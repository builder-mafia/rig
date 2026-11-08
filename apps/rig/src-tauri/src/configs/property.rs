use super::models::{error, ConfigError, ConfigFormat, PropertyPart};
use serde::{
    de::{MapAccess, Visitor},
    Deserialize, Deserializer,
};
use serde_json::value::RawValue;
use std::{collections::HashMap, fmt};
use toml_edit::{Array, DocumentMut, InlineTable, Item, Value};

fn invalid_path() -> ConfigError {
    error(
        "invalidProperty",
        "This property is unavailable. Edit the file in Source to change its structure.",
    )
}

fn invalid_value() -> ConfigError {
    error("invalidValue", "Enter a valid value for this file format.")
}

pub(super) fn edit_property(
    format: &ConfigFormat,
    content: Option<&str>,
    path: &[PropertyPart],
    value: Option<&str>,
) -> Result<String, ConfigError> {
    if path.is_empty() || path.len() > 16 {
        return Err(invalid_path());
    }
    let value: Option<&RawValue> = value
        .map(serde_json::from_str)
        .transpose()
        .map_err(|_| invalid_value())?;
    match format {
        ConfigFormat::Json => edit_json(content.unwrap_or("{}\n"), path, value),
        ConfigFormat::Toml => edit_toml(content.unwrap_or_default(), path, value),
        ConfigFormat::Text => Err(invalid_path()),
    }
}

struct JsonMembers<'a>(Vec<(String, &'a RawValue)>);

impl<'de> Deserialize<'de> for JsonMembers<'de> {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct Object;
        impl<'de> Visitor<'de> for Object {
            type Value = JsonMembers<'de>;

            fn expecting(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
                formatter.write_str("a JSON object")
            }

            fn visit_map<M: MapAccess<'de>>(self, mut map: M) -> Result<Self::Value, M::Error> {
                let mut members = Vec::new();
                while let Some(member) = map.next_entry()? {
                    members.push(member);
                }
                Ok(JsonMembers(members))
            }
        }
        deserializer.deserialize_map(Object)
    }
}

// Borrowed JSON values point into the original document, so replacing one value
// preserves key order, formatting, and the exact spelling of unrelated numbers.
fn edit_json(
    content: &str,
    path: &[PropertyPart],
    value: Option<&RawValue>,
) -> Result<String, ConfigError> {
    let mut current: &RawValue = serde_json::from_str(content).map_err(|_| invalid_path())?;
    for (depth, part) in path.iter().enumerate() {
        current = match part {
            PropertyPart::Key(key) => {
                let JsonMembers(members) =
                    serde_json::from_str(current.get()).map_err(|_| invalid_path())?;
                if value.is_none() && depth + 1 == path.len() {
                    let mut result = content.to_owned();
                    // Remove duplicate spellings of the key too, without exposing an older value.
                    for (_, child) in members.iter().rev().filter(|(name, _)| name == key) {
                        remove_json_member(&mut result, content, child, true)?;
                    }
                    return Ok(result);
                }
                match members.iter().rev().find(|(name, _)| name == key) {
                    Some((_, child)) => child,
                    None => {
                        let Some(value) = value else {
                            return Ok(content.to_owned());
                        };
                        return insert_json_key(
                            content,
                            current.get(),
                            &path[depth..],
                            value.get(),
                            members.is_empty(),
                        );
                    }
                }
            }
            PropertyPart::Index(index) => {
                let items: Vec<&RawValue> =
                    serde_json::from_str(current.get()).map_err(|_| invalid_path())?;
                match items.get(*index) {
                    Some(child) => child,
                    None if value.is_none() => return Ok(content.to_owned()),
                    None => return Err(invalid_path()),
                }
            }
        };
    }
    let mut result = content.to_owned();
    if let Some(value) = value {
        let start = current.get().as_ptr() as usize - content.as_ptr() as usize;
        result.replace_range(start..start + current.get().len(), value.get());
    } else {
        remove_json_member(&mut result, content, current, false)?;
    }
    Ok(result)
}

fn remove_json_member(
    result: &mut String,
    original: &str,
    value: &RawValue,
    object: bool,
) -> Result<(), ConfigError> {
    let value_start = value.get().as_ptr() as usize - original.as_ptr() as usize;
    let end = value_start + value.get().len();
    let start = if object {
        let key = result[..value_start]
            .trim_end()
            .strip_suffix(':')
            .ok_or_else(invalid_path)?
            .trim_end()
            .strip_suffix('"')
            .ok_or_else(invalid_path)?;
        key.rmatch_indices('"')
            .find(|(index, _)| {
                key.as_bytes()[..*index]
                    .iter()
                    .rev()
                    .take_while(|&&byte| byte == b'\\')
                    .count()
                    % 2
                    == 0
            })
            .map(|(index, _)| index)
            .ok_or_else(invalid_path)?
    } else {
        value_start
    };
    let before = result[..start].trim_end();
    let after = result[end..].trim_start();
    let range = if after.starts_with(',') {
        before.len()..result.len() - after.len() + 1
    } else {
        before.strip_suffix(',').unwrap_or(before).len()..end
    };
    result.replace_range(range, "");
    Ok(())
}

fn insert_json_key(
    content: &str,
    object: &str,
    path: &[PropertyPart],
    value: &str,
    empty: bool,
) -> Result<String, ConfigError> {
    let mut member = value.to_owned();
    for (depth, part) in path.iter().enumerate().rev() {
        let PropertyPart::Key(key) = part else {
            return Err(invalid_path());
        };
        let key = serde_json::to_string(key).map_err(|_| invalid_value())?;
        member = if depth == 0 {
            format!("{key}: {member}")
        } else {
            format!("{{{key}: {member}}}")
        };
    }
    let before_close = &object[..object.len() - 1];
    let trimmed = before_close.trim_end();
    let whitespace = &before_close[trimmed.len()..];
    let separator = if empty { "" } else { "," };
    let insertion = if let Some((_, indent)) = whitespace.rsplit_once('\n') {
        let newline = if whitespace.contains("\r\n") {
            "\r\n"
        } else {
            "\n"
        };
        format!("{separator}{newline}{indent}  {member}")
    } else {
        format!("{separator}{}{member}", if empty { "" } else { " " })
    };
    let start = object.as_ptr() as usize - content.as_ptr() as usize + trimmed.len();
    let mut result = content.to_owned();
    result.insert_str(start, &insertion);
    Ok(result)
}

fn edit_toml(
    content: &str,
    path: &[PropertyPart],
    value: Option<&RawValue>,
) -> Result<String, ConfigError> {
    let mut document: DocumentMut = content.parse().map_err(|_| invalid_path())?;
    let Some(value) = value else {
        let (last, parents) = path.split_last().ok_or_else(invalid_path)?;
        let Some(parent) = toml_item_mut(document.as_item_mut(), parents) else {
            return Ok(content.to_owned());
        };
        let removed = match last {
            PropertyPart::Key(key) => parent
                .as_table_like_mut()
                .and_then(|table| table.remove(key))
                .is_some(),
            PropertyPart::Index(index) if parent.get(*index).is_some() => {
                if let Some(array) = parent.as_array_mut() {
                    array.remove(*index);
                } else if let Some(tables) = parent.as_array_of_tables_mut() {
                    tables.remove(*index);
                }
                true
            }
            PropertyPart::Index(_) => false,
        };
        return Ok(if removed {
            document.to_string()
        } else {
            content.to_owned()
        });
    };
    let item = toml_item_mut(document.as_item_mut(), path).ok_or_else(invalid_path)?;
    // Table headers and arrays of tables are edited by their child rows.
    if !item.is_none() && !item.is_value() {
        return Err(invalid_path());
    }
    let previous = item.as_value();
    let mut replacement = to_toml(value, previous)?;
    if let Some(previous) = previous {
        *replacement.decor_mut() = previous.decor().clone();
    }
    *item = Item::Value(replacement);
    Ok(document.to_string())
}

fn toml_item_mut<'a>(mut item: &'a mut Item, path: &[PropertyPart]) -> Option<&'a mut Item> {
    for part in path {
        item = match part {
            PropertyPart::Key(key) => item.get_mut(key),
            PropertyPart::Index(index) => item.get_mut(*index),
        }?;
    }
    Some(item)
}

fn to_toml(raw: &RawValue, previous: Option<&Value>) -> Result<Value, ConfigError> {
    let text = raw.get();
    match text.as_bytes().first() {
        Some(b'"') => {
            let text: String = serde_json::from_str(text).map_err(|_| invalid_value())?;
            if previous.is_some_and(Value::is_datetime) {
                return text
                    .parse::<toml_edit::Datetime>()
                    .map(Value::from)
                    .map_err(|_| invalid_value());
            }
            Ok(Value::from(text))
        }
        Some(b'[') => {
            let items: Vec<&RawValue> = serde_json::from_str(text).map_err(|_| invalid_value())?;
            let previous = previous.and_then(Value::as_array);
            let mut result = Array::new();
            for (index, item) in items.into_iter().enumerate() {
                result.push(to_toml(item, previous.and_then(|array| array.get(index)))?);
            }
            Ok(Value::Array(result))
        }
        Some(b'{') => {
            let items: HashMap<String, &RawValue> =
                serde_json::from_str(text).map_err(|_| invalid_value())?;
            let previous = previous.and_then(Value::as_inline_table);
            let mut result = InlineTable::new();
            for (key, value) in items {
                let value = to_toml(value, previous.and_then(|table| table.get(&key)))?;
                result.insert(key, value);
            }
            Ok(Value::InlineTable(result))
        }
        Some(b'n') | None => Err(invalid_value()),
        _ => {
            let mut value: Value = text.parse().map_err(|_| invalid_value())?;
            if previous.is_some_and(Value::is_float) && value.is_integer() {
                value = format!("{text}.0").parse().map_err(|_| invalid_value())?;
            }
            Ok(value)
        }
    }
}
