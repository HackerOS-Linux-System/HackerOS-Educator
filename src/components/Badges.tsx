import { Component, For } from "solid-js";
import { BADGES } from "../data/badges";
import { profile } from "../store/progress";

const Badges: Component = () => {
  return (
    <div class="badges-view">
      <h1>Odznaki</h1>
      <p class="path-intro">Zdobywaj odznaki, ucząc się regularnie i kończąc pokoje.</p>
      <div class="badge-grid">
        <For each={BADGES}>
          {(badge) => {
            const owned = () => profile().badges.includes(badge.id);
            return (
              <div class={"badge-card" + (owned() ? " earned" : " locked")}>
                <div class="badge-icon">{owned() ? badge.icon : "🔒"}</div>
                <div class="badge-title">{badge.title}</div>
                <div class="badge-desc">{badge.description}</div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default Badges;
