import { Component, createSignal, For, Show } from "solid-js";
import { completeOnboarding } from "../store/progress";
import { TRACKS, type TrackId } from "../types";

const Onboarding: Component = () => {
  const [step, setStep] = createSignal<1 | 2>(1);
  const [selected, setSelected] = createSignal<TrackId>("cybersecurity");

  function finish() {
    void completeOnboarding(selected());
  }

  return (
    <div class="onboarding-overlay">
      <div class="onboarding-modal">
        <Show when={step() === 1}>
          <h1>Witaj w HackerOS Educator 👋</h1>
          <p>
            To darmowa, offline'owa platforma do nauki. Zanim zaczniesz, kilka zasad:
          </p>
          <ul>
            <li>🔒 Cały postęp zapisywany jest lokalnie na Twoim dysku — bez konta, bez chmury.</li>
            <li>
              ⚖️ Testowanie bezpieczeństwa systemów <strong>bez pisemnej zgody właściciela jest
              nielegalne</strong>. Ćwicz wyłącznie na własnych, kontrolowanych środowiskach.
            </li>
            <li>💻 Wbudowany terminal działa na Twojej lokalnej maszynie — traktuj go jak zwykły terminal systemowy.</li>
            <li>🧩 Pokoje odblokowują się stopniowo — zacznij od podstaw w wybranym trybie.</li>
            <li>🌍 Projekt jest open source — możesz tworzyć i udostępniać własne pokoje.</li>
          </ul>
          <button class="primary-btn" onClick={() => setStep(2)}>
            Dalej →
          </button>
        </Show>

        <Show when={step() === 2}>
          <h1>Czego chcesz się uczyć?</h1>
          <p>
            Wybierz tryb, od którego zaczniesz — w każdej chwili będziesz mógł przełączyć się
            na inny w bocznym pasku, bez utraty postępu w żadnym z nich.
          </p>
          <div class="track-picker">
            <For each={TRACKS}>
              {(track) => (
                <button
                  class={"track-picker-card" + (selected() === track.id ? " selected" : "")}
                  onClick={() => setSelected(track.id)}
                >
                  <div class="track-picker-icon">{track.icon}</div>
                  <div class="track-picker-title">{track.title}</div>
                  <div class="track-picker-desc">{track.description}</div>
                  {track.comingSoon && <span class="badge badge-locked">Treść w budowie</span>}
                </button>
              )}
            </For>
          </div>
          <p class="onboarding-note">
            Ten wybór zostanie zapamiętany jako Twój domyślny tryb — ale zawsze możesz go
            zmienić później, w dowolnej chwili, w bocznym pasku.
          </p>
          <div class="editor-actions">
            <button class="secondary-btn" onClick={() => setStep(1)}>← Wstecz</button>
            <button class="primary-btn" onClick={finish}>Rozumiem, zaczynajmy</button>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Onboarding;
