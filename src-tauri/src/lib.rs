mod commands;
mod terminal;

use terminal::TerminalRegistry;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .manage(TerminalRegistry::default())
        .invoke_handler(tauri::generate_handler![
            commands::list_profiles,
            commands::create_profile,
            commands::delete_profile,
            commands::load_profile,
            commands::save_profile,
            commands::set_last_active_profile,
            commands::get_last_active_profile,
            commands::read_text_file,
            commands::write_text_file,
            commands::data_dir_path,
            terminal::terminal_spawn,
            terminal::terminal_write,
            terminal::terminal_resize,
            terminal::terminal_kill,
        ])
        .run(tauri::generate_context!())
        .expect("błąd podczas uruchamiania aplikacji HackerOS Educator");
}
