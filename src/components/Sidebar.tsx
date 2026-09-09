import { Component, createMemo } from "solid-js";
import { activeTrack, profile } from "../store/progress";
import ProfileSwitcher from "./ProfileSwitcher";
import FocusTimer from "./FocusTimer";
import NotificationCenter from "./NotificationCenter";
import TrackSwitcher from "./TrackSwitcher";
import { TRACKS } from "../types";

export type ViewId =
  | "my-learning"
  | "rooms"
  | "path"
  | "careers"
  | "practice"
  | "badges"
  | "dashboard"
  | "editor"
  | "about";

interface SidebarProps {
  view: () => ViewId;
  setView: (v: ViewId) => void;
}

const NAV_ITEMS: { id: ViewId; label: string; icon: string }[] = [
  { id: "my-learning", label: "Moja Nauka", icon: "📌" },
  { id: "rooms", label: "Pokoje", icon: "🧩" },
  { id: "careers", label: "Ścieżki kariery", icon: "🗺️" },
  { id: "path", label: "Wszystkie pokoje", icon: "📚" },
  { id: "practice", label: "Tryb powtórek", icon: "🔁" },
  { id: "badges", label: "Odznaki", icon: "🏅" },
  { id: "dashboard", label: "Statystyki", icon: "📊" },
  { id: "editor", label: "Kreator pokoi", icon: "🛠️" },
  { id: "about", label: "O aplikacji", icon: "ℹ️" },
];

const Sidebar: Component<SidebarProps> = (props) => {
  const level = createMemo(() => Math.floor(profile().xp / 100) + 1);
  const xpIntoLevel = createMemo(() => profile().xp % 100);
  const trackTitle = createMemo(() => TRACKS.find((t) => t.id === activeTrack())?.title ?? "");

  return (
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">HOS</span>
        <div>
          <div class="brand-title">HackerOS Educator</div>
          <div class="brand-subtitle">{trackTitle()}</div>
        </div>
        <NotificationCenter />
      </div>

      <TrackSwitcher />

      <nav class="nav">
        {NAV_ITEMS.map((item) => (
          <button
            class={"nav-item" + (props.view() === item.id ? " active" : "")}
            onClick={() => props.setView(item.id)}
          >
            <span class="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <FocusTimer />

      <div class="profile-card">
        <div class="profile-name">{profile().displayName}</div>
        <div class="profile-level">Poziom {level()} · 🔥 {profile().streakDays} dni</div>
        <div class="xp-bar">
          <div class="xp-bar-fill" style={{ width: `${xpIntoLevel()}%` }} />
        </div>
        <div class="xp-label">{profile().xp} XP</div>
      </div>

      <ProfileSwitcher />
    </aside>
  );
};

export default Sidebar;
