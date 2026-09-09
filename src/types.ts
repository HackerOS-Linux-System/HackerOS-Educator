export type TaskKind = "info" | "question" | "practical";

export interface RoomTask {
  id: string;
  title: string;
  /** Treść w Markdown wyświetlana nad zadaniem. */
  content: string;
  kind: TaskKind;
  /** Pytanie widoczne, jeśli kind === "question" lub "practical". */
  question?: string;
  /** Odpowiedź porównywana bez rozróżniania wielkości liter i białych znaków. */
  answer?: string;
  /** Podpowiedź dostępna po kliknięciu przycisku "Podpowiedź". */
  hint?: string;
  /** Pełne rozwiązanie krok po kroku, odblokowywane po nieudanych próbach lub ukończeniu. */
  walkthrough?: string;
  /** Po ilu nieudanych próbach odblokować walkthrough. Domyślnie 3. */
  walkthroughUnlockAfterAttempts?: number;
  /** Czy zadanie oferuje lokalny terminal do ćwiczeń (kind === "practical"). */
  hasTerminal?: boolean;
  points: number;
}

export type Difficulty = "Łatwy" | "Średni" | "Trudny" | "Ekspert";

/** Główny "tryb nauki" wybierany na starcie i przełączany w trakcie sesji. */
export type TrackId = "cybersecurity" | "linux-admin" | "programming";

/** Języki programowania obsługiwane w trybie "programming". Lista będzie rosła. */
export type ProgrammingLanguage =
  | "html"
  | "css"
  | "javascript"
  | "typescript"
  | "rust"
  | "lua"
  | "shell"
  | "go";

export interface Room {
  id: string;
  title: string;
  summary: string;
  category: string;
  difficulty: Difficulty;
  /** Do którego trybu nauki należy ten pokój. */
  track: TrackId;
  /** Tylko dla track === "programming": którego języka dotyczy pokój. */
  language?: ProgrammingLanguage;
  /** Szacowany czas ukończenia w minutach. */
  estimatedMinutes: number;
  /** id innych pokoi wymaganych przed rozpoczęciem tego (ścieżka nauki). */
  prerequisites: string[];
  tasks: RoomTask[];
  tags: string[];
}

/** Format "paczki pokoi" do importu/eksportu — jeden plik, dowolna liczba pokoi. */
export interface RoomPack {
  packFormatVersion: 1;
  packName: string;
  author?: string;
  rooms: Room[];
}

export interface TaskProgress {
  completed: boolean;
  attempts: number;
  note?: string;
}

export interface RoomProgress {
  roomId: string;
  taskProgress: Record<string, TaskProgress>;
  startedAt: string;
  completedAt?: string;
}

export interface XpHistoryEntry {
  date: string; // YYYY-MM-DD
  xp: number; // suma XP zdobyta danego dnia
}

export interface RecentView {
  roomId: string;
  viewedAt: string;
}

export type NotificationIcon = "badge" | "streak" | "room" | "goal" | "info";

export interface AppNotification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
  icon: NotificationIcon;
}

export interface UserProfile {
  id: string;
  displayName: string;
  xp: number;
  streakDays: number;
  lastActive: string;
  badges: string[];
  rooms: Record<string, RoomProgress>;
  xpHistory: XpHistoryEntry[];
  focusSecondsTotal: number;
  onboardingSeen: boolean;
  customRooms: Room[];
  bookmarkedRoomIds: string[];
  recentlyViewed: RecentView[];
  weeklyGoalXp: number;
  notifications: AppNotification[];
  /** Zapamiętany domyślny tryb nauki, wybrany podczas onboardingu (lub później zmieniony na stałe). */
  preferredTrack: TrackId;
}

export const emptyProfile = (id: string, displayName = "Kursant HackerOS"): UserProfile => ({
  id,
  displayName,
  xp: 0,
  streakDays: 0,
  lastActive: new Date().toISOString(),
  badges: [],
  rooms: {},
  xpHistory: [],
  focusSecondsTotal: 0,
  onboardingSeen: false,
  customRooms: [],
  bookmarkedRoomIds: [],
  recentlyViewed: [],
  weeklyGoalXp: 100,
  notifications: [],
  preferredTrack: "cybersecurity",
});

export interface ProfileSummary {
  id: string;
  displayName: string;
  xp: number;
  streakDays: number;
}

export interface CareerPathStep {
  roomId: string;
  note?: string;
}

export interface CareerPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  track: TrackId;
  steps: CareerPathStep[];
}

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface TrackDef {
  id: TrackId;
  title: string;
  description: string;
  icon: string;
  /** Jeśli true, tryb nie ma jeszcze treści — UI pokazuje planszę "wkrótce". */
  comingSoon?: boolean;
}

export const TRACKS: TrackDef[] = [
  {
    id: "cybersecurity",
    title: "Cyberbezpieczeństwo",
    description: "Etyczny hacking, obrona (Blue Team), sieci i systemy pod kątem bezpieczeństwa.",
    icon: "🛡️",
  },
  {
    id: "linux-admin",
    title: "Administracja Linuksem",
    description: "Zarządzanie systemem, usługami, siecią i użytkownikami w Linuksie.",
    icon: "🐧",
    comingSoon: true,
  },
  {
    id: "programming",
    title: "Programowanie",
    description: "HTML, CSS, JavaScript, TypeScript, Rust, Lua, Shell, Go — i będzie więcej.",
    icon: "💻",
  },
];

export const LANGUAGE_LABELS: Record<ProgrammingLanguage, string> = {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  typescript: "TypeScript",
  rust: "Rust",
  lua: "Lua",
  shell: "Shell",
  go: "Go",
};

export const LANGUAGE_ICONS: Record<ProgrammingLanguage, string> = {
  html: "🟧",
  css: "🟦",
  javascript: "🟨",
  typescript: "🔷",
  rust: "🦀",
  lua: "🌙",
  shell: "🐚",
  go: "🐹",
};
