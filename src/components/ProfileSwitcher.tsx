import { Component, createMemo, createSignal, For, Show } from "solid-js";
import { createNewProfile, deleteProfileById, profile, profiles, switchProfile } from "../store/progress";

const ProfileSwitcher: Component = () => {
  const [open, setOpen] = createSignal(false);
  const [newName, setNewName] = createSignal("");

  const ranked = createMemo(() => [...profiles()].sort((a, b) => b.xp - a.xp));

  async function handleCreate() {
    const name = newName().trim();
    if (!name) return;
    await createNewProfile(name);
    setNewName("");
    setOpen(false);
  }

  return (
    <div class="profile-switcher">
      <button class="profile-switcher-toggle" onClick={() => setOpen((v) => !v)}>
        👥 Profile lokalne / ranking
      </button>
      <Show when={open()}>
        <div class="profile-switcher-panel">
          <h4>Ranking lokalny (na tym urządzeniu)</h4>
          <ol class="leaderboard-list">
            <For each={ranked()}>
              {(p, i) => (
                <li class={p.id === profile().id ? "active-profile" : ""}>
                  <span class="leaderboard-rank">#{i() + 1}</span>
                  <button class="leaderboard-name" onClick={() => switchProfile(p.id)}>
                    {p.displayName}
                  </button>
                  <span class="leaderboard-xp">{p.xp} XP</span>
                  <Show when={ranked().length > 1}>
                    <button
                      class="leaderboard-delete"
                      title="Usuń profil"
                      onClick={() => deleteProfileById(p.id)}
                    >
                      ✕
                    </button>
                  </Show>
                </li>
              )}
            </For>
          </ol>

          <div class="new-profile-row">
            <input
              placeholder="Nazwa nowego profilu"
              value={newName()}
              onInput={(e) => setNewName(e.currentTarget.value)}
            />
            <button class="secondary-btn" onClick={handleCreate}>+ Nowy</button>
          </div>
          <p class="profile-switcher-note">
            Wszystkie profile są przechowywane wyłącznie lokalnie, na tym komputerze — bez
            konta ani chmury. Przydatne np. do rywalizacji ze znajomymi na tym samym sprzęcie.
          </p>
        </div>
      </Show>
    </div>
  );
};

export default ProfileSwitcher;
