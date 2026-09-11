export interface VFile {
  type: "file";
  content: string;
  /** Wyświetlane uprawnienia w `ls -l`, np. "-rw-r--r--". Domyślnie "-rw-r--r--". */
  permissions?: string;
}

export interface VDir {
  type: "dir";
  children: Record<string, VNode>;
  /** Wyświetlane uprawnienia w `ls -l`, np. "drwxr-xr-x". Domyślnie "drwxr-xr-x". */
  permissions?: string;
}

export type VNode = VFile | VDir;

export interface SimulatedMachine {
  /** Nazwa hosta widoczna w prompt i np. w wyniku `hostname`. */
  hostname: string;
  /** Nazwa użytkownika widoczna w prompt i w wyniku `whoami`. */
  user: string;
  /** Baner wypisywany raz, zaraz po "połączeniu" z maszyną (jak MOTD po SSH). */
  banner?: string;
  /** Korzeń systemu plików symulacji. */
  filesystem: VDir;
  /** Katalog startowy, np. "/home/user". Domyślnie "/home/<user>". */
  startPath?: string;
  /**
   * Odpowiedzi "z góry napisane" dla całych poleceń (dopasowanie dokładne,
   * po przycięciu białych znaków) — np. "nmap -sV 10.10.10.5", "ps aux",
   * "sudo -l", "ifconfig". Pozwala autorowi pokoju zasymulować dowolne
   * polecenie bez modelowania go w silniku ogólnym. Sprawdzane PRZED
   * wbudowanymi poleceniami, więc może też nadpisać zachowanie domyślne.
   */
  cannedCommands?: Record<string, string>;
}

interface ShellState {
  cwd: string[]; // segmenty ścieżki, np. ["home", "user"]
  history: string[];
}

function splitPath(path: string): string[] {
  return path.split("/").filter((seg) => seg.length > 0);
}

function joinPath(segments: string[]): string {
  return "/" + segments.join("/");
}

function resolvePath(cwd: string[], home: string[], input: string): string[] {
  let base: string[];
  let rest: string;
  if (input.startsWith("~")) {
    base = [...home];
    rest = input.slice(1).replace(/^\//, "");
  } else if (input.startsWith("/")) {
    base = [];
    rest = input.replace(/^\//, "");
  } else {
    base = [...cwd];
    rest = input;
  }
  const parts = rest.split("/").filter((p) => p.length > 0);
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      if (base.length > 0) base.pop();
    } else {
      base.push(part);
    }
  }
  return base;
}

function getNode(root: VDir, segments: string[]): VNode | undefined {
  let node: VNode = root;
  for (const seg of segments) {
    if (node.type !== "dir") return undefined;
    const next: VNode | undefined = node.children[seg];
    if (!next) return undefined;
    node = next;
  }
  return node;
}

function sizeOf(node: VNode): number {
  if (node.type === "file") return node.content.length;
  return 4096;
}

function fmtEntry(name: string, node: VNode, long: boolean): string {
  if (!long) return node.type === "dir" ? `${name}/` : name;
  const perms = node.permissions ?? (node.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--");
  const size = String(sizeOf(node)).padStart(6, " ");
  return `${perms}  1 user user ${size} sty 01 09:00 ${node.type === "dir" ? name + "/" : name}`;
}

function errNoSuchFile(cmd: string, target: string): string {
  return `${cmd}: nie można uzyskać dostępu do '${target}': Nie ma takiego pliku ani katalogu`;
}

/** Bardzo prosty dopasowywacz wzorca z jedną gwiazdką (np. "*.txt", "flag*"). */
function globMatch(pattern: string, name: string): boolean {
  if (!pattern.includes("*")) return pattern === name;
  const [pre, post] = pattern.split("*", 2);
  return name.startsWith(pre) && name.endsWith(post) && name.length >= pre.length + post.length;
}

function collectFiles(node: VNode, base: string[], out: string[]): void {
  if (node.type === "file") {
    out.push(joinPath(base));
    return;
  }
  out.push(joinPath(base) + "/");
  for (const [name, child] of Object.entries(node.children)) {
    collectFiles(child, [...base, name], out);
  }
}

const HELP_TEXT = `Dostępne polecenia w tej symulowanej maszynie:
  ls [-la] [ścieżka]   — listuje zawartość katalogu
  cd [ścieżka]         — zmienia katalog roboczy
  pwd                  — wypisuje bieżącą ścieżkę
  cat <plik>           — wypisuje zawartość pliku
  head/tail [-n N] <plik> — pierwsze/ostatnie N linii pliku
  grep <wzorzec> <plik>   — szuka linii zawierających wzorzec
  find <ścieżka> -name <wzorzec> — szuka plików po nazwie
  file <ścieżka>       — pokazuje typ pliku/katalogu
  whoami / hostname / id / uname -a
  history              — historia poleceń tej sesji
  clear                — czyści ekran
  help                 — ta pomoc

To symulowana maszyna docelowa — jej stan jest zawsze taki sam i resetuje się
przy ponownym wejściu do zadania. Nie wpływa na Twój prawdziwy system.`;

export function createShellState(machine: SimulatedMachine): ShellState {
  const home = machine.startPath ? splitPath(machine.startPath) : ["home", machine.user];
  return { cwd: home, history: [] };
}

/** Wykonuje jedną linię polecenia i zwraca tekst wyjścia (bez końcowego \n). */
export function runCommand(machine: SimulatedMachine, state: ShellState, line: string): string {
  const trimmed = line.trim();
  if (trimmed.length === 0) return "";
  state.history.push(trimmed);

  const canned = machine.cannedCommands?.[trimmed];
  if (canned !== undefined) return canned;

  const args = trimmed.split(/\s+/);
  const cmd = args[0];
  const rest = args.slice(1);
  const home = machine.startPath ? splitPath(machine.startPath) : ["home", machine.user];

  switch (cmd) {
    case "help":
      return HELP_TEXT;

    case "pwd":
      return joinPath(state.cwd);

    case "whoami":
      return machine.user;

    case "hostname":
      return machine.hostname;

    case "id":
      return `uid=1000(${machine.user}) gid=1000(${machine.user}) grupy=1000(${machine.user})`;

    case "uname":
      if (rest.includes("-a")) {
        return `Linux ${machine.hostname} 6.6.0-hackeros #1 SMP x86_64 GNU/Linux`;
      }
      return "Linux";

    case "clear":
      return "\x1b[2J\x1b[H";

    case "history":
      return state.history.map((h, i) => `  ${i + 1}  ${h}`).join("\r\n");

    case "echo":
      return rest.join(" ").replace(/^"(.*)"$/, "$1");

    case "cd": {
      const target = rest[0] ?? "~";
      const dest = resolvePath(state.cwd, home, target);
      const node = getNode(machine.filesystem, dest);
      if (!node) return errNoSuchFile("cd", target);
      if (node.type !== "dir") return `cd: ${target}: To nie jest katalog`;
      state.cwd = dest;
      return "";
    }

    case "ls": {
      const flags = rest.filter((a) => a.startsWith("-"));
      const pathArg = rest.find((a) => !a.startsWith("-"));
      const long = flags.some((f) => f.includes("l"));
      const all = flags.some((f) => f.includes("a"));
      const target = pathArg ? resolvePath(state.cwd, home, pathArg) : state.cwd;
      const node = getNode(machine.filesystem, target);
      if (!node) return errNoSuchFile("ls", pathArg ?? joinPath(target));
      if (node.type === "file") return fmtEntry(pathArg ?? node.type, node, long);
      const names = Object.keys(node.children)
        .filter((n) => all || !n.startsWith("."))
        .sort();
      if (names.length === 0) return "";
      return names.map((n) => fmtEntry(n, node.children[n], long)).join(long ? "\r\n" : "  ");
    }

    case "cat": {
      if (rest.length === 0) return "cat: brak nazwy pliku";
      const results: string[] = [];
      for (const p of rest) {
        const dest = resolvePath(state.cwd, home, p);
        const node = getNode(machine.filesystem, dest);
        if (!node) {
          results.push(errNoSuchFile("cat", p));
        } else if (node.type === "dir") {
          results.push(`cat: ${p}: Jest katalogiem`);
        } else {
          results.push(node.content.replace(/\n$/, ""));
        }
      }
      return results.join("\r\n");
    }

    case "head":
    case "tail": {
      const nFlagIdx = rest.indexOf("-n");
      const n = nFlagIdx >= 0 ? parseInt(rest[nFlagIdx + 1] ?? "10", 10) : 10;
      const p = rest.filter((a, i) => a !== "-n" && i !== nFlagIdx + 1).find((a) => !a.startsWith("-"));
      if (!p) return `${cmd}: brak nazwy pliku`;
      const dest = resolvePath(state.cwd, home, p);
      const node = getNode(machine.filesystem, dest);
      if (!node) return errNoSuchFile(cmd, p);
      if (node.type === "dir") return `${cmd}: błąd odczytu '${p}': Jest katalogiem`;
      const lines = node.content.replace(/\n$/, "").split("\n");
      const slice = cmd === "head" ? lines.slice(0, n) : lines.slice(-n);
      return slice.join("\r\n");
    }

    case "grep": {
      if (rest.length < 2) return "grep: użycie: grep <wzorzec> <plik>";
      const [pattern, p] = rest;
      const dest = resolvePath(state.cwd, home, p);
      const node = getNode(machine.filesystem, dest);
      if (!node) return errNoSuchFile("grep", p);
      if (node.type === "dir") return `grep: ${p}: Jest katalogiem`;
      const matches = node.content.split("\n").filter((l) => l.includes(pattern));
      return matches.join("\r\n");
    }

    case "file": {
      const p = rest[0];
      if (!p) return "file: brak argumentu";
      const dest = resolvePath(state.cwd, home, p);
      const node = getNode(machine.filesystem, dest);
      if (!node) return errNoSuchFile("file", p);
      return node.type === "dir" ? `${p}: directory` : `${p}: ASCII text`;
    }

    case "find": {
      const nameIdx = rest.indexOf("-name");
      const startArg = rest[0] && !rest[0].startsWith("-") ? rest[0] : ".";
      const dest = resolvePath(state.cwd, home, startArg);
      const node = getNode(machine.filesystem, dest);
      if (!node) return errNoSuchFile("find", startArg);
      const all: string[] = [];
      collectFiles(node, dest, all);
      if (nameIdx >= 0) {
        const pattern = rest[nameIdx + 1] ?? "*";
        return all.filter((p) => globMatch(pattern, p.split("/").filter(Boolean).pop() ?? "")).join("\r\n");
      }
      return all.join("\r\n");
    }

    default:
      return `bash: ${cmd}: polecenie nie zostało znalezione`;
  }
}

export function promptFor(machine: SimulatedMachine, state: ShellState): string {
  const cwdDisplay = joinPath(state.cwd).replace(
    joinPath(machine.startPath ? splitPath(machine.startPath) : ["home", machine.user]),
    "~"
  );
  return `${machine.user}@${machine.hostname}:${cwdDisplay || "~"}$ `;
}

export type { ShellState };
