import type { ProgrammingLanguage, Room, TrackId } from "../types";

import introToCybersecurity from "./rooms/intro-to-cybersecurity.json";
import linuxFundamentals from "./rooms/linux-fundamentals.json";
import networkBasics from "./rooms/network-basics.json";
import programmingHtmlBasics from "./rooms/programming-html-basics.json";
import programmingCssBasics from "./rooms/programming-css-basics.json";
import programmingJavascriptBasics from "./rooms/programming-javascript-basics.json";
import programmingTypescriptBasics from "./rooms/programming-typescript-basics.json";
import programmingRustBasics from "./rooms/programming-rust-basics.json";
import programmingLuaBasics from "./rooms/programming-lua-basics.json";
import programmingShellBasics from "./rooms/programming-shell-basics.json";
import programmingGoBasics from "./rooms/programming-go-basics.json";

// Dodając nowy plik JSON w src/data/rooms/, wystarczy zaimportować go
// tutaj i dopisać do tablicy poniżej — cała reszta UI wczyta go automatycznie.
// Pamiętaj o polu "track" (i "language" dla trybu programming) w src/types.ts.
// Pokoje społecznościowe (paczki) nie trafiają tutaj — są wczytywane
// dynamicznie z profilu użytkownika, patrz getAllRooms().
export const builtInRooms: Room[] = [
  introToCybersecurity as Room,
  linuxFundamentals as Room,
  networkBasics as Room,
  programmingHtmlBasics as Room,
  programmingCssBasics as Room,
  programmingJavascriptBasics as Room,
  programmingTypescriptBasics as Room,
  programmingRustBasics as Room,
  programmingLuaBasics as Room,
  programmingShellBasics as Room,
  programmingGoBasics as Room,
];

/** Zwraca wbudowane pokoje połączone z pokojami zaimportowanymi przez użytkownika. */
export function getAllRooms(customRooms: Room[]): Room[] {
  const customIds = new Set(customRooms.map((r) => r.id));
  // Niestandardowy pokój o id kolidującym z wbudowanym nadpisuje wbudowany —
  // przydatne przy tworzeniu własnej, zmodyfikowanej wersji istniejącego pokoju.
  const base = builtInRooms.filter((r) => !customIds.has(r.id));
  return [...base, ...customRooms];
}

export function getRoomById(rooms: Room[], id: string): Room | undefined {
  return rooms.find((r) => r.id === id);
}

export function isRoomUnlocked(room: Room, completedRoomIds: Set<string>): boolean {
  return room.prerequisites.every((id) => completedRoomIds.has(id));
}

/** Filtruje pokoje do bieżącego trybu nauki (Hacking / Linux / Programowanie). */
export function roomsForTrack(rooms: Room[], track: TrackId): Room[] {
  return rooms.filter((r) => r.track === track);
}

export function languagesInRooms(rooms: Room[]): ProgrammingLanguage[] {
  const langs = new Set<ProgrammingLanguage>();
  for (const r of rooms) {
    if (r.language) langs.add(r.language);
  }
  return Array.from(langs);
}

export const CATEGORIES = (rooms: Room[]): string[] =>
  Array.from(new Set(rooms.map((r) => r.category))).sort();
