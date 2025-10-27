// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  tauri::Builder::default()
        .on_page_load(|window, _payload| {
            window.set_zoom(0.8).expect("Failed to set zoom");
        })
  app_lib::run();
   
}
