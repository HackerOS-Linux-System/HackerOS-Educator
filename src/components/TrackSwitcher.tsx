import { Component, For, Show } from "solid-js";
import { activeTrack, isActiveTrackDefault, profile, switchTrack } from "../store/progress";
import { TRACKS } from "../types";

const TrackSwitcher: Component = () => {
  return (
    <div class="track-switcher">
      <div class="track-switcher-buttons">
        <For each={TRACKS}>
          {(track) => (
            <button
              class={"track-switcher-btn" + (activeTrack() === track.id ? " active" : "")}
              title={track.description}
              onClick={() => switchTrack(track.id)}
            >
              <span>{track.icon}</span>
              {track.title}
            </button>
          )}
        </For>
      </div>
      <Show when={!isActiveTrackDefault()}>
        <button
          class="set-default-track-btn"
          onClick={() => switchTrack(activeTrack(), true)}
        >
          💾 Ustaw jako domyślny (aktualnie: {TRACKS.find((t) => t.id === profile().preferredTrack)?.title})
        </button>
      </Show>
    </div>
  );
};

export default TrackSwitcher;
