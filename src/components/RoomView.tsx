import { Component, createEffect, createMemo, For } from "solid-js";
import { getAllRooms, getRoomById } from "../data/rooms";
import {
  isRoomBookmarked,
  isRoomCompleted,
  markRoomStarted,
  profile,
  recordRecentView,
  toggleBookmark,
} from "../store/progress";
import TaskBlock from "./TaskBlock";
import { LANGUAGE_ICONS, LANGUAGE_LABELS, type Room } from "../types";

interface RoomViewProps {
  roomId: string;
  onBack: () => void;
  onOpenRoom: (roomId: string) => void;
}

const RoomView: Component<RoomViewProps> = (props) => {
  const room = createMemo(() => getRoomById(getAllRooms(profile().customRooms), props.roomId));

  createEffect(() => {
    const id = props.roomId;
    void markRoomStarted(id);
    void recordRecentView(id);
  });

  const doneCount = createMemo(() => {
    const r = room();
    if (!r) return 0;
    const rp = profile().rooms[r.id];
    if (!rp) return 0;
    return Object.values(rp.taskProgress).filter((t) => t.completed).length;
  });

  const similarRooms = createMemo(() => {
    const r = room();
    if (!r) return [];
    const all = getAllRooms(profile().customRooms);
    return all
      .filter((other) => other.id !== r.id && other.track === r.track)
      .filter((other) => r.track !== "programming" || other.language === r.language)
      .map((other) => {
        const sharedTags = other.tags.filter((t) => r.tags.includes(t)).length;
        const sameCategory = other.category === r.category ? 1 : 0;
        return { room: other, score: sharedTags * 2 + sameCategory };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.room);
  });

  return (
    <div class="room-view">
      <button class="back-link" onClick={props.onBack}>
        ← Wróć do listy pokoi
      </button>

      {room() ? (
        <>
          <header class="room-view-header">
            <div class="room-view-title-row">
              <h1>{room()!.title}</h1>
              <button
                class={"bookmark-btn" + (isRoomBookmarked(room()!.id) ? " active" : "")}
                title={isRoomBookmarked(room()!.id) ? "Usuń z zapisanych" : "Zapisz na później"}
                onClick={() => toggleBookmark(room()!.id)}
              >
                {isRoomBookmarked(room()!.id) ? "🔖" : "🏷️"}
              </button>
            </div>
            <p>{room()!.summary}</p>
            {room()!.language && (
              <span class="badge badge-language">
                {LANGUAGE_ICONS[room()!.language!]} {LANGUAGE_LABELS[room()!.language!]}
              </span>
            )}
            <div class="room-tags-row">
              <For each={room()!.tags}>{(tag) => <span class="tag-chip">#{tag}</span>}</For>
            </div>
            <div class="room-progress-bar">
              <div
                class="room-progress-fill"
                style={{ width: `${(doneCount() / room()!.tasks.length) * 100}%` }}
              />
            </div>
            <span class="room-progress-label">
              {doneCount()} / {room()!.tasks.length} zadań ukończonych
            </span>
          </header>

          <div class="task-list">
            <For each={room()!.tasks}>
              {(task) => <TaskBlock room={room()!} task={task} />}
            </For>
          </div>

          {similarRooms().length > 0 && (
            <section class="similar-rooms">
              <h3>Podobne pokoje</h3>
              <div class="ml-room-row">
                <For each={similarRooms()}>
                  {(other: Room) => (
                    <button class="ml-room-card" onClick={() => props.onOpenRoom(other.id)}>
                      <h4>{other.title}</h4>
                      <span class="room-meta-inline">
                        {other.category} · {other.difficulty}
                        {isRoomCompleted(other.id, other.tasks.length) ? " · ✓" : ""}
                      </span>
                    </button>
                  )}
                </For>
              </div>
            </section>
          )}
        </>
      ) : (
        <p>Nie znaleziono pokoju.</p>
      )}
    </div>
  );
};

export default RoomView;
