use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Mutex;
use tauri::{Emitter, State};

/// Payload wysyłany do frontendu przy każdej porcji danych wyjściowych z terminala.
#[derive(Clone, serde::Serialize)]
struct TerminalOutputEvent {
    id: String,
    data: String,
}

struct TerminalSession {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
    child: Box<dyn Child + Send + Sync>,
}

/// Rejestr aktywnych sesji terminala, kluczowany identyfikatorem generowanym
/// po stronie frontendu (jeden na każdy otwarty panel terminala w UI).
#[derive(Default)]
pub struct TerminalRegistry(pub Mutex<HashMap<String, TerminalSession>>);

/// Uruchamia nową lokalną powłokę (bash/sh) i podłącza ją do PTY.
/// Dane wyjściowe są strumieniowane do frontendu jako zdarzenie "terminal-output".
///
/// UWAGA: terminal daje dostęp do lokalnej powłoki użytkownika — dokładnie taki,
/// jaki użytkownik ma już z poziomu dowolnego innego emulatora terminala na
/// swoim komputerze. Służy wyłącznie do ćwiczeń na własnej maszynie.
#[tauri::command]
pub fn terminal_spawn(
    app: tauri::AppHandle,
    registry: State<'_, TerminalRegistry>,
    id: String,
) -> Result<(), String> {
    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize { rows: 24, cols: 80, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| format!("Nie udało się otworzyć PTY: {e}"))?;

    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string());
    let cmd = CommandBuilder::new(shell);

    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Nie udało się uruchomić powłoki: {e}"))?;

    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("Nie udało się otworzyć strumienia wejściowego: {e}"))?;
    let mut reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("Nie udało się otworzyć strumienia wyjściowego: {e}"))?;

    let event_id = id.clone();
    let app_handle = app.clone();
    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break, // powłoka zakończona
                Ok(n) => {
                    let chunk = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app_handle.emit(
                        "terminal-output",
                        TerminalOutputEvent { id: event_id.clone(), data: chunk },
                    );
                }
                Err(_) => break,
            }
        }
    });

    let mut sessions = registry.0.lock().map_err(|_| "Zablokowany rejestr terminali".to_string())?;
    sessions.insert(id, TerminalSession { writer, master: pair.master, child });
    Ok(())
}

/// Przekazuje dane wpisane przez użytkownika (np. w xterm.js) do powłoki.
#[tauri::command]
pub fn terminal_write(
    registry: State<'_, TerminalRegistry>,
    id: String,
    data: String,
) -> Result<(), String> {
    let mut sessions = registry.0.lock().map_err(|_| "Zablokowany rejestr terminali".to_string())?;
    let session = sessions
        .get_mut(&id)
        .ok_or_else(|| "Nie znaleziono sesji terminala".to_string())?;
    session
        .writer
        .write_all(data.as_bytes())
        .map_err(|e| format!("Nie udało się wysłać danych do terminala: {e}"))?;
    Ok(())
}

/// Dopasowuje rozmiar PTY do rozmiaru panelu terminala w interfejsie.
#[tauri::command]
pub fn terminal_resize(
    registry: State<'_, TerminalRegistry>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let sessions = registry.0.lock().map_err(|_| "Zablokowany rejestr terminali".to_string())?;
    let session = sessions
        .get(&id)
        .ok_or_else(|| "Nie znaleziono sesji terminala".to_string())?;
    session
        .master
        .resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| format!("Nie udało się zmienić rozmiaru terminala: {e}"))?;
    Ok(())
}

/// Zamyka sesję terminala, zabija powłokę i zwalnia zasoby PTY (unikając procesów zombie).
#[tauri::command]
pub fn terminal_kill(registry: State<'_, TerminalRegistry>, id: String) -> Result<(), String> {
    let mut sessions = registry.0.lock().map_err(|_| "Zablokowany rejestr terminali".to_string())?;
    if let Some(mut session) = sessions.remove(&id) {
        let _ = session.child.kill();
        let _ = session.child.wait();
    }
    Ok(())
}
