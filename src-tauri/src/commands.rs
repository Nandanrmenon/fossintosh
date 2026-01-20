use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::os::unix::fs as unix_fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Emitter;

// Global map to store cancellation flags for each download
static DOWNLOAD_CANCELLATIONS: Lazy<Mutex<HashMap<String, bool>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

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

#[derive(Debug, Serialize, Clone)]
pub struct InstallProgress {
    pub app_id: String,
    pub progress: f64,
    pub status: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct InstallComplete {
    pub app_id: String,
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

// Configuration for apps registry URL
const APPS_REGISTRY_BASE_URL: &str =
    "https://raw.githubusercontent.com/Nandanrmenon/fossintosh-repo/main";
const APPS_REGISTRY_INDEX_URL: &str =
    "https://raw.githubusercontent.com/Nandanrmenon/fossintosh-repo/main/index.json";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppRegistry {
    pub id: String,
    pub url: String,
}

// Command to fetch apps from your registry
#[tauri::command]
pub async fn fetch_apps() -> Result<Vec<App>, String> {
    let client = reqwest::Client::new();

    // Fetch the index (list of app IDs)
    let app_ids: Vec<String> = client
        .get(APPS_REGISTRY_INDEX_URL)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch registry index: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Failed to parse registry index: {}", e))?;

    // Fetch each app in parallel
    let mut app_futures = vec![];
    for app_id in app_ids {
        let client = client.clone();
        let url = format!("{}/apps/{}.json", APPS_REGISTRY_BASE_URL, app_id);
        let future = async move { client.get(&url).send().await.ok()?.json::<App>().await.ok() };
        app_futures.push(future);
    }

    let apps: Vec<App> = futures_util::future::join_all(app_futures)
        .await
        .into_iter()
        .filter_map(|app| app)
        .collect();

    if apps.is_empty() {
        return Err("Failed to fetch any apps from registry".to_string());
    }

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
                // Check if download was cancelled
                {
                    let cancellations = DOWNLOAD_CANCELLATIONS.lock().unwrap();
                    if cancellations.get(&app_id).copied().unwrap_or(false) {
                        drop(cancellations);
                        // Clean up cancellation flag
                        let mut cancel_write = DOWNLOAD_CANCELLATIONS.lock().unwrap();
                        cancel_write.remove(&app_id);
                        // Delete partial file
                        let _ = fs::remove_file(&file_path);
                        let _ = window.emit(
                            "download_complete",
                            DownloadComplete {
                                app_id: app_id.clone(),
                                file_path: String::new(),
                                success: false,
                                error: Some("Download cancelled".to_string()),
                            },
                        );
                        return Ok(format!("Download cancelled: {}", app_id));
                    }
                }

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

// Command to cancel a download
#[tauri::command]
pub async fn cancel_download(app_id: String) -> Result<String, String> {
    let mut cancellations = DOWNLOAD_CANCELLATIONS.lock().unwrap();
    cancellations.insert(app_id.clone(), true);
    Ok(format!("Download cancelled for app: {}", app_id))
}

// Command to install a downloaded app
#[tauri::command]
pub async fn install_app(
    app_id: String,
    file_path: String,
    window: tauri::Window,
) -> Result<String, String> {
    // Expand ~ to home directory
    let expanded_path = if file_path.starts_with("~") {
        let home = std::env::var("HOME").map_err(|e| format!("Failed to get HOME: {}", e))?;
        file_path.replacen("~", &home, 1)
    } else {
        file_path
    };

    // Check if file exists
    if !PathBuf::from(&expanded_path).exists() {
        return Err(format!(
            "File not found: {}. Make sure the file was downloaded successfully.",
            expanded_path
        ));
    }

    let file_extension = std::path::Path::new(&expanded_path)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();

    let _ = window.emit(
        "install_progress",
        InstallProgress {
            app_id: app_id.clone(),
            progress: 10.0,
            status: "Starting installation...".to_string(),
        },
    );

    match file_extension.as_str() {
        "dmg" => install_dmg(&app_id, &expanded_path, &window).await,
        "pkg" => install_pkg(&app_id, &expanded_path, &window).await,
        _ => Err(format!("Unsupported file format: {}", file_extension)),
    }
}

async fn install_dmg(
    app_id: &str,
    file_path: &str,
    window: &tauri::Window,
) -> Result<String, String> {
    use std::process::Command;

    let _ = window.emit(
        "install_progress",
        InstallProgress {
            app_id: app_id.to_string(),
            progress: 20.0,
            status: "Mounting DMG...".to_string(),
        },
    );

    // Mount the DMG
    let mount_output = Command::new("hdiutil")
        .args(&["mount", file_path, "-plist"])
        .output()
        .map_err(|e| format!("Failed to mount DMG: {}", e))?;

    if !mount_output.status.success() {
        let stderr = String::from_utf8_lossy(&mount_output.stderr);
        eprintln!("Mount failed stderr: {}", stderr);
        return Err(format!("Failed to mount DMG: {}", stderr));
    }

    // Parse mount point from plist output
    let output_str = String::from_utf8_lossy(&mount_output.stdout);
    eprintln!("Mount output: {}", output_str);

    let mount_point = output_str
        .lines()
        .find_map(|line| {
            if line.contains("<string>/Volumes") {
                let start = line.find("<string>")?;
                let end = line.find("</string>")?;
                if start < end {
                    let path = line[start + 8..end].to_string();
                    return Some(path.trim().to_string());
                }
            }
            None
        })
        .or_else(|| {
            // Fallback: look for any line with /Volumes
            output_str
                .lines()
                .find(|line| line.contains("/Volumes"))
                .and_then(|line| {
                    if let Some(start) = line.find("/Volumes") {
                        if let Some(end) = line[start..].find("</string>") {
                            return Some(line[start..start + end].trim().to_string());
                        }
                        // Also try without closing tag
                        if let Some(end) = line[start..].find('\n') {
                            return Some(line[start..start + end].trim().to_string());
                        }
                        return Some(
                            line[start..]
                                .trim_end_matches("</string>")
                                .trim()
                                .to_string(),
                        );
                    }
                    None
                })
        })
        .or_else(|| {
            // Final fallback: old tab-separated method
            output_str
                .lines()
                .last()
                .and_then(|line| line.split('\t').nth(2).map(|s| s.trim().to_string()))
        })
        .ok_or_else(|| {
            eprintln!("Failed to extract mount point from output");
            "Failed to determine mount point".to_string()
        })?;

    eprintln!("Extracted mount point: {:?}", mount_point);

    let _ = window.emit(
        "install_progress",
        InstallProgress {
            app_id: app_id.to_string(),
            progress: 40.0,
            status: "Finding app bundle...".to_string(),
        },
    );

    // Find .app bundle in the mounted DMG
    let mut entries =
        fs::read_dir(&mount_point).map_err(|e| format!("Failed to read DMG contents: {}", e))?;

    let app_bundle = entries
        .find_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path();
            if path.extension()?.to_str()? == "app" {
                Some(path)
            } else {
                None
            }
        })
        .ok_or("No .app bundle found in DMG")?;

    let app_name = app_bundle
        .file_name()
        .ok_or("Invalid app name")?
        .to_string_lossy()
        .to_string();

    let _ = window.emit(
        "install_progress",
        InstallProgress {
            app_id: app_id.to_string(),
            progress: 60.0,
            status: format!("Copying {} to Applications...", app_name),
        },
    );

    // Copy app to Applications folder
    let applications_dir = get_applications_directory()?;
    let destination = applications_dir.join(&app_name);

    // Remove if already exists
    if destination.exists() {
        fs::remove_dir_all(&destination)
            .map_err(|e| format!("Failed to remove existing app: {}", e))?;
    }

    copy_dir_all(&app_bundle, &destination).map_err(|e| format!("Failed to copy app: {}", e))?;

    let _ = window.emit(
        "install_progress",
        InstallProgress {
            app_id: app_id.to_string(),
            progress: 80.0,
            status: "Unmounting DMG...".to_string(),
        },
    );

    // Unmount the DMG - use force to eject even if files are in use
    eprintln!("Attempting to unmount: {:?}", mount_point);

    let unmount_output = Command::new("hdiutil")
        .arg("eject")
        .arg("-force")
        .arg(&mount_point)
        .output()
        .map_err(|e| format!("Failed to unmount DMG: {}", e))?;

    if !unmount_output.status.success() {
        let stderr = String::from_utf8_lossy(&unmount_output.stderr);
        let stdout = String::from_utf8_lossy(&unmount_output.stdout);
        eprintln!("Warning: Failed to force-eject DMG");
        eprintln!("Eject stderr: {}", stderr);
        eprintln!("Eject stdout: {}", stdout);

        // Try unmount with -force as fallback
        let unmount_fallback = Command::new("hdiutil")
            .arg("unmount")
            .arg("-force")
            .arg(&mount_point)
            .output()
            .map_err(|e| format!("Failed to unmount DMG (fallback): {}", e))?;

        if !unmount_fallback.status.success() {
            let stderr = String::from_utf8_lossy(&unmount_fallback.stderr);
            eprintln!(
                "Warning: Both force-eject and force-unmount failed: {}",
                stderr
            );
            // Non-fatal: installation succeeded, just couldn't unmount
        } else {
            eprintln!("Successfully unmounted DMG using force-unmount fallback");
        }
    } else {
        eprintln!("Successfully unmounted DMG using force-eject");
    }

    let _ = window.emit(
        "install_complete",
        InstallComplete {
            app_id: app_id.to_string(),
            success: true,
            error: None,
        },
    );

    Ok(format!(
        "Successfully installed {} to Applications",
        app_name
    ))
}

async fn install_pkg(
    app_id: &str,
    file_path: &str,
    window: &tauri::Window,
) -> Result<String, String> {
    use std::process::Command;

    let _ = window.emit(
        "install_progress",
        InstallProgress {
            app_id: app_id.to_string(),
            progress: 30.0,
            status: "Running installer...".to_string(),
        },
    );

    // Run the PKG installer with admin privileges
    let output = Command::new("open")
        .args(&[file_path])
        .output()
        .map_err(|e| format!("Failed to open PKG installer: {}", e))?;

    if !output.status.success() {
        let error_msg = format!(
            "Failed to install PKG: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        let _ = window.emit(
            "install_complete",
            InstallComplete {
                app_id: app_id.to_string(),
                success: false,
                error: Some(error_msg.clone()),
            },
        );
        return Err(error_msg);
    }

    let _ = window.emit(
        "install_progress",
        InstallProgress {
            app_id: app_id.to_string(),
            progress: 100.0,
            status: "Installer launched - follow the prompts".to_string(),
        },
    );

    let _ = window.emit(
        "install_complete",
        InstallComplete {
            app_id: app_id.to_string(),
            success: true,
            error: None,
        },
    );

    Ok(format!("PKG installer opened for: {}", app_id))
}

fn get_applications_directory() -> Result<PathBuf, String> {
    let applications = PathBuf::from("/Applications");
    if !applications.exists() {
        return Err("Applications directory not found".to_string());
    }
    Ok(applications)
}

// Helper function to recursively copy directories
fn copy_dir_all(src: &PathBuf, dst: &PathBuf) -> std::io::Result<()> {
    eprintln!("Copying from {:?} to {:?}", src, dst);
    fs::create_dir_all(&dst).map_err(|e| {
        eprintln!("Failed to create directory {:?}: {}", dst, e);
        e
    })?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if ty.is_symlink() {
            // Handle symlinks: read the symlink target and recreate it
            match std::fs::read_link(&src_path) {
                Ok(target) => {
                    // Remove destination if it exists
                    let _ = fs::remove_file(&dst_path);
                    // Create the symlink at the destination
                    if let Err(e) = unix_fs::symlink(&target, &dst_path) {
                        eprintln!("Warning: Failed to create symlink {:?}: {}", dst_path, e);
                        // Continue anyway - symlink failure shouldn't break the entire installation
                    }
                }
                Err(e) => {
                    eprintln!("Warning: Failed to read symlink {:?}: {}", src_path, e);
                    // Continue anyway
                }
            }
        } else if ty.is_dir() {
            copy_dir_all(&src_path, &dst_path)?;
        } else {
            eprintln!("Copying file: {:?} -> {:?}", src_path, dst_path);
            fs::copy(&src_path, &dst_path).map_err(|e| {
                eprintln!("Failed to copy {:?}: {}", src_path, e);
                e
            })?;
        }
    }
    eprintln!("Copy completed successfully");
    Ok(())
}
