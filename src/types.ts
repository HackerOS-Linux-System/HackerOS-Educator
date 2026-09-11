export type TaskKind = "info" | "question" | "practical";

export interface VFile {
  type: "file";
  content: string;
  permissions?: string;
}

export interface VDir {
  type: "dir";
  children: Record<string, VFile | VDir>;
  permissions?: string;
}

/** Definicja "udawanej" maszyny docelowej — zob. src/lib/simulatedShell.ts. */
export interface SimulatedMachine {
  hostname: string;
  user: string;
  banner?: string;
  filesystem: VDir;
  startPath?: string;
  cannedCommands?: Record<string, string>;
}

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
  /** Czy zadanie oferuje PRAWDZIWY lokalny terminal (Tauri PTY) do ćwiczeń na własnym systemie. */
  hasTerminal?: boolean;
  /** Czy zadanie oferuje SYMULOWANĄ maszynę docelową — bezpieczny, deterministyczny terminal-udawacz. */
  simulatedMachine?: SimulatedMachine;
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
  | "go"
  | "python"
  | "sql"
  | "hackerlang"
  | "hsharp"
  | "hackerscript";

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
    description: "Etyczny hacking, obrona (Blue Team), sieci, kryptografia, OSINT i forensyka.",
    icon: "🛡️",
  },
  {
    id: "linux-admin",
    title: "Administracja Linuksem",
    description: "Zarządzanie systemem, usługami, siecią, pakietami i użytkownikami w Linuksie.",
    icon: "🐧",
  },
  {
    id: "programming",
    title: "Programowanie",
    description:
      "HTML, CSS, JavaScript, TypeScript, Python, Rust, Lua, Shell, Go oraz rodzime języki HackerOS: Hacker Lang, H# i HackerScript.",
    icon: "💻",
  },
];

export const LANGUAGE_LABELS: Record<ProgrammingLanguage, string> = {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  sql: "SQL",
  rust: "Rust",
  lua: "Lua",
  shell: "Shell",
  go: "Go",
  hackerlang: "Hacker Lang",
  hsharp: "H#",
  hackerscript: "HackerScript",
};

export const LANGUAGE_ICONS: Record<ProgrammingLanguage, string> = {
  html: "🟧",
  css: "🟦",
  javascript: "🟨",
  typescript: "🔷",
  python: "🐍",
  sql: "🗄️",
  rust: "🦀",
  lua: "🌙",
  shell: "🐚",
  go: "🐹",
  hackerlang: "🦈",
  hsharp: "🗡️",
  hackerscript: "🧬",
};

/** Języki "rodzinne" HackerOS — własne języki tworzone w ramach ekosystemu dystrybucji. */
export const HACKEROS_NATIVE_LANGUAGES: ProgrammingLanguage[] = ["hackerlang", "hsharp", "hackerscript"];
