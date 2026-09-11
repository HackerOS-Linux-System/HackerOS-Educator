# HackerOS Educator

Darmowa, open-source'owa aplikacja GUI do nauki cyberbezpieczeństwa, inspirowana
formatem interaktywnych „pokoi” (rooms) znanym z platform typu TryHackMe —
zbudowana natywnie dla ekosystemu dystrybucji Linuksa **HackerOS**, ale
działająca na każdym Linuksie (a po drobnych poprawkach też na Windows/macOS,
dzięki Tauri).

Bez limitów, bez konta, bez chmury — cały postęp zapisywany jest lokalnie na
Twoim dysku.

## Funkcje

- 🧭 **Tryby nauki** — na starcie aplikacja pyta, czego chcesz się uczyć:
  Cyberbezpieczeństwa, Administracji Linuksem albo Programowania (HTML, CSS,
  JavaScript, TypeScript, Python, SQL, Rust, Lua, Shell, Go — oraz trzy rodzime
  języki ekosystemu HackerOS: **Hacker Lang, H# i HackerScript**). Wybór jest
  zapamiętywany jako domyślny, ale można go dowolnie przełączać w trakcie
  sesji w bocznym pasku bez utraty postępu w żadnym trybie
- 📌 **Moja Nauka** — centralny hub (działa ponad trybami): kontynuacja
  rozpoczętych pokoi, zapisane pokoje, ostatnio przeglądane, ścieżki kariery w
  toku i cel tygodniowy XP (dokładnie to, co w TryHackMe kryje się pod „My
  Learning”)
- 🧩 **Pokoje** z zadaniami informacyjnymi, pytaniami i zadaniami praktycznymi,
  filtrowane wg aktywnego trybu nauki (i dodatkowo wg języka w trybie
  Programowanie)
- 🔖 **Zakładki (bookmarks)** — zapisuj pokoje na później jednym kliknięciem
- 🕓 **Historia ostatnio przeglądanych** pokoi
- 🖥️ **Dwa rodzaje terminala** (oba oparte o xterm.js):
  - **Prawdziwy terminal lokalny** (PTY w Rust) — rzeczywista powłoka Twojego
    systemu, do zadań administracyjnych na własnej maszynie
  - **Symulowana maszyna docelowa** — bezpieczny, w pełni przewidywalny
    „udawacz” terminala (jak we wprowadzających pokojach TryHackMe): działa na
    z góry zdefiniowanym, fikcyjnym systemie plików, nie dotyka prawdziwego
    komputera i zawsze daje ten sam wynik — używany w zadaniach śledczych,
    pentestowych i kapsztatach, gdzie liczy się powtarzalność i bezpieczeństwo
- 📖 **Podpowiedzi i pełne rozwiązania (walkthrough)** — walkthrough odblokowuje
  się po kilku nieudanych próbach albo po ukończeniu zadania
- 📝 **Notatki** przypisane do każdego zadania, zapisywane automatycznie
- 🔍 **Wyszukiwarka i klikalne filtry** pokoi (kategoria, poziom trudności,
  tagi — kliknij tag w pokoju, żeby przefiltrować listę)
- 🧭 **Podobne pokoje** — sugestie na dole pokoju na podstawie tagów/kategorii
- 🗺️ **Ścieżki kariery** (np. Junior Penetration Tester, SOC Analyst) grupujące
  pokoje w konkretnej kolejności
- 🏅 **System odznak** przyznawanych automatycznie za postępy
- 🎓 **Certyfikat ukończenia pokoju** — generowany lokalnie, do pobrania jako
  plik tekstowy na pamiątkę
- 🔁 **Tryb powtórek** — losowe pytania z już rozwiązanych zadań, do utrwalania
  wiedzy bez wpływu na XP czy postęp
- 🔔 **Centrum powiadomień w aplikacji** (odznaki, ukończone pokoje, cel
  tygodniowy) + opcjonalne powiadomienia systemowe
- 📊 **Dashboard statystyk** — XP w czasie, czas skupionej nauki, postęp wg
  kategorii
- 🎯 **Cel tygodniowy XP** z paskiem postępu i powiadomieniem po osiągnięciu
- 🔥 **Streaki dni nauki** z lokalnym powiadomieniem systemowym
- ⏱️ **Timer fokusu (Pomodoro)** zliczający czas nauki
- 🛠️ **Kreator pokoi** — twórz własne pokoje w UI, bez pisania kodu
- 📦 **Import/eksport paczek pokoi** (`.json`) — łatwe dzielenie się treścią ze
  społecznością
- 👥 **Wiele lokalnych profili** z prostym rankingiem XP (offline, na jednym
  urządzeniu — np. do rywalizacji ze znajomymi na wspólnym komputerze)
- 💾 **Eksport/import całego postępu** — kopia zapasowa albo przeniesienie na
  inną instalację HackerOS
- 👋 **Onboarding** z zasadami etyki i prawa przy pierwszym uruchomieniu

## Stos technologiczny

- **Tauri v2** — natywna powłoka desktopowa
- **Rust** — backend: wieloprofilowa persystencja, lokalny terminal PTY
  (`portable-pty`), powiadomienia systemowe, operacje na plikach
- **TypeScript + Solid.js** — reaktywny interfejs
- **xterm.js (`@xterm/xterm`)** — emulacja terminala: zarówno prawdziwego
  lokalnego (PTY), jak i symulowanych maszyn docelowych (silnik czysto
  frontendowy, `src/lib/simulatedShell.ts`)
- Treść pokoi jako pliki **JSON + Markdown** w `src/data/rooms/`

## Wymagania

- Node.js ≥ 18
- **Rust ≥ 1.77.2** (Tauri v2 tego wymaga) + `cargo` — najpewniej przez
  [rustup](https://rustup.rs), nie przez `apt`, bo dystrybucyjne pakiety Rusta
  bywają za stare (sprawdzone: Ubuntu 24.04 `apt` daje Rusta 1.75, za mało)
- Zależności systemowe Tauri v2 dla Linuksa (Debian/Ubuntu/HackerOS):
  ```bash
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
    libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```

## Uruchomienie w trybie deweloperskim

```bash
npm install
npm run tauri dev
```

## Budowanie paczek (.deb / .rpm / AppImage)

```bash
npm run tauri build
```

Gotowe paczki pojawią się w `src-tauri/target/release/bundle/`.

## Stan walidacji tego repozytorium

Uczciwie o tym, co zostało sprawdzone, a co nie:

- ✅ **Frontend w pełni się kompiluje**: `npm install`, `npx tsc -b` (tryb
  `strict` + `noUnusedLocals`/`noUnusedParameters`) i `npm run build`
  (produkcyjny bundle Vite, 126 modułów) przechodzą bez błędów w tym
  repozytorium na wersję **0.1.0** — po pełnym cyklu rozbudowy obejmującym
  wszystkie trzy tryby nauki, symulowane maszyny docelowe i kreator pokoi.
- ✅ **84 pokoje treści** (31 Cyberbezpieczeństwo, 21 Administracja Linuksem,
  32 Programowanie) i **16 ścieżek kariery** zostały automatycznie
  zwalidowane skryptem sprawdzającym: brak martwych odwołań do
  nieistniejących prerekwizytów, poprawność pól `track`/`language`/`kind`
  wg schematu z `src/types.ts`, oraz że każde zadanie inne niż `info` ma
  `answer`.
- ✅ **Silnik symulowanych maszyn** (`src/lib/simulatedShell.ts`) został
  ręcznie przetestowany (nawigacja po katalogach, odczyt plików, `grep`,
  `find`, polecenia kanoniczne/"canned") przez wyodrębnienie i uruchomienie
  w izolowanym środowisku Node.js — działa deterministycznie.
- ℹ️ Wszystkie rundy funkcji od „Mojej Nauki” włącznie (zakładki, historia,
  cel tygodniowy, powiadomienia, certyfikaty, tryb powtórek, podobne pokoje,
  system trybów nauki, symulowane maszyny docelowe) są w całości
  frontendowe — nie dodano żadnych nowych komend Rust ponad terminal PTY i
  wieloprofilowość, więc backend (`src-tauri/`) nie zmienił się względem
  wcześniejszej rundy z terminalem.
- ⚠️ **Backend Rust nie został w pełni skompilowany end-to-end** w tym
  środowisku — środowisko, w którym powstał ten kod, miało dostępnego Rusta
  tylko w wersji 1.75 (z `apt`), a Tauri v2 i jego zależności wymagają
  nowszego Rusta (≥ 1.77–1.85 w zależności od wersji zależności) i nie było
  możliwości pobrania `rustup`. Kod Rust (`src-tauri/src/*.rs`) został
  ręcznie przejrzany pod kątem poprawności API `portable-pty` i `tauri` v2,
  ale **zalecane jest odpalenie `cargo check` / `cargo build` we własnym
  środowisku z aktualnym Rustem przed pierwszym uruchomieniem**.

## Ikony aplikacji

Repozytorium nie zawiera jeszcze finalnych plików ikon. Wygeneruj je z jednego
pliku PNG/SVG poleceniem:

```bash
npm run tauri icon sciezka/do/logo.png
```

## Struktura projektu

```
src/                     — frontend Solid.js
  components/            — komponenty UI (pokoje, terminal, kreator, dashboard...)
  data/rooms/*.json       — treść edukacyjna pokoi
  data/career-paths.json  — ścieżki kariery
  data/badges.ts          — definicje i logika odznak
  store/progress.ts       — logika profili, XP, streaków, notatek, odznak
  styles/global.css       — motyw wizualny (celowo NIE zielony)
src-tauri/               — backend Rust
  src/commands.rs         — profile, pliki, import/eksport
  src/terminal.rs         — lokalny terminal PTY (portable-pty)
  capabilities/           — model uprawnień Tauri v2
```

## Dodawanie nowego pokoju

**Opcja A — przez UI:** zakładka „Kreator pokoi” → wybierz tryb nauki (i język,
jeśli to Programowanie) → wypełnij formularz → „Zapisz jako pokój własny” albo
„Eksportuj do pliku” (żeby udostępnić innym).

**Opcja B — ręcznie:**
1. Utwórz plik `src/data/rooms/nazwa-pokoju.json` wg schematu z `src/types.ts`
   — pamiętaj o polu `"track"` (`"cybersecurity"` / `"linux-admin"` /
   `"programming"`) i, dla trybu programowania, `"language"`.
2. Zaimportuj go w `src/data/rooms.ts` i dodaj do tablicy `builtInRooms`.

## Format paczki pokoi (`.hosroom.json`)

Prosty, czytelny format do dzielenia się treścią bez rekompilacji aplikacji:

```json
{
  "packFormatVersion": 1,
  "packName": "Nazwa paczki",
  "author": "Twój pseudonim",
  "rooms": [ /* obiekty Room, patrz src/types.ts */ ]
}
```

Importuje się go przez zakładkę „Kreator pokoi” → „Importuj paczkę pokoi”.

## Dwa terminale — ważna uwaga

Zadania praktyczne mogą osadzać **prawdziwy terminal** (PTY) podłączony do
lokalnej powłoki użytkownika (`$SHELL`, domyślnie bash) — to dokładnie ten sam
dostęp, jaki użytkownik ma z poziomu dowolnego innego terminala na własnym
komputerze. Aplikacja nie łączy się z żadnym zdalnym systemem ani nie próbuje
niczego atakować — służy wyłącznie do ćwiczenia poleceń na własnej maszynie.

Niektóre zadania (śledcze, pentestowe, kapsztaty) zamiast tego osadzają
**symulowaną maszynę docelową** — silnik czysto frontendowy
(`src/lib/simulatedShell.ts`), który interpretuje polecenia (`ls`, `cd`, `cat`,
`grep`, `find`, `ps aux` i inne) na z góry zdefiniowanym, fikcyjnym systemie
plików zapisanym wprost w JSON-ie pokoju (pole `simulatedMachine` w zadaniu).
Zawsze wyraźnie oznaczona ikoną 🎯 i etykietą „maszyna docelowa (symulacja)” —
nie dotyka prawdziwego systemu i daje deterministyczny, powtarzalny wynik,
idealny do prowadzonych krok po kroku ćwiczeń typu „znajdź dowód”.

## Zasady i etyka

Aplikacja uczy metodologii, teorii sieci/systemów i podstaw defensywnych oraz
ofensywnych **bez** dystrybuowania gotowych exploitów czy narzędzi do ataków na
cudze systemy. Zanim przetestujesz jakikolwiek system spoza własnej
infrastruktury — zawsze potrzebujesz pisemnej zgody właściciela (Rules of
Engagement).

## Stan treści (wersja 0.1.0)

- **84 pokoje**: 31 Cyberbezpieczeństwo, 21 Administracja Linuksem,
  32 Programowanie (w tym 3 rodzime języki HackerOS: Hacker Lang, H#,
  HackerScript)
- **16 ścieżek kariery** (m.in. Junior Penetration Tester, SOC Analyst, Linux
  System Administrator, Deweloper ekosystemu HackerOS, Analityk danych i SQL)
- **22 odznaki** przyznawane automatycznie za postępy
- **4 pokoje-kapsztaty** łączące wiedzę z wielu poprzednich pokoi w jeden
  interaktywny scenariusz z symulowaną maszyną docelową

## Plan dalszego rozwoju

- [ ] Code-splitting bundla produkcyjnego (obecnie jeden plik JS > 500 kB —
      działa poprawnie, ale warto rozbić na mniejsze fragmenty ładowane
      dynamicznie)
- [ ] Więcej symulowanych maszyn docelowych w pokojach średniozaawansowanych
      (obecnie skupione głównie w pokojach śledczych/pentestowych i
      kapsztatach)
- [ ] Rozbudowa o dodatkowe języki programowania (np. C, Java) oraz kolejne
      poziomy zaawansowane dla istniejących języków
- [ ] Pełna kompilacja end-to-end backendu Rust w środowisku z aktualnym
      Rustem (patrz sekcja „Stan walidacji” powyżej)
- [ ] Integracja z lokalnym menedżerem maszyn wirtualnych HackerOS do w pełni
      kontrolowanych, autorskich labów offline
- [ ] Historia sesji terminala per zadanie (zapis/odtwarzanie)
- [ ] Więcej ścieżek kariery (GRC, analiza malware, forensics, backend/DevOps)
- [ ] Podpisywanie/weryfikacja paczek pokoi społeczności

## Licencja

GPL 3.0 — patrz [LICENSE](./LICENSE).
