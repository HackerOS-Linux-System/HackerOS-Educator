import type { BadgeDef, UserProfile } from "../types";

export const BADGES: BadgeDef[] = [
  { id: "first-steps", title: "Pierwsze kroki", description: "Ukończ swoje pierwsze zadanie.", icon: "🐣" },
  { id: "first-room", title: "Pierwszy pokój", description: "Ukończ swój pierwszy pokój w całości.", icon: "🏁" },
  { id: "three-rooms", title: "Na dobrej drodze", description: "Ukończ 3 pokoje.", icon: "🚀" },
  { id: "xp-100", title: "Setka", description: "Zdobądź 100 punktów XP.", icon: "💯" },
  { id: "xp-500", title: "Weteran nauki", description: "Zdobądź 500 punktów XP.", icon: "🎖️" },
  { id: "streak-3", title: "Nawyk się kształtuje", description: "Ucz się 3 dni z rzędu.", icon: "🔥" },
  { id: "streak-7", title: "Tygodniowy rytm", description: "Ucz się 7 dni z rzędu.", icon: "📅" },
  { id: "terminal-user", title: "Ręce na klawiaturze", description: "Ukończ zadanie praktyczne z terminalem.", icon: "⌨️" },
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
  if (profile.xp >= 100 && !owned.has("xp-100")) earned.push("xp-100");
  if (profile.xp >= 500 && !owned.has("xp-500")) earned.push("xp-500");
  if (profile.streakDays >= 3 && !owned.has("streak-3")) earned.push("streak-3");
  if (profile.streakDays >= 7 && !owned.has("streak-7")) earned.push("streak-7");
  if (usedTerminalAtLeastOnce && !owned.has("terminal-user")) earned.push("terminal-user");

  return earned;
}
