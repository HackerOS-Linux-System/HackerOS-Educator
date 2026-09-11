import { Component, createSignal, Show } from "solid-js";
import { open, save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { profile, switchProfile } from "../store/progress";
import type { UserProfile } from "../types";

const About: Component = () => {
  const [status, setStatus] = createSignal<string | null>(null);

  async function exportProgress() {
    const path = await save({
      title: "Eksportuj postęp",
      defaultPath: `${profile().displayName.replace(/\s+/g, "-")}-postep.json`,
      filters: [{ name: "Profil HackerOS Educator", extensions: ["json"] }],
    });
    if (!path) return;
    await invoke("write_text_file", { path, contents: JSON.stringify(profile(), null, 2) });
    setStatus(`Wyeksportowano postęp do ${path}`);
  }

  async function importProgress() {
    const path = await open({
      title: "Importuj postęp",
      multiple: false,
      filters: [{ name: "Profil HackerOS Educator", extensions: ["json"] }],
    });
    if (!path || Array.isArray(path)) return;
    try {
      const raw = await invoke<string>("read_text_file", { path });
      const parsed = JSON.parse(raw) as UserProfile;
      if (!parsed.id) {
        setStatus("Nieprawidłowy plik profilu.");
        return;
      }
      await invoke("save_profile", { id: parsed.id, profile: parsed });
      await switchProfile(parsed.id);
      setStatus("Zaimportowano postęp i przełączono na zaimportowany profil.");
    } catch (err) {
      setStatus(`Błąd importu: ${String(err)}`);
    }
  }

  return (
    <div class="about-view">
      <h1>HackerOS Educator</h1>
      <p>
        HackerOS Educator to darmowa, open-source'owa aplikacja do nauki cyberbezpieczeństwa,
        zbudowana jako natywna część ekosystemu dystrybucji <strong>HackerOS</strong>. Projekt
        czerpie inspirację z formatu interaktywnych „pokoi” znanego z platform typu TryHackMe,
        ale działa w całości offline, bez limitów i bez konta w chmurze.
      </p>
      <h2>Stos technologiczny</h2>
      <ul>
        <li>Tauri v2 (Rust) — natywna powłoka aplikacji, lokalny terminal PTY, wieloprofilowość</li>
        <li>Solid.js + TypeScript — reaktywny interfejs użytkownika</li>
        <li>xterm.js — emulacja terminala zarówno w prawdziwym terminalu lokalnym, jak i w symulowanych maszynach docelowych</li>
        <li>Treść pokoi w plikach JSON + Markdown — łatwa do rozszerzania przez społeczność</li>
      </ul>
      <h2>Dwa rodzaje terminala</h2>
      <p>
        Niektóre zadania praktyczne dają dostęp do <strong>prawdziwego terminala lokalnego</strong> (uruchamia
        rzeczywistą powłokę Twojego systemu HackerOS przez Tauri) — używanego tam, gdzie faktycznie
        administrujesz własnym systemem. Inne zadania korzystają z{" "}
        <strong>symulowanej maszyny docelowej</strong> — bezpiecznego, w pełni przewidywalnego
        „udawacza" terminala (podobnie jak we wprowadzających pokojach TryHackMe), który działa na
        z góry zdefiniowanym, fikcyjnym systemie plików. Nie dotyka on Twojego prawdziwego komputera
        i zawsze daje ten sam wynik — idealne do prowadzonych krok po kroku ćwiczeń typu „znajdź
        dowód" czy „przeanalizuj log". Terminal symulowany jest zawsze wyraźnie oznaczony ikoną 🎯
        i etykietą „maszyna docelowa (symulacja)".
      </p>
      <h2>Zasady</h2>
      <p>
        Cała nauka odbywa się na treściach teoretycznych i lokalnych ćwiczeniach kontrolowanych
        przez użytkownika. Aplikacja nie zawiera i nie dystrybuuje gotowych exploitów ani narzędzi
        do atakowania cudzych systemów — uczy zasad, metodologii i etyki, przygotowując do dalszej
        nauki w certyfikowanych, legalnych środowiskach (własne maszyny wirtualne, CTF-y, programy
        bug bounty).
      </p>

      <h2>Kopia zapasowa postępu</h2>
      <p>Przenieś swój postęp między instalacjami HackerOS albo zrób sobie kopię zapasową.</p>
      <div class="editor-actions">
        <button class="secondary-btn" onClick={exportProgress}>📤 Eksportuj mój postęp</button>
        <button class="secondary-btn" onClick={importProgress}>📥 Importuj postęp</button>
      </div>
      <Show when={status()}>
        <p class="feedback feedback-correct">{status()}</p>
      </Show>

      <h2>Licencja</h2>
      <p>Projekt open source — zobacz plik LICENSE w repozytorium.</p>
    </div>
  );
};

export default About;
