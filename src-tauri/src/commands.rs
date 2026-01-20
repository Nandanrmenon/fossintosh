use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use tauri::Emitter;

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

#[derive(Debug, Serialize, Clone)]
pub struct DownloadProgress {
    pub app_id: String,
    pub progress: f64,
    pub downloaded: u64,
    pub total: u64,
    pub status: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct DownloadComplete {
    pub app_id: String,
    pub file_path: String,
    pub success: bool,
    pub error: Option<String>,
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
pub async fn download_app(
    app_id: String,
    download_url: String,
    window: tauri::Window,
) -> Result<String, String> {
    let downloads_dir = get_downloads_directory()
        .map_err(|e| format!("Failed to get downloads directory: {}", e))?;

    // Create file name from app_id
    let file_name = format!("{}.dmg", app_id);
    let file_path = downloads_dir.join(&file_name);

    // Emit start event
    let _ = window.emit(
        "download_progress",
        DownloadProgress {
            app_id: app_id.clone(),
            progress: 0.0,
            downloaded: 0,
            total: 0,
            status: "Starting download...".to_string(),
        },
    );

    // Create HTTP client
    let client = reqwest::Client::new();

    match client.get(&download_url).send().await {
        Ok(response) => {
            let total_size = response.content_length().unwrap_or(0);

            // Create file
            let file = fs::File::create(&file_path)
                .map_err(|e| format!("Failed to create file: {}", e))?;

            let mut stream = response.bytes_stream();
            use futures_util::stream::StreamExt;

            let mut downloaded: u64 = 0;
            let mut file_writer = std::io::BufWriter::new(file);

            while let Some(chunk) = stream.next().await {
                let chunk = chunk.map_err(|e| format!("Download error: {}", e))?;
                file_writer
                    .write_all(&chunk)
                    .map_err(|e| format!("Failed to write to file: {}", e))?;

                downloaded += chunk.len() as u64;
                let progress = if total_size > 0 {
                    (downloaded as f64 / total_size as f64) * 100.0
                } else {
                    0.0
                };

                // Emit progress event
                let _ = window.emit(
                    "download_progress",
                    DownloadProgress {
                        app_id: app_id.clone(),
                        progress,
                        downloaded,
                        total: total_size,
                        status: format!(
                            "Downloading: {:.1}%",
                            (downloaded as f64 / total_size.max(1) as f64) * 100.0
                        ),
                    },
                );
            }

            file_writer
                .flush()
                .map_err(|e| format!("Failed to flush file: {}", e))?;

            // Emit completion event
            let _ = window.emit(
                "download_complete",
                DownloadComplete {
                    app_id: app_id.clone(),
                    file_path: file_path.to_string_lossy().to_string(),
                    success: true,
                    error: None,
                },
            );

            Ok(format!("Downloaded app to: {}", file_path.display()))
        }
        Err(e) => {
            let error_msg = format!("Failed to download: {}", e);
            let _ = window.emit(
                "download_complete",
                DownloadComplete {
                    app_id: app_id.clone(),
                    file_path: String::new(),
                    success: false,
                    error: Some(error_msg.clone()),
                },
            );
            Err(error_msg)
        }
    }
}

fn get_downloads_directory() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|e| format!("Failed to get HOME: {}", e))?;
    let downloads = PathBuf::from(home).join("Downloads");

    // Create downloads directory if it doesn't exist
    fs::create_dir_all(&downloads)
        .map_err(|e| format!("Failed to create downloads directory: {}", e))?;

    Ok(downloads)
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
