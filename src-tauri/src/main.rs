#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::fetch_apps,
            commands::download_app,
            commands::check_updates,
            commands::search_apps,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}