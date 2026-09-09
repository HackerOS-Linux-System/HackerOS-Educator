import { Component, createMemo, createSignal, For, Show } from "solid-js";
import careerPathsData from "../data/career-paths.json";
import { getAllRooms, getRoomById } from "../data/rooms";
import {
  getWeeklyXp,
  isRoomCompleted,
  profile,
  setWeeklyGoal,
} from "../store/progress";
import type { CareerPath, Room } from "../types";
import { LANGUAGE_ICONS, TRACKS } from "../types";

interface MyLearningProps {
  onOpenRoom: (roomId: string) => void;
}

function roomIcon(room: Room): string {
  if (room.language) return LANGUAGE_ICONS[room.language];
  return TRACKS.find((t) => t.id === room.track)?.icon ?? "🧩";
}

const paths = careerPathsData.paths as CareerPath[];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "przed chwilą";
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  return `${days} dni temu`;
}

const MyLearning: Component<MyLearningProps> = (props) => {
  const [goalInput, setGoalInput] = createSignal<number | null>(null);

  const rooms = createMemo(() => getAllRooms(profile().customRooms));

  const inProgressRooms = createMemo(() => {
    const p = profile();
    const recentOrder = new Map(p.recentlyViewed.map((v, i) => [v.roomId, i]));
    return rooms()
      .filter((r) => {
        const rp = p.rooms[r.id];
        return rp && !isRoomCompleted(r.id, r.tasks.length);
      })
      .sort((a, b) => {
        const ai = recentOrder.has(a.id) ? recentOrder.get(a.id)! : 999;
        const bi = recentOrder.has(b.id) ? recentOrder.get(b.id)! : 999;
        return ai - bi;
      });
  });

  const bookmarkedRooms = createMemo(() =>
    rooms().filter((r) => profile().bookmarkedRoomIds.includes(r.id))
  );

  const recentlyViewedRooms = createMemo(() =>
    profile()
      .recentlyViewed.map((v) => ({ view: v, room: getRoomById(rooms(), v.roomId) }))
      .filter((x): x is { view: typeof x.view; room: Room } => !!x.room)
  );

  const inProgressPaths = createMemo(() =>
    paths
      .map((path) => {
        const total = path.steps.length;
        const done = path.steps.filter((s) => {
          const room = getRoomById(rooms(), s.roomId);
          return room && isRoomCompleted(room.id, room.tasks.length);
        }).length;
        return { path, done, total };
      })
      .filter((p) => p.done > 0 && p.done < p.total)
  );

  const weeklyXp = createMemo(() => getWeeklyXp(profile()));
  const weeklyGoal = createMemo(() => profile().weeklyGoalXp);
  const weeklyRatio = createMemo(() => Math.min(1, weeklyXp() / Math.max(1, weeklyGoal())));

  function roomProgressRatio(room: Room): number {
    const rp = profile().rooms[room.id];
    if (!rp || room.tasks.length === 0) return 0;
    return Object.values(rp.taskProgress).filter((t) => t.completed).length / room.tasks.length;
  }

  async function saveGoal() {
    const v = goalInput();
    if (v !== null && v > 0) {
      await setWeeklyGoal(v);
      setGoalInput(null);
    }
  }

  return (
    <div class="my-learning">
      <h1>Moja Nauka</h1>
      <p class="path-intro">Wszystko, co zacząłeś, zapisałeś i osiągnąłeś — w jednym miejscu.</p>

      <section class="ml-section">
        <div class="ml-goal-card">
          <div class="ml-goal-header">
            <h3>🎯 Cel tygodniowy</h3>
            <Show
              when={goalInput() === null}
              fallback={
                <div class="editor-row" style={{ "max-width": "220px" }}>
                  <input
                    type="number"
                    value={goalInput() ?? weeklyGoal()}
                    onInput={(e) => setGoalInput(Number(e.currentTarget.value))}
                  />
                  <button class="secondary-btn small" onClick={saveGoal}>Zapisz</button>
                </div>
              }
            >
              <button class="secondary-btn small" onClick={() => setGoalInput(weeklyGoal())}>
                Zmień cel
              </button>
            </Show>
          </div>
          <div class="room-progress-bar">
            <div class="room-progress-fill" style={{ width: `${weeklyRatio() * 100}%` }} />
          </div>
          <span class="room-progress-label">
            {weeklyXp()} / {weeklyGoal()} XP w tym tygodniu
            {weeklyRatio() >= 1 ? " — cel osiągnięty! 🎉" : ""}
          </span>
        </div>
      </section>

      <section class="ml-section">
        <h2>▶ Kontynuuj naukę</h2>
        <Show when={inProgressRooms().length === 0}>
          <p class="empty-state">Nie masz żadnych rozpoczętych pokoi. Wybierz jeden z listy pokoi, żeby zacząć!</p>
        </Show>
        <div class="ml-room-row">
          <For each={inProgressRooms()}>
            {(room) => (
              <button class="ml-room-card" onClick={() => props.onOpenRoom(room.id)}>
                <h4>{roomIcon(room)} {room.title}</h4>
                <div class="room-progress-bar small">
                  <div class="room-progress-fill" style={{ width: `${roomProgressRatio(room) * 100}%` }} />
                </div>
                <span class="room-progress-label">{Math.round(roomProgressRatio(room) * 100)}% ukończone</span>
              </button>
            )}
          </For>
        </div>
      </section>

      <Show when={inProgressPaths().length > 0}>
        <section class="ml-section">
          <h2>🗺️ Ścieżki kariery w toku</h2>
          <div class="ml-room-row">
            <For each={inProgressPaths()}>
              {({ path, done, total }) => (
                <div class="ml-room-card static">
                  <h4>{path.icon} {path.title}</h4>
                  <div class="room-progress-bar small">
                    <div class="room-progress-fill" style={{ width: `${(done / total) * 100}%` }} />
                  </div>
                  <span class="room-progress-label">{done} / {total} kroków</span>
                </div>
              )}
            </For>
          </div>
        </section>
      </Show>

      <section class="ml-section">
        <h2>🔖 Zapisane pokoje</h2>
        <Show when={bookmarkedRooms().length === 0}>
          <p class="empty-state">
            Nie masz jeszcze zapisanych pokoi — kliknij ikonę 🔖 przy pokoju, żeby wrócić do niego później.
          </p>
        </Show>
        <div class="ml-room-row">
          <For each={bookmarkedRooms()}>
            {(room) => (
              <button class="ml-room-card" onClick={() => props.onOpenRoom(room.id)}>
                <h4>{roomIcon(room)} {room.title}</h4>
                <span class="room-meta-inline">{room.category} · {room.difficulty}</span>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="ml-section">
        <h2>🕓 Ostatnio przeglądane</h2>
        <Show when={recentlyViewedRooms().length === 0}>
          <p class="empty-state">Jeszcze nic nie przeglądałeś.</p>
        </Show>
        <ul class="ml-recent-list">
          <For each={recentlyViewedRooms()}>
            {({ view, room }) => (
              <li>
                <button class="path-link" onClick={() => props.onOpenRoom(room.id)}>
                  {roomIcon(room)} {room.title}
                </button>
                <span class="path-meta">{timeAgo(view.viewedAt)}</span>
              </li>
            )}
          </For>
        </ul>
      </section>
    </div>
  );
};

export default MyLearning;
