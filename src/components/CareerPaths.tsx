import { Component, createMemo, For, Show } from "solid-js";
import careerPathsData from "../data/career-paths.json";
import { getAllRooms, getRoomById } from "../data/rooms";
import { activeTrack, isRoomCompleted, profile } from "../store/progress";
import type { CareerPath } from "../types";

interface CareerPathsProps {
  onOpenRoom: (roomId: string) => void;
}

const allPaths = careerPathsData.paths as CareerPath[];

const CareerPaths: Component<CareerPathsProps> = (props) => {
  const rooms = createMemo(() => getAllRooms(profile().customRooms));
  const paths = createMemo(() => allPaths.filter((p) => p.track === activeTrack()));

  return (
    <div class="career-paths">
      <h1>Ścieżki kariery</h1>
      <p class="path-intro">
        Gotowe plany nauki dopasowane do konkretnej roli. Każdy krok to jeden pokój — ukończ je
        w podanej kolejności. Lista dotyczy bieżącego trybu nauki.
      </p>

      <Show when={paths().length === 0}>
        <p class="empty-state">
          Ten tryb nie ma jeszcze zdefiniowanych ścieżek kariery — same pokoje są dostępne w
          zakładce „Pokoje”.
        </p>
      </Show>

      <div class="career-path-grid">
        <For each={paths()}>
          {(path) => {
            const total = path.steps.length;
            const completed = createMemo(
              () =>
                path.steps.filter((s) => {
                  const room = getRoomById(rooms(), s.roomId);
                  return room && isRoomCompleted(room.id, room.tasks.length);
                }).length
            );
            return (
              <div class="career-path-card">
                <div class="career-path-icon">{path.icon}</div>
                <h3>{path.title}</h3>
                <p class="room-summary">{path.description}</p>
                <div class="room-progress-bar">
                  <div
                    class="room-progress-fill"
                    style={{ width: `${(completed() / total) * 100}%` }}
                  />
                </div>
                <span class="room-progress-label">
                  {completed()} / {total} kroków ukończonych
                </span>

                <ol class="career-path-steps">
                  <For each={path.steps}>
                    {(step, i) => {
                      const room = getRoomById(rooms(), step.roomId);
                      const done = room ? isRoomCompleted(room.id, room.tasks.length) : false;
                      return (
                        <li class={done ? "path-done" : ""}>
                          <span class="path-index">{i() + 1}</span>
                          <div class="path-info">
                            <button
                              class="path-link"
                              disabled={!room}
                              onClick={() => room && props.onOpenRoom(room.id)}
                            >
                              {room?.title ?? step.roomId}
                            </button>
                            {step.note && <span class="path-meta">{step.note}</span>}
                          </div>
                          {done && <span class="path-check">✓</span>}
                        </li>
                      );
                    }}
                  </For>
                </ol>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default CareerPaths;
