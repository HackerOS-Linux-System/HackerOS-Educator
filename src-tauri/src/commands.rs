use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone)]
pub struct ProfileSummary {
    pub id: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub xp: i64,
    #[serde(rename = "streakDays")]
    pub streak_days: i64,
}

#[derive(Serialize, Deserialize, Default)]
struct ProfileIndex {
    profiles: Vec<ProfileSummary>,
}

#[derive(Serialize, Deserialize, Default)]
struct AppState {
    #[serde(rename = "lastActiveProfileId")]
    last_active_profile_id: Option<String>,
}

fn app_data_dir() -> Result<PathBuf, String> {
    let base = dirs::data_dir().ok_or_else(|| "Nie znaleziono katalogu danych użytkownika".to_string())?;
    let app_dir = base.join("hackeros-educator");
    fs::create_dir_all(&app_dir).map_err(|e| format!("Nie udało się utworzyć katalogu danych: {e}"))?;
    Ok(app_dir)
}

fn profiles_dir() -> Result<PathBuf, String> {
    let dir = app_data_dir()?.join("profiles");
    fs::create_dir_all(&dir).map_err(|e| format!("Nie udało się utworzyć katalogu profili: {e}"))?;
    Ok(dir)
}

fn index_path() -> Result<PathBuf, String> {
    Ok(profiles_dir()?.join("index.json"))
}

fn state_path() -> Result<PathBuf, String> {
    Ok(app_data_dir()?.join("state.json"))
}

fn read_index() -> Result<ProfileIndex, String> {
    let path = index_path()?;
    if !path.exists() {
        return Ok(ProfileIndex::default());
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("Nie udało się odczytać indeksu profili: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("Uszkodzony indeks profili: {e}"))
}

fn write_index(index: &ProfileIndex) -> Result<(), String> {
    let path = index_path()?;
    let pretty = serde_json::to_string_pretty(index).map_err(|e| e.to_string())?;
    fs::write(&path, pretty).map_err(|e| format!("Nie udało się zapisać indeksu profili: {e}"))
}

/// Zwraca listę wszystkich lokalnych profili (do przełącznika profili / "leaderboardu").
#[tauri::command]
pub fn list_profiles() -> Result<Vec<ProfileSummary>, String> {
    Ok(read_index()?.profiles)
}

/// Tworzy nowy, pusty profil o podanej nazwie i zwraca jego wygenerowane id.
#[tauri::command]
pub fn create_profile(display_name: String) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let mut index = read_index()?;
    index.profiles.push(ProfileSummary {
        id: id.clone(),
        display_name,
        xp: 0,
        streak_days: 0,
    });
    write_index(&index)?;
    Ok(id)
}

/// Usuwa profil (plik danych oraz wpis w indeksie).
#[tauri::command]
pub fn delete_profile(id: String) -> Result<(), String> {
    let mut index = read_index()?;
    index.profiles.retain(|p| p.id != id);
    write_index(&index)?;
    let path = profiles_dir()?.join(format!("{id}.json"));
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Nie udało się usunąć profilu: {e}"))?;
    }
    Ok(())
}

/// Wczytuje pełne dane profilu (postępy, XP, notatki, odznaki) po id.
#[tauri::command]
pub fn load_profile(id: String) -> Result<Option<Value>, String> {
    let path = profiles_dir()?.join(format!("{id}.json"));
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("Nie udało się odczytać profilu: {e}"))?;
    let value: Value = serde_json::from_str(&raw).map_err(|e| format!("Uszkodzony plik profilu: {e}"))?;
    Ok(Some(value))
}

/// Zapisuje pełne dane profilu i aktualizuje jego wpis (nazwa, XP, streak) w indeksie
/// — dzięki temu lista/"leaderboard" profili nie wymaga wczytywania każdego pliku osobno.
#[tauri::command]
pub fn save_profile(id: String, profile: Value) -> Result<(), String> {
    let path = profiles_dir()?.join(format!("{id}.json"));
    let pretty = serde_json::to_string_pretty(&profile).map_err(|e| e.to_string())?;
    fs::write(&path, pretty).map_err(|e| format!("Nie udało się zapisać profilu: {e}"))?;

    let display_name = profile
        .get("displayName")
        .and_then(|v| v.as_str())
        .unwrap_or("Kursant HackerOS")
        .to_string();
    let xp = profile.get("xp").and_then(|v| v.as_i64()).unwrap_or(0);
    let streak_days = profile.get("streakDays").and_then(|v| v.as_i64()).unwrap_or(0);

    let mut index = read_index()?;
    if let Some(entry) = index.profiles.iter_mut().find(|p| p.id == id) {
        entry.display_name = display_name;
        entry.xp = xp;
        entry.streak_days = streak_days;
    } else {
        index.profiles.push(ProfileSummary { id, display_name, xp, streak_days });
    }
    write_index(&index)?;
    Ok(())
}

/// Zapamiętuje, który profil był ostatnio aktywny, żeby wznowić go przy starcie aplikacji.
#[tauri::command]
pub fn set_last_active_profile(id: String) -> Result<(), String> {
    let path = state_path()?;
    let state = AppState { last_active_profile_id: Some(id) };
    let pretty = serde_json::to_string_pretty(&state).map_err(|e| e.to_string())?;
    fs::write(&path, pretty).map_err(|e| format!("Nie udało się zapisać stanu aplikacji: {e}"))
}

#[tauri::command]
pub fn get_last_active_profile() -> Result<Option<String>, String> {
    let path = state_path()?;
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let state: AppState = serde_json::from_str(&raw).unwrap_or_default();
    Ok(state.last_active_profile_id)
}

/// Ogólna komenda do wczytania dowolnego pliku tekstowego (np. paczki pokoi
/// wybranej przez użytkownika w oknie dialogowym).
#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Nie udało się odczytać pliku: {e}"))
}

/// Ogólna komenda do zapisania dowolnego pliku tekstowego (np. eksport paczki
/// pokoi lub eksport postępu użytkownika).
#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|e| format!("Nie udało się zapisać pliku: {e}"))
}

/// Zwraca ścieżkę katalogu danych aplikacji — przydatne do diagnostyki w UI.
#[tauri::command]
pub fn data_dir_path() -> Result<String, String> {
    Ok(app_data_dir()?.display().to_string())
}
