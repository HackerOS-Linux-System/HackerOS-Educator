import { Component, createMemo, createSignal, For, Show } from "solid-js";
import { markAllNotificationsRead, markNotificationRead, profile } from "../store/progress";
import type { NotificationIcon } from "../types";

const ICONS: Record<NotificationIcon, string> = {
  badge: "🏅",
  streak: "🔥",
  room: "🏁",
  goal: "🎯",
  info: "ℹ️",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "przed chwilą";
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz. temu`;
  return `${Math.floor(hours / 24)} dni temu`;
}

const NotificationCenter: Component = () => {
  const [open, setOpen] = createSignal(false);
  const unreadCount = createMemo(() => profile().notifications.filter((n) => !n.read).length);

  return (
    <div class="notification-center">
      <button class="notification-bell" onClick={() => setOpen((v) => !v)}>
        🔔
        <Show when={unreadCount() > 0}>
          <span class="notification-count">{unreadCount()}</span>
        </Show>
      </button>
      <Show when={open()}>
        <div class="notification-panel">
          <div class="notification-panel-header">
            <h4>Powiadomienia</h4>
            <Show when={unreadCount() > 0}>
              <button class="secondary-btn small" onClick={() => markAllNotificationsRead()}>
                Oznacz wszystkie jako przeczytane
              </button>
            </Show>
          </div>
          <Show when={profile().notifications.length === 0}>
            <p class="empty-state">Brak powiadomień. Ucz się dalej, żeby coś tu się pojawiło!</p>
          </Show>
          <ul class="notification-list">
            <For each={profile().notifications}>
              {(n) => (
                <li
                  class={n.read ? "read" : "unread"}
                  onClick={() => !n.read && markNotificationRead(n.id)}
                >
                  <span class="notification-icon">{ICONS[n.icon]}</span>
                  <div>
                    <div class="notification-message">{n.message}</div>
                    <div class="notification-time">{timeAgo(n.createdAt)}</div>
                  </div>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </div>
  );
};

export default NotificationCenter;
