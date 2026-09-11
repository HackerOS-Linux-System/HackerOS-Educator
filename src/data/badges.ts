import type { BadgeDef, UserProfile } from "../types";
import { HACKEROS_NATIVE_LANGUAGES } from "../types";
import { getAllRooms } from "./rooms";

export const BADGES: BadgeDef[] = [
  { id: "first-steps", title: "Pierwsze kroki", description: "Ukończ swoje pierwsze zadanie.", icon: "🐣" },
  { id: "first-room", title: "Pierwszy pokój", description: "Ukończ swój pierwszy pokój w całości.", icon: "🏁" },
  { id: "three-rooms", title: "Na dobrej drodze", description: "Ukończ 3 pokoje.", icon: "🚀" },
  { id: "ten-rooms", title: "Kolekcjoner pokoi", description: "Ukończ 10 pokoi.", icon: "🗂️" },
  { id: "xp-100", title: "Setka", description: "Zdobądź 100 punktów XP.", icon: "💯" },
  { id: "xp-500", title: "Weteran nauki", description: "Zdobądź 500 punktów XP.", icon: "🎖️" },
  { id: "xp-1500", title: "Mistrz XP", description: "Zdobądź 1500 punktów XP.", icon: "👑" },
  { id: "streak-3", title: "Nawyk się kształtuje", description: "Ucz się 3 dni z rzędu.", icon: "🔥" },
  { id: "streak-7", title: "Tygodniowy rytm", description: "Ucz się 7 dni z rzędu.", icon: "📅" },
  { id: "terminal-user", title: "Ręce na klawiaturze", description: "Ukończ zadanie praktyczne z terminalem.", icon: "⌨️" },
  {
    id: "linux-admin-first-room",
    title: "Młodszy administrator",
    description: "Ukończ swój pierwszy pokój w trybie Administracja Linuksem.",
    icon: "🐧",
  },
  {
    id: "cyber-specialist",
    title: "Specjalista ds. bezpieczeństwa",
    description: "Ukończ 5 pokoi w trybie Cyberbezpieczeństwo.",
    icon: "🛡️",
  },
  {
    id: "hackeros-native",
    title: "Rodowity programista HackerOS",
    description: "Ukończ przynajmniej jeden pokój w każdym z rodzimych języków HackerOS: Hacker Lang, H# i HackerScript.",
    icon: "🧬",
  },
  {
    id: "polyglot",
    title: "Poliglota",
    description: "Ukończ pokoje w co najmniej 5 różnych językach programowania.",
    icon: "🌍",
  },
  {
    id: "cyber-expert",
    title: "Ekspert ds. cyberbezpieczeństwa",
    description: "Ukończ 12 pokoi w trybie Cyberbezpieczeństwo.",
    icon: "🕵️",
  },
  {
    id: "capstone-graduate",
    title: "Absolwent śledztwa",
    description: "Ukończ zaawansowany pokój podsumowujący (kapsztat) Blue Team.",
    icon: "🎓",
  },
  {
    id: "linux-admin-graduate",
    title: "Doświadczony administrator",
    description: "Ukończ 10 pokoi w trybie Administracja Linuksem.",
    icon: "🧑‍💻",
  },
  {
    id: "sql-analyst",
    title: "Analityk danych",
    description: "Ukończ pokój z podstaw SQL.",
    icon: "🗄️",
  },
  {
    id: "all-capstones",
    title: "Wielki strateg",
    description: "Ukończ wszystkie cztery pokoje kapsztatowe (Blue Team, pentest web, administracja i CLI HackerOS).",
    icon: "🏆",
  },
  {
    id: "grand-completionist",
    title: "Kompletista",
    description: "Ukończ 40 pokoi we wszystkich trybach nauki.",
    icon: "🌌",
  },
  {
    id: "foundations-graduate",
    title: "Solidne fundamenty",
    description: "Ukończ pokoje o sprzęcie komputerowym, systemach operacyjnych i działaniu WWW.",
    icon: "🧱",
  },
  {
    id: "git-master",
    title: "Opanowany Git",
    description: "Ukończ oba pokoje o kontroli wersji Git.",
    icon: "🌿",
  },
];

export function getBadgeDef(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

export interface BadgeEvalInput {
  profile: UserProfile;
  totalCompletedTasks: number;
  completedRoomsCount: number;
  usedTerminalAtLeastOnce: boolean;
}

/** Zwraca id-y pokoi ukończonych w całości przez profil. */
function completedRoomIds(profile: UserProfile): Set<string> {
  const all = getAllRooms(profile.customRooms);
  const ids = new Set<string>();
  for (const room of all) {
    const rp = profile.rooms[room.id];
    if (!rp || room.tasks.length === 0) continue;
    const done = Object.values(rp.taskProgress).filter((t) => t.completed).length;
    if (done >= room.tasks.length) ids.add(room.id);
  }
  return ids;
}

/**
 * Sprawdza, które nowe odznaki należy przyznać na podstawie aktualnego stanu profilu.
 * Przyjmuje już policzone liczniki (bez zależności od reszty aplikacji), żeby uniknąć
 * cyklicznych importów ze store'em postępu.
 */
export function evaluateNewBadges(input: BadgeEvalInput): string[] {
  const { profile, totalCompletedTasks, completedRoomsCount, usedTerminalAtLeastOnce } = input;
  const owned = new Set(profile.badges);
  const earned: string[] = [];

  if (totalCompletedTasks >= 1 && !owned.has("first-steps")) earned.push("first-steps");
  if (completedRoomsCount >= 1 && !owned.has("first-room")) earned.push("first-room");
  if (completedRoomsCount >= 3 && !owned.has("three-rooms")) earned.push("three-rooms");
  if (completedRoomsCount >= 10 && !owned.has("ten-rooms")) earned.push("ten-rooms");
  if (profile.xp >= 100 && !owned.has("xp-100")) earned.push("xp-100");
  if (profile.xp >= 500 && !owned.has("xp-500")) earned.push("xp-500");
  if (profile.xp >= 1500 && !owned.has("xp-1500")) earned.push("xp-1500");
  if (profile.streakDays >= 3 && !owned.has("streak-3")) earned.push("streak-3");
  if (profile.streakDays >= 7 && !owned.has("streak-7")) earned.push("streak-7");
  if (usedTerminalAtLeastOnce && !owned.has("terminal-user")) earned.push("terminal-user");

  const doneIds = completedRoomIds(profile);
  if (doneIds.size > 0) {
    const all = getAllRooms(profile.customRooms);
    const doneRooms = all.filter((r) => doneIds.has(r.id));

    if (!owned.has("linux-admin-first-room") && doneRooms.some((r) => r.track === "linux-admin")) {
      earned.push("linux-admin-first-room");
    }
    if (!owned.has("cyber-specialist") && doneRooms.filter((r) => r.track === "cybersecurity").length >= 5) {
      earned.push("cyber-specialist");
    }
    if (!owned.has("cyber-expert") && doneRooms.filter((r) => r.track === "cybersecurity").length >= 12) {
      earned.push("cyber-expert");
    }
    if (!owned.has("linux-admin-graduate") && doneRooms.filter((r) => r.track === "linux-admin").length >= 10) {
      earned.push("linux-admin-graduate");
    }
    if (!owned.has("capstone-graduate") && doneIds.has("capstone-blue-team-investigation")) {
      earned.push("capstone-graduate");
    }
    if (!owned.has("sql-analyst") && doneIds.has("programming-sql-basics")) {
      earned.push("sql-analyst");
    }
    const capstoneIds = [
      "capstone-blue-team-investigation",
      "capstone-webapp-pentest-report",
      "linux-admin-capstone",
      "capstone-hackeros-cli-tool",
    ];
    if (!owned.has("all-capstones") && capstoneIds.every((id) => doneIds.has(id))) {
      earned.push("all-capstones");
    }
    if (!owned.has("grand-completionist") && doneIds.size >= 40) {
      earned.push("grand-completionist");
    }
    const foundationIds = [
      "computer-fundamentals-inside-a-computer",
      "operating-systems-fundamentals",
      "how-the-web-works",
    ];
    if (!owned.has("foundations-graduate") && foundationIds.every((id) => doneIds.has(id))) {
      earned.push("foundations-graduate");
    }
    const gitIds = ["programming-git-basics", "programming-git-intermediate"];
    if (!owned.has("git-master") && gitIds.every((id) => doneIds.has(id))) {
      earned.push("git-master");
    }

    const doneLanguages = new Set(doneRooms.map((r) => r.language).filter(Boolean));
    if (
      !owned.has("hackeros-native") &&
      HACKEROS_NATIVE_LANGUAGES.every((lang) => doneLanguages.has(lang))
    ) {
      earned.push("hackeros-native");
    }
    if (!owned.has("polyglot") && doneLanguages.size >= 5) {
      earned.push("polyglot");
    }
  }

  return earned;
}
