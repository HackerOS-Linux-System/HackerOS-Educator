import { Component, createSignal, For, Show } from "solid-js";
import { open, save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { activeTrack, importRoomPack, profile, removeCustomRoom } from "../store/progress";
import {
  LANGUAGE_LABELS,
  TRACKS,
  type Difficulty,
  type ProgrammingLanguage,
  type Room,
  type RoomPack,
  type RoomTask,
  type TaskKind,
  type TrackId,
} from "../types";

function blankTask(idx: number): RoomTask {
  return {
    id: `task-${idx}`,
    title: "",
    content: "",
    kind: "question",
    question: "",
    answer: "",
    hint: "",
    points: 10,
  };
}

function blankRoom(track: TrackId): Room {
  return {
    id: "",
    title: "",
    summary: "",
    category: "Własne",
    difficulty: "Łatwy",
    track,
    language: track === "programming" ? "javascript" : undefined,
    estimatedMinutes: 20,
    prerequisites: [],
    tags: [],
    tasks: [blankTask(1)],
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const RoomEditor: Component = () => {
  const [room, setRoom] = createSignal<Room>(blankRoom(activeTrack()));
  const [status, setStatus] = createSignal<string | null>(null);

  function updateRoom(patch: Partial<Room>) {
    setRoom({ ...room(), ...patch });
  }

  function updateTask(index: number, patch: Partial<RoomTask>) {
    const tasks = [...room().tasks];
    tasks[index] = { ...tasks[index], ...patch };
    updateRoom({ tasks });
  }

  function addTask() {
    updateRoom({ tasks: [...room().tasks, blankTask(room().tasks.length + 1)] });
  }

  function removeTask(index: number) {
    const tasks = room().tasks.filter((_, i) => i !== index);
    updateRoom({ tasks });
  }

  function currentRoomWithId(): Room {
    const r = room();
    const id = r.id.trim() !== "" ? r.id.trim() : slugify(r.title || "wlasny-pokoj");
    return { ...r, id };
  }

  async function saveLocally() {
    const finalRoom = currentRoomWithId();
    if (!finalRoom.title.trim()) {
      setStatus("Podaj tytuł pokoju przed zapisem.");
      return;
    }
    const pack: RoomPack = {
      packFormatVersion: 1,
      packName: finalRoom.title,
      rooms: [finalRoom],
    };
    await importRoomPack(pack);
    setStatus(`Zapisano pokój „${finalRoom.title}” w Twoich pokojach własnych.`);
  }

  async function exportToFile() {
    const finalRoom = currentRoomWithId();
    if (!finalRoom.title.trim()) {
      setStatus("Podaj tytuł pokoju przed eksportem.");
      return;
    }
    const pack: RoomPack = {
      packFormatVersion: 1,
      packName: finalRoom.title,
      rooms: [finalRoom],
    };
    const path = await save({
      title: "Eksportuj paczkę pokoju",
      defaultPath: `${finalRoom.id}.hosroom.json`,
      filters: [{ name: "Paczka pokoju HackerOS Educator", extensions: ["json"] }],
    });
    if (!path) return;
    await invoke("write_text_file", { path, contents: JSON.stringify(pack, null, 2) });
    setStatus(`Wyeksportowano do ${path}`);
  }

  async function importFromFile() {
    const path = await open({
      title: "Importuj paczkę pokoi",
      multiple: false,
      filters: [{ name: "Paczka pokoju HackerOS Educator", extensions: ["json"] }],
    });
    if (!path || Array.isArray(path)) return;
    try {
      const raw = await invoke<string>("read_text_file", { path });
      const parsed = JSON.parse(raw) as RoomPack;
      if (!parsed.rooms || !Array.isArray(parsed.rooms)) {
        setStatus("Nieprawidłowy format pliku — brak listy pokoi.");
        return;
      }
      await importRoomPack(parsed);
      setStatus(`Zaimportowano paczkę „${parsed.packName}” (${parsed.rooms.length} pokoi).`);
    } catch (err) {
      setStatus(`Błąd importu: ${String(err)}`);
    }
  }

  return (
    <div class="room-editor">
      <h1>Kreator pokoi</h1>
      <p class="path-intro">
        Twórz własne pokoje edukacyjne bez pisania kodu. Gotowy pokój możesz zapisać lokalnie
        albo wyeksportować jako plik do udostępnienia społeczności HackerOS.
      </p>

      <div class="editor-actions">
        <button class="secondary-btn" onClick={importFromFile}>📥 Importuj paczkę pokoi</button>
      </div>
      <Show when={status()}>
        <p class="feedback feedback-correct">{status()}</p>
      </Show>

      <div class="editor-form">
        <label>Tytuł pokoju</label>
        <input value={room().title} onInput={(e) => updateRoom({ title: e.currentTarget.value })} />

        <label>Opis</label>
        <textarea value={room().summary} onInput={(e) => updateRoom({ summary: e.currentTarget.value })} />

        <div class="editor-row">
          <div>
            <label>Tryb nauki</label>
            <select
              value={room().track}
              onChange={(e) => {
                const track = e.currentTarget.value as TrackId;
                updateRoom({
                  track,
                  language: track === "programming" ? (room().language ?? "javascript") : undefined,
                });
              }}
            >
              <For each={TRACKS}>{(t) => <option value={t.id}>{t.title}</option>}</For>
            </select>
          </div>
          <Show when={room().track === "programming"}>
            <div>
              <label>Język programowania</label>
              <select
                value={room().language}
                onChange={(e) => updateRoom({ language: e.currentTarget.value as ProgrammingLanguage })}
              >
                <For each={Object.entries(LANGUAGE_LABELS)}>
                  {([key, label]) => <option value={key}>{label}</option>}
                </For>
              </select>
            </div>
          </Show>
        </div>

        <div class="editor-row">
          <div>
            <label>Kategoria</label>
            <input value={room().category} onInput={(e) => updateRoom({ category: e.currentTarget.value })} />
          </div>
          <div>
            <label>Trudność</label>
            <select
              value={room().difficulty}
              onChange={(e) => updateRoom({ difficulty: e.currentTarget.value as Difficulty })}
            >
              <option>Łatwy</option>
              <option>Średni</option>
              <option>Trudny</option>
              <option>Ekspert</option>
            </select>
          </div>
          <div>
            <label>Czas (min)</label>
            <input
              type="number"
              value={room().estimatedMinutes}
              onInput={(e) => updateRoom({ estimatedMinutes: Number(e.currentTarget.value) })}
            />
          </div>
        </div>

        <h2>Zadania</h2>
        <For each={room().tasks}>
          {(task, i) => (
            <div class="editor-task-card">
              <div class="editor-row">
                <input
                  placeholder="Tytuł zadania"
                  value={task.title}
                  onInput={(e) => updateTask(i(), { title: e.currentTarget.value })}
                />
                <select
                  value={task.kind}
                  onChange={(e) => updateTask(i(), { kind: e.currentTarget.value as TaskKind })}
                >
                  <option value="info">Informacyjne</option>
                  <option value="question">Pytanie</option>
                  <option value="practical">Praktyczne (z terminalem)</option>
                </select>
                <button type="button" class="secondary-btn danger" onClick={() => removeTask(i())}>
                  Usuń
                </button>
              </div>
              <textarea
                placeholder="Treść (Markdown)"
                value={task.content}
                onInput={(e) => updateTask(i(), { content: e.currentTarget.value })}
              />
              <Show when={task.kind !== "info"}>
                <div class="editor-row">
                  <input
                    placeholder="Pytanie"
                    value={task.question ?? ""}
                    onInput={(e) => updateTask(i(), { question: e.currentTarget.value })}
                  />
                  <input
                    placeholder="Poprawna odpowiedź"
                    value={task.answer ?? ""}
                    onInput={(e) => updateTask(i(), { answer: e.currentTarget.value })}
                  />
                  <input
                    type="number"
                    placeholder="Punkty"
                    value={task.points}
                    onInput={(e) => updateTask(i(), { points: Number(e.currentTarget.value) })}
                  />
                </div>
                <input
                  placeholder="Podpowiedź (opcjonalnie)"
                  value={task.hint ?? ""}
                  onInput={(e) => updateTask(i(), { hint: e.currentTarget.value })}
                />
              </Show>
              <Show when={task.kind === "practical"}>
                <label class="checkbox-row">
                  <input
                    type="checkbox"
                    checked={!!task.hasTerminal}
                    onChange={(e) => updateTask(i(), { hasTerminal: e.currentTarget.checked })}
                  />
                  Dołącz terminal lokalny do tego zadania
                </label>
              </Show>
            </div>
          )}
        </For>
        <button type="button" class="secondary-btn" onClick={addTask}>+ Dodaj zadanie</button>
      </div>

      <div class="editor-actions">
        <button class="primary-btn" onClick={saveLocally}>💾 Zapisz jako pokój własny</button>
        <button class="secondary-btn" onClick={exportToFile}>📤 Eksportuj do pliku</button>
      </div>

      <Show when={profile().customRooms.length > 0}>
        <h2>Twoje pokoje własne / zaimportowane</h2>
        <ul class="custom-room-list">
          <For each={profile().customRooms}>
            {(r) => (
              <li>
                <span>{r.title}</span>
                <button class="secondary-btn danger" onClick={() => removeCustomRoom(r.id)}>
                  Usuń
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
};

export default RoomEditor;
