use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct App {
    pub id: String,
    pub name: String,
    pub description: String,
    pub version: String,
    pub category: String,
    pub icon: String,
    #[serde(rename = "downloadUrl")]
    pub download_url: String,
    pub homepage: String,
    pub license: String,
    pub author: String,
    pub screenshots: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "installedVersion")]
    pub installed_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "hasUpdate")]
    pub has_update: Option<bool>,
}

fn get_apps_file_path() -> PathBuf {
    // Try multiple paths:
    // 1. Current working directory (during dev)
    // 2. src-tauri directory
    // 3. Parent directory

    let possible_paths = vec![
        PathBuf::from("apps.json"),
        PathBuf::from("src-tauri/apps.json"),
        PathBuf::from("../apps.json"),
    ];

    for path in possible_paths {
        if path.exists() {
            return path;
        }
    }

    // Default to current directory
    PathBuf::from("apps.json")
}

// Command to fetch apps from your registry
#[tauri::command]
pub async fn fetch_apps() -> Result<Vec<App>, String> {
    let apps_path = get_apps_file_path();

    let file_content =
        fs::read_to_string(&apps_path).map_err(|e| format!("Failed to read apps.json: {}", e))?;

    let apps: Vec<App> = serde_json::from_str(&file_content)
        .map_err(|e| format!("Failed to parse apps.json: {}", e))?;

    Ok(apps)
}

// Command to download an app
#[tauri::command]
pub async fn download_app(app_id: String, _download_url: String) -> Result<String, String> {
    // TODO: Implement download logic
    // Use reqwest crate for HTTP downloads
    // Show progress via events
    Ok(format!("Downloaded app: {}", app_id))
}

// Command to check for updates
#[tauri::command]
pub async fn check_updates(_installed_apps: Vec<String>) -> Result<Vec<String>, String> {
    // TODO: Compare installed versions with registry
    Ok(vec![])
}

// Command to search apps
#[tauri::command]
pub async fn search_apps(query: String) -> Result<Vec<App>, String> {
    let apps = fetch_apps().await?;

    let query_lower = query.to_lowercase();
    let results: Vec<App> = apps
        .into_iter()
        .filter(|app| {
            app.name.to_lowercase().contains(&query_lower)
                || app.description.to_lowercase().contains(&query_lower)
                || app.category.to_lowercase().contains(&query_lower)
        })
        .collect();

    Ok(results)
}
