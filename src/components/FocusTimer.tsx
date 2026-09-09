import { Component, createSignal, onCleanup } from "solid-js";
import { sendNotification, isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { addFocusSeconds } from "../store/progress";

const PRESETS = [
  { label: "25 min", seconds: 25 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "5 min", seconds: 5 * 60 },
];

const FocusTimer: Component = () => {
  const [totalSeconds, setTotalSeconds] = createSignal(PRESETS[0].seconds);
  const [remaining, setRemaining] = createSignal(PRESETS[0].seconds);
  const [running, setRunning] = createSignal(false);
  let intervalId: number | undefined;
  let accumulatedSinceLastSave = 0;

  function formatTime(s: number): string {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  async function notifySessionDone() {
    try {
      let granted = await isPermissionGranted();
      if (!granted) granted = (await requestPermission()) === "granted";
      if (granted) {
        sendNotification({ title: "HackerOS Educator", body: "⏱️ Sesja nauki zakończona — brawo!" });
      }
    } catch {
      /* powiadomienia są opcjonalne */
    }
  }

  function tick() {
    setRemaining((r) => {
      if (r <= 1) {
        stop(true);
        return 0;
      }
      accumulatedSinceLastSave += 1;
      if (accumulatedSinceLastSave >= 30) {
        void addFocusSeconds(accumulatedSinceLastSave);
        accumulatedSinceLastSave = 0;
      }
      return r - 1;
    });
  }

  function start() {
    if (running()) return;
    setRunning(true);
    intervalId = window.setInterval(tick, 1000);
  }

  function stop(completed = false) {
    setRunning(false);
    if (intervalId) window.clearInterval(intervalId);
    if (accumulatedSinceLastSave > 0) {
      void addFocusSeconds(accumulatedSinceLastSave);
      accumulatedSinceLastSave = 0;
    }
    if (completed) void notifySessionDone();
  }

  function reset() {
    stop(false);
    setRemaining(totalSeconds());
  }

  function choosePreset(seconds: number) {
    stop(false);
    setTotalSeconds(seconds);
    setRemaining(seconds);
  }

  onCleanup(() => stop(false));

  return (
    <div class="focus-timer">
      <div class="focus-timer-display">{formatTime(remaining())}</div>
      <div class="focus-timer-presets">
        {PRESETS.map((p) => (
          <button
            class={"preset-btn" + (totalSeconds() === p.seconds ? " active" : "")}
            onClick={() => choosePreset(p.seconds)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div class="focus-timer-controls">
        {!running() ? (
          <button class="primary-btn small" onClick={start}>▶ Start</button>
        ) : (
          <button class="secondary-btn small" onClick={() => stop(false)}>⏸ Pauza</button>
        )}
        <button class="secondary-btn small" onClick={reset}>↺ Reset</button>
      </div>
    </div>
  );
};

export default FocusTimer;
