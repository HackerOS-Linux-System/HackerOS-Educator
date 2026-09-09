import { Component, createMemo, createSignal, For, Show } from "solid-js";
import { getAllRooms, isRoomUnlocked, roomsForTrack, CATEGORIES } from "../data/rooms";
import { activeTrack, isRoomBookmarked, isRoomCompleted, profile, toggleBookmark } from "../store/progress";
import {
  LANGUAGE_ICONS,
  LANGUAGE_LABELS,
  TRACKS,
  type Difficulty,
  type ProgrammingLanguage,
  type Room,
} from "../types";

interface RoomListProps {
  onOpenRoom: (roomId: string) => void;
}

const difficultyClass: Record<Difficulty, string> = {
  "Łatwy": "diff-easy",
  "Średni": "diff-medium",
  "Trudny": "diff-hard",
  "Ekspert": "diff-expert",
};

const ALL_LANGUAGES = Object.keys(LANGUAGE_LABELS) as ProgrammingLanguage[];

const RoomList: Component<RoomListProps> = (props) => {
  const [query, setQuery] = createSignal("");
  const [categoryFilter, setCategoryFilter] = createSignal<string>("Wszystkie");
  const [difficultyFilter, setDifficultyFilter] = createSignal<string>("Wszystkie");
  const [tagFilter, setTagFilter] = createSignal<string | null>(null);
  const [languageFilter, setLanguageFilter] = createSignal<ProgrammingLanguage | null>(null);

  const trackDef = createMemo(() => TRACKS.find((t) => t.id === activeTrack()));
  const trackRooms = createMemo(() => roomsForTrack(getAllRooms(profile().customRooms), activeTrack()));
  const categories = createMemo(() => ["Wszystkie", ...CATEGORIES(trackRooms())]);

  const completedIds = createMemo(() => {
    const p = profile();
    void p;
    const set = new Set<string>();
    for (const room of trackRooms()) {
      if (isRoomCompleted(room.id, room.tasks.length)) set.add(room.id);
    }
    return set;
  });

  const filteredRooms = createMemo(() => {
    const q = query().trim().toLowerCase();
    const tag = tagFilter();
    const lang = languageFilter();
    return trackRooms().filter((room) => {
      const matchesQuery =
        q === "" ||
        room.title.toLowerCase().includes(q) ||
        room.summary.toLowerCase().includes(q) ||
        room.tags.some((t) => t.toLowerCase().includes(q));
      const matchesCategory = categoryFilter() === "Wszystkie" || room.category === categoryFilter();
      const matchesDifficulty =
        difficultyFilter() === "Wszystkie" || room.difficulty === (difficultyFilter() as Difficulty);
      const matchesTag = !tag || room.tags.includes(tag);
      const matchesLanguage = !lang || room.language === lang;
      return matchesQuery && matchesCategory && matchesDifficulty && matchesTag && matchesLanguage;
    });
  });

  function toggleTag(tag: string) {
    setTagFilter((current) => (current === tag ? null : tag));
  }

  return (
    <div>
      <Show when={trackDef()?.comingSoon && trackRooms().length === 0}>
        <div class="coming-soon-card">
          <div class="coming-soon-icon">🚧</div>
          <h2>{trackDef()!.title} — wkrótce</h2>
          <p>
            Ten tryb nauki jest jeszcze w budowie. Pierwsze pokoje o administracji Linuksem
            (usługi, systemd, sieć, użytkownicy) pojawią się w kolejnej aktualizacji.
          </p>
          <p class="path-intro">
            W międzyczasie zerknij na tryb „Cyberbezpieczeństwo” — pokój „Podstawy Linuksa dla
            bezpieczeństwa” pokrywa część wspólnych podstaw terminala.
          </p>
        </div>
      </Show>

      <Show when={!trackDef()?.comingSoon || trackRooms().length > 0}>
        <div class="room-filters">
          <input
            type="text"
            class="room-search"
            placeholder="Szukaj pokoju po nazwie, opisie lub tagu..."
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
          />
          <select value={categoryFilter()} onChange={(e) => setCategoryFilter(e.currentTarget.value)}>
            <For each={categories()}>{(c) => <option value={c}>{c}</option>}</For>
          </select>
          <select value={difficultyFilter()} onChange={(e) => setDifficultyFilter(e.currentTarget.value)}>
            <option value="Wszystkie">Wszystkie poziomy</option>
            <option value="Łatwy">Łatwy</option>
            <option value="Średni">Średni</option>
            <option value="Trudny">Trudny</option>
            <option value="Ekspert">Ekspert</option>
          </select>
        </div>

        <Show when={activeTrack() === "programming"}>
          <div class="language-filter-row">
            <button
              class={"language-chip" + (languageFilter() === null ? " active" : "")}
              onClick={() => setLanguageFilter(null)}
            >
              Wszystkie języki
            </button>
            <For each={ALL_LANGUAGES}>
              {(lang) => (
                <button
                  class={"language-chip" + (languageFilter() === lang ? " active" : "")}
                  onClick={() => setLanguageFilter((cur) => (cur === lang ? null : lang))}
                >
                  {LANGUAGE_ICONS[lang]} {LANGUAGE_LABELS[lang]}
                </button>
              )}
            </For>
          </div>
        </Show>

        <Show when={tagFilter()}>
          <div class="active-tag-filter">
            Filtr tagu: <span class="tag-chip">#{tagFilter()}</span>
            <button class="clear-tag-filter" onClick={() => setTagFilter(null)}>✕ wyczyść</button>
          </div>
        </Show>

        <Show when={filteredRooms().length === 0}>
          <p class="empty-state">Brak pokoi pasujących do filtrów.</p>
        </Show>

        <div class="room-grid">
          <For each={filteredRooms()}>
            {(room: Room) => {
              const unlocked = createMemo(() => isRoomUnlocked(room, completedIds()));
              const completed = createMemo(() => completedIds().has(room.id));
              return (
                <div class={"room-card" + (unlocked() ? "" : " locked") + (completed() ? " completed" : "")}>
                  <button
                    class="bookmark-btn card-bookmark"
                    disabled={!unlocked()}
                    title={isRoomBookmarked(room.id) ? "Usuń z zapisanych" : "Zapisz na później"}
                    onClick={(e) => {
                      e.stopPropagation();
                      void toggleBookmark(room.id);
                    }}
                  >
                    {isRoomBookmarked(room.id) ? "🔖" : "🏷️"}
                  </button>
                  <button class="room-card-clickable" disabled={!unlocked()} onClick={() => props.onOpenRoom(room.id)}>
                    <div class="room-card-header">
                      <span class={"badge " + difficultyClass[room.difficulty]}>{room.difficulty}</span>
                      {room.language && (
                        <span class="badge badge-language">
                          {LANGUAGE_ICONS[room.language]} {LANGUAGE_LABELS[room.language]}
                        </span>
                      )}
                      {completed() && <span class="badge badge-done">Ukończono</span>}
                      {!unlocked() && <span class="badge badge-locked">🔒 Zablokowane</span>}
                    </div>
                    <h3>{room.title}</h3>
                    <p class="room-summary">{room.summary}</p>
                    <div class="room-meta">
                      <span>{room.category}</span>
                      <span>~{room.estimatedMinutes} min</span>
                      <span>{room.tasks.length} zadań</span>
                    </div>
                    {!unlocked() && (
                      <p class="room-lock-reason">Ukończ najpierw: {room.prerequisites.join(", ")}</p>
                    )}
                  </button>
                  <div class="room-tags-row">
                    <For each={room.tags}>
                      {(tag) => (
                        <button
                          class="tag-chip clickable"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTag(tag);
                          }}
                        >
                          #{tag}
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default RoomList;
