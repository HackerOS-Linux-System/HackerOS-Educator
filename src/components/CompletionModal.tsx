import { Component, createMemo, Show } from "solid-js";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { getAllRooms, getRoomById } from "../data/rooms";
import { clearJustCompletedRoom, justCompletedRoomId, profile } from "../store/progress";

const CompletionModal: Component = () => {
  const roomId = createMemo(() => justCompletedRoomId());
  const room = createMemo(() => {
    const id = roomId();
    return id ? getRoomById(getAllRooms(profile().customRooms), id) : undefined;
  });

  function certificateText(): string {
    const r = room();
    if (!r) return "";
    const rp = profile().rooms[r.id];
    const earnedPoints = r.tasks.reduce((sum, t) => {
      const done = rp?.taskProgress[t.id]?.completed;
      return sum + (done ? t.points : 0);
    }, 0);
    const date = new Date().toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" });
    return [
      "═══════════════════════════════════════════",
      "        CERTYFIKAT UKOŃCZENIA POKOJU",
      "            HackerOS Educator",
      "═══════════════════════════════════════════",
      "",
      `Niniejszym zaświadcza się, że`,
      "",
      `                ${profile().displayName}`,
      "",
      `ukończył(a) pokój:`,
      "",
      `                „${r.title}”`,
      "",
      `Kategoria: ${r.category}`,
      `Poziom trudności: ${r.difficulty}`,
      `Zdobyte punkty: ${earnedPoints} XP`,
      `Data ukończenia: ${date}`,
      "",
      "Certyfikat wygenerowany lokalnie, offline,",
      "w ramach ekosystemu dystrybucji HackerOS.",
      "═══════════════════════════════════════════",
    ].join("\n");
  }

  async function exportCertificate() {
    const r = room();
    if (!r) return;
    const path = await save({
      title: "Zapisz certyfikat",
      defaultPath: `certyfikat-${r.id}.txt`,
      filters: [{ name: "Tekst", extensions: ["txt"] }],
    });
    if (!path) return;
    await invoke("write_text_file", { path, contents: certificateText() });
  }

  return (
    <Show when={room()}>
      <div class="onboarding-overlay">
        <div class="onboarding-modal completion-modal">
          <div class="completion-emoji">🏆</div>
          <h1>Pokój ukończony!</h1>
          <p>
            Gratulacje! Ukończyłeś(aś) pokój <strong>„{room()!.title}”</strong>.
            Możesz pobrać certyfikat na pamiątkę albo wrócić do listy pokoi.
          </p>
          <pre class="certificate-preview">{certificateText()}</pre>
          <div class="editor-actions">
            <button class="primary-btn" onClick={exportCertificate}>📥 Pobierz certyfikat</button>
            <button class="secondary-btn" onClick={() => clearJustCompletedRoom()}>Zamknij</button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default CompletionModal;
