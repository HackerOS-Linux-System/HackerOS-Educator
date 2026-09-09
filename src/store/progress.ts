import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { sendNotification, isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import {
  emptyProfile,
  type AppNotification,
  type NotificationIcon,
  type ProfileSummary,
  type Room,
  type RoomPack,
  type RoomTask,
  type TrackId,
  type UserProfile,
} from "../types";
import { evaluateNewBadges, getBadgeDef } from "../data/badges";
import { getAllRooms, getRoomById } from "../data/rooms";

const [profile, setProfile] = createSignal<UserProfile>(emptyProfile("pending"));
const [loaded, setLoaded] = createSignal(false);
const [profiles, setProfiles] = createSignal<ProfileSummary[]>([]);
const [newlyEarnedBadge, setNewlyEarnedBadge] = createSignal<string | null>(null);
const [justCompletedRoomId, setJustCompletedRoomId] = createSignal<string | null>(null);
/** Tryb nauki aktywny w BIEŻĄCEJ sesji — inicjalizowany z profile().preferredTrack,
 *  ale może być tymczasowo zmieniony bez zapisywania (patrz switchTrack). */
const [activeTrack, setActiveTrack] = createSignal<TrackId>("cybersecurity");

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/** Poniedziałek bieżącego tygodnia (ISO), jako YYYY-MM-DD. */
function startOfIsoWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = niedziela
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Suma XP zdobytego od poniedziałku bieżącego tygodnia — do widżetu celu tygodniowego. */
export function getWeeklyXp(p: UserProfile): number {
  const weekStart = startOfIsoWeek(new Date());
  return p.xpHistory
    .filter((h) => h.date >= weekStart)
    .reduce((sum, h) => sum + h.xp, 0);
}

/** Wypełnia brakujące pola u profili zapisanych starszą wersją aplikacji. */
function normalizeProfile(raw: Partial<UserProfile> & { id: string }): UserProfile {
  const base = emptyProfile(raw.id, raw.displayName);
  return { ...base, ...raw };
}

/** Wywoływane raz przy każdym wczytaniu profilu: aktualizuje licznik "streak" dni nauki. */
function applyStreakLogic(p: UserProfile): UserProfile {
  const today = todayStr();
  const lastDay = p.lastActive.slice(0, 10);
  const diff = daysBetween(lastDay, today);

  let streakDays = p.streakDays;
  if (diff === 0) {
    streakDays = Math.max(streakDays, 1);
  } else if (diff === 1) {
    streakDays = streakDays + 1;
  } else if (diff > 1) {
    streakDays = 1;
  }
  return { ...p, streakDays, lastActive: new Date().toISOString() };
}

async function refreshProfileList() {
  try {
    setProfiles(await invoke<ProfileSummary[]>("list_profiles"));
  } catch (err) {
    console.error("Nie udało się pobrać listy profili:", err);
  }
}

async function ensureNotificationPermission() {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const result = await requestPermission();
      granted = result === "granted";
    }
    return granted;
  } catch {
    return false;
  }
}

async function sendOsNotification(title: string, body: string) {
  const granted = await ensureNotificationPermission();
  if (!granted) return;
  try {
    sendNotification({ title, body });
  } catch (err) {
    console.error("Nie udało się wysłać powiadomienia:", err);
  }
}

function pushNotification(p: UserProfile, message: string, icon: NotificationIcon): UserProfile {
  const notification: AppNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    createdAt: new Date().toISOString(),
    read: false,
    icon,
  };
  // Trzymamy tylko ostatnie 50 powiadomień w profilu, żeby plik nie rósł w nieskończoność.
  const notifications = [notification, ...p.notifications].slice(0, 50);
  return { ...p, notifications };
}

/** Uruchamiane raz przy starcie aplikacji: wznawia ostatnio używany profil lub tworzy pierwszy. */
export async function initProfiles() {
  await refreshProfileList();
  let activeId: string | null = null;
  try {
    activeId = await invoke<string | null>("get_last_active_profile");
  } catch (err) {
    console.error("Nie udało się odczytać ostatniego profilu:", err);
  }

  if (!activeId) {
    const existing = profiles();
    if (existing.length > 0) {
      activeId = existing[0].id;
    } else {
      activeId = await invoke<string>("create_profile", { displayName: "Kursant HackerOS" });
      await refreshProfileList();
    }
  }

  await switchProfile(activeId);
}

export async function switchProfile(id: string) {
  setLoaded(false);
  try {
    await invoke("set_last_active_profile", { id });
  } catch (err) {
    console.error("Nie udało się zapisać aktywnego profilu:", err);
  }

  let stored: UserProfile | null = null;
  try {
    stored = await invoke<UserProfile | null>("load_profile", { id });
  } catch (err) {
    console.error("Nie udało się wczytać profilu z Rust backendu:", err);
  }

  const base = normalizeProfile(stored ?? emptyProfile(id));
  const withStreak = applyStreakLogic(base);
  setProfile(withStreak);
  setActiveTrack(withStreak.preferredTrack);
  await persistSilently(withStreak);
  await refreshProfileList();
  setLoaded(true);

  if (withStreak.streakDays >= 2) {
    void sendOsNotification("HackerOS Educator", `🔥 ${withStreak.streakDays} dni nauki z rzędu — tak trzymaj!`);
  }
}

export async function createNewProfile(displayName: string) {
  const id = await invoke<string>("create_profile", { displayName });
  await refreshProfileList();
  await switchProfile(id);
}

export async function deleteProfileById(id: string) {
  await invoke("delete_profile", { id });
  await refreshProfileList();
  if (profile().id === id) {
    const remaining = profiles();
    if (remaining.length > 0) {
      await switchProfile(remaining[0].id);
    } else {
      await createNewProfile("Kursant HackerOS");
    }
  }
}

/** Zapis bez ponownego przeliczania licznika streak (używane wewnętrznie po wczytaniu). */
async function persistSilently(next: UserProfile) {
  try {
    await invoke("save_profile", { id: next.id, profile: next });
  } catch (err) {
    console.error("Nie udało się zapisać profilu:", err);
  }
}

async function persist(next: UserProfile) {
  setProfile(next);
  await persistSilently(next);
  await refreshProfileList();
}

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function checkAnswer(task: RoomTask, userAnswer: string): boolean {
  if (!task.answer) return false;
  return normalizeAnswer(userAnswer) === normalizeAnswer(task.answer);
}

function addXpToHistory(p: UserProfile, amount: number): UserProfile {
  if (amount <= 0) return p;
  const day = todayStr();
  const existing = p.xpHistory.find((h) => h.date === day);
  const xpHistory = existing
    ? p.xpHistory.map((h) => (h.date === day ? { ...h, xp: h.xp + amount } : h))
    : [...p.xpHistory, { date: day, xp: amount }];
  return { ...p, xpHistory };
}

function countCompletedTasks(p: UserProfile): number {
  return Object.values(p.rooms).reduce(
    (sum, rp) => sum + Object.values(rp.taskProgress).filter((t) => t.completed).length,
    0
  );
}

function countCompletedRooms(p: UserProfile, allRooms: Room[]): number {
  return allRooms.filter((r) => {
    const rp = p.rooms[r.id];
    if (!rp) return false;
    const done = Object.values(rp.taskProgress).filter((t) => t.completed).length;
    return done >= r.tasks.length && r.tasks.length > 0;
  }).length;
}

async function evaluateAndApplyBadges(p: UserProfile, usedTerminal: boolean): Promise<UserProfile> {
  const allRooms = getAllRooms(p.customRooms);
  const earned = evaluateNewBadges({
    profile: p,
    totalCompletedTasks: countCompletedTasks(p),
    completedRoomsCount: countCompletedRooms(p, allRooms),
    usedTerminalAtLeastOnce: usedTerminal,
  });
  if (earned.length === 0) return p;
  setNewlyEarnedBadge(earned[earned.length - 1]);
  let next = { ...p, badges: [...p.badges, ...earned] };
  for (const badgeId of earned) {
    const def = getBadgeDef(badgeId);
    next = pushNotification(next, `${def?.icon ?? "🏅"} Nowa odznaka: ${def?.title ?? badgeId}`, "badge");
    void sendOsNotification("Nowa odznaka!", def?.title ?? badgeId);
  }
  return next;
}

export async function completeTask(roomId: string, task: RoomTask) {
  const current = profile();
  const roomProgress = current.rooms[roomId] ?? {
    roomId,
    taskProgress: {},
    startedAt: new Date().toISOString(),
  };

  const existing = roomProgress.taskProgress[task.id];
  if (existing?.completed) return; // nie przyznawaj XP dwa razy

  const nextTaskProgress = {
    ...roomProgress.taskProgress,
    [task.id]: { ...existing, completed: true, attempts: (existing?.attempts ?? 0) + 1 },
  };

  const allRooms = getAllRooms(current.customRooms);
  const room = getRoomById(allRooms, roomId);
  const allDone = room ? Object.values(nextTaskProgress).filter((t) => t.completed).length >= room.tasks.length : false;

  const nextRoomProgress = {
    ...roomProgress,
    taskProgress: nextTaskProgress,
    completedAt: allDone ? new Date().toISOString() : roomProgress.completedAt,
  };

  let next: UserProfile = {
    ...current,
    xp: current.xp + task.points,
    lastActive: new Date().toISOString(),
    rooms: { ...current.rooms, [roomId]: nextRoomProgress },
  };
  next = addXpToHistory(next, task.points);

  if (allDone && room && !roomProgress.completedAt) {
    next = pushNotification(next, `🏁 Ukończono pokój „${room.title}”!`, "room");
    void sendOsNotification("Pokój ukończony!", room.title);
    setJustCompletedRoomId(roomId);
  }

  const weeklyBefore = getWeeklyXp(current);
  next = await evaluateAndApplyBadges(next, !!task.hasTerminal);
  const weeklyAfter = getWeeklyXp(next);
  if (weeklyBefore < next.weeklyGoalXp && weeklyAfter >= next.weeklyGoalXp) {
    next = pushNotification(next, `🎯 Osiągnięto tygodniowy cel ${next.weeklyGoalXp} XP!`, "goal");
    void sendOsNotification("Cel tygodniowy osiągnięty!", `${weeklyAfter} XP w tym tygodniu`);
  }

  await persist(next);
}

export async function recordAttempt(roomId: string, taskId: string) {
  const current = profile();
  const roomProgress = current.rooms[roomId] ?? {
    roomId,
    taskProgress: {},
    startedAt: new Date().toISOString(),
  };
  const existing = roomProgress.taskProgress[taskId];
  if (existing?.completed) return;

  const next: UserProfile = {
    ...current,
    rooms: {
      ...current.rooms,
      [roomId]: {
        ...roomProgress,
        taskProgress: {
          ...roomProgress.taskProgress,
          [taskId]: { ...existing, completed: false, attempts: (existing?.attempts ?? 0) + 1 },
        },
      },
    },
  };
  await persist(next);
}

export async function setTaskNote(roomId: string, taskId: string, note: string) {
  const current = profile();
  const roomProgress = current.rooms[roomId] ?? {
    roomId,
    taskProgress: {},
    startedAt: new Date().toISOString(),
  };
  const existing = roomProgress.taskProgress[taskId] ?? { completed: false, attempts: 0 };

  const next: UserProfile = {
    ...current,
    rooms: {
      ...current.rooms,
      [roomId]: {
        ...roomProgress,
        taskProgress: { ...roomProgress.taskProgress, [taskId]: { ...existing, note } },
      },
    },
  };
  await persist(next);
}

export async function markRoomStarted(roomId: string) {
  const current = profile();
  if (current.rooms[roomId]) return;
  const next: UserProfile = {
    ...current,
    rooms: {
      ...current.rooms,
      [roomId]: { roomId, taskProgress: {}, startedAt: new Date().toISOString() },
    },
  };
  await persist(next);
}

/** Zapisuje odwiedziny pokoju do "Ostatnio przeglądanych" w Mojej Nauce. Trzyma max 8 wpisów. */
export async function recordRecentView(roomId: string) {
  const current = profile();
  const withoutThis = current.recentlyViewed.filter((v) => v.roomId !== roomId);
  const recentlyViewed = [{ roomId, viewedAt: new Date().toISOString() }, ...withoutThis].slice(0, 8);
  await persist({ ...current, recentlyViewed });
}

export function isRoomBookmarked(roomId: string): boolean {
  return profile().bookmarkedRoomIds.includes(roomId);
}

export async function toggleBookmark(roomId: string) {
  const current = profile();
  const bookmarkedRoomIds = current.bookmarkedRoomIds.includes(roomId)
    ? current.bookmarkedRoomIds.filter((id) => id !== roomId)
    : [...current.bookmarkedRoomIds, roomId];
  await persist({ ...current, bookmarkedRoomIds });
}

export async function setWeeklyGoal(xp: number) {
  await persist({ ...profile(), weeklyGoalXp: Math.max(10, Math.round(xp)) });
}

export async function markNotificationRead(id: string) {
  const current = profile();
  await persist({
    ...current,
    notifications: current.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  });
}

export async function markAllNotificationsRead() {
  const current = profile();
  await persist({ ...current, notifications: current.notifications.map((n) => ({ ...n, read: true })) });
}

export function isRoomCompleted(roomId: string, totalTasks: number): boolean {
  const rp = profile().rooms[roomId];
  if (!rp || totalTasks === 0) return false;
  const done = Object.values(rp.taskProgress).filter((t) => t.completed).length;
  return done >= totalTasks;
}

export async function renameProfile(displayName: string) {
  await persist({ ...profile(), displayName });
}

export async function markOnboardingSeen() {
  await persist({ ...profile(), onboardingSeen: true });
}

/** Kończy onboarding i ustawia wybrany tryb jako domyślny (zapamiętany) oraz aktywny w tej sesji. */
export async function completeOnboarding(track: TrackId) {
  setActiveTrack(track);
  await persist({ ...profile(), onboardingSeen: true, preferredTrack: track });
}

/**
 * Zmienia tryb nauki tylko na czas bieżącej sesji (nie zapisuje na stałe),
 * chyba że remember=true — wtedy dodatkowo aktualizuje zapamiętany domyślny tryb.
 */
export async function switchTrack(track: TrackId, remember = false) {
  setActiveTrack(track);
  if (remember) {
    await persist({ ...profile(), preferredTrack: track });
  }
}

export function isActiveTrackDefault(): boolean {
  return activeTrack() === profile().preferredTrack;
}

export async function addFocusSeconds(seconds: number) {
  await persist({ ...profile(), focusSecondsTotal: profile().focusSecondsTotal + seconds });
}

export async function importRoomPack(pack: RoomPack) {
  const current = profile();
  const merged = [
    ...current.customRooms.filter((r) => !pack.rooms.some((nr) => nr.id === r.id)),
    ...pack.rooms,
  ];
  await persist({ ...current, customRooms: merged });
}

export async function removeCustomRoom(roomId: string) {
  const current = profile();
  await persist({ ...current, customRooms: current.customRooms.filter((r) => r.id !== roomId) });
}

export function clearNewlyEarnedBadge() {
  setNewlyEarnedBadge(null);
}

export function clearJustCompletedRoom() {
  setJustCompletedRoomId(null);
}

export { profile, loaded, profiles, newlyEarnedBadge, justCompletedRoomId, activeTrack };
