import { Component, createMemo, For } from "solid-js";
import { getAllRooms } from "../data/rooms";
import { profile } from "../store/progress";

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours} godz. ${minutes} min`;
  return `${minutes} min`;
}

const Dashboard: Component = () => {
  const rooms = createMemo(() => getAllRooms(profile().customRooms));

  const chartDays = createMemo(() => lastNDays(14));
  const xpByDay = createMemo(() => {
    const map = new Map(profile().xpHistory.map((h) => [h.date, h.xp] as const));
    return chartDays().map((d) => map.get(d) ?? 0);
  });
  const maxXp = createMemo(() => Math.max(1, ...xpByDay()));

  const categoryStats = createMemo(() => {
    const p = profile();
    const byCategory = new Map<string, { total: number; done: number }>();
    for (const room of rooms()) {
      const entry = byCategory.get(room.category) ?? { total: 0, done: 0 };
      entry.total += room.tasks.length;
      const rp = p.rooms[room.id];
      entry.done += rp ? Object.values(rp.taskProgress).filter((t) => t.completed).length : 0;
      byCategory.set(room.category, entry);
    }
    return Array.from(byCategory.entries())
      .map(([category, stats]) => ({
        category,
        ratio: stats.total > 0 ? stats.done / stats.total : 0,
        done: stats.done,
        total: stats.total,
      }))
      .sort((a, b) => a.ratio - b.ratio);
  });

  return (
    <div class="dashboard-view">
      <h1>Twoje statystyki</h1>

      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-value">{profile().xp}</div>
          <div class="stat-label">Łączne XP</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{profile().streakDays}</div>
          <div class="stat-label">Dni z rzędu</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{formatDuration(profile().focusSecondsTotal)}</div>
          <div class="stat-label">Czas skupionej nauki</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{profile().badges.length}</div>
          <div class="stat-label">Zdobyte odznaki</div>
        </div>
      </div>

      <h2>XP w ostatnich 14 dniach</h2>
      <div class="xp-chart">
        <For each={chartDays()}>
          {(day, i) => (
            <div class="xp-chart-bar-wrap" title={`${day}: ${xpByDay()[i()]} XP`}>
              <div
                class="xp-chart-bar"
                style={{ height: `${(xpByDay()[i()] / maxXp()) * 100}%` }}
              />
              <span class="xp-chart-label">{day.slice(8, 10)}</span>
            </div>
          )}
        </For>
      </div>

      <h2>Postęp wg kategorii</h2>
      <div class="category-stats">
        <For each={categoryStats()}>
          {(c) => (
            <div class="category-stat-row">
              <span class="category-stat-name">{c.category}</span>
              <div class="category-stat-bar">
                <div class="category-stat-fill" style={{ width: `${c.ratio * 100}%` }} />
              </div>
              <span class="category-stat-value">
                {c.done}/{c.total}
              </span>
            </div>
          )}
        </For>
        {categoryStats().length === 0 && <p class="empty-state">Brak danych — zacznij naukę!</p>}
      </div>
    </div>
  );
};

export default Dashboard;
