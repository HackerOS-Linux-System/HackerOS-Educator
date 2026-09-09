import { Component, createMemo, For, Show } from "solid-js";
import { getAllRooms, roomsForTrack } from "../data/rooms";
import { activeTrack, isRoomCompleted, profile } from "../store/progress";
import { TRACKS } from "../types";

interface LearningPathProps {
  onOpenRoom: (roomId: string) => void;
}

const LearningPath: Component<LearningPathProps> = (props) => {
  const rooms = createMemo(() => roomsForTrack(getAllRooms(profile().customRooms), activeTrack()));
  const trackTitle = createMemo(() => TRACKS.find((t) => t.id === activeTrack())?.title ?? "");

  return (
    <div class="learning-path">
      <h1>Wszystkie pokoje — {trackTitle()}</h1>
      <p class="path-intro">
        Sugerowana kolejność wszystkich pokoi w bieżącym trybie nauki. Przełącz tryb w bocznym
        pasku, żeby zobaczyć pokoje z innej dziedziny.
      </p>
      <Show when={rooms().length === 0}>
        <p class="empty-state">Ten tryb nie ma jeszcze żadnych pokoi.</p>
      </Show>
      <ol class="path-list">
        <For each={rooms()}>
          {(room, i) => (
            <li class={isRoomCompleted(room.id, room.tasks.length) ? "path-done" : ""}>
              <span class="path-index">{i() + 1}</span>
              <div class="path-info">
                <button class="path-link" onClick={() => props.onOpenRoom(room.id)}>
                  {room.title}
                </button>
                <span class="path-meta">
                  {room.category} · {room.difficulty}
                </span>
              </div>
              {isRoomCompleted(room.id, room.tasks.length) && <span class="path-check">✓</span>}
            </li>
          )}
        </For>
      </ol>
    </div>
  );
};

export default LearningPath;
