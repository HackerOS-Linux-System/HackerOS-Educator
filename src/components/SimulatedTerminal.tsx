import { Component, onCleanup, onMount } from "solid-js";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { createShellState, promptFor, runCommand, type SimulatedMachine } from "../lib/simulatedShell";

interface SimulatedTerminalProps {
  machine: SimulatedMachine;
}

/**
 * Terminal "udawanej" maszyny docelowej — wygląda i zachowuje się jak
 * prawdziwy terminal (ten sam silnik xterm.js co w Terminal.tsx), ale całość
 * działa lokalnie w przeglądarce/aplikacji na z góry zdefiniowanym systemie
 * plików. Żadne polecenie nie dotyka prawdziwego systemu użytkownika — to
 * bezpieczny, w pełni przewidywalny odpowiednik podejścia znanego z
 * wprowadzających pokoi TryHackMe, gdzie zamiast wdrażać prawdziwą maszynę
 * wirtualną, kursant dostaje symulowany terminal do ćwiczeń.
 */
const SimulatedTerminal: Component<SimulatedTerminalProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let term: XTerm | undefined;
  let lineBuffer = "";
  const state = createShellState(props.machine);

  function writePrompt() {
    term?.write(`\r\n${promptFor(props.machine, state)}`);
  }

  onMount(() => {
    if (!containerRef) return;

    term = new XTerm({
      convertEol: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      cursorBlink: true,
      theme: {
        background: "#0b0f16",
        foreground: "#d3f9e0",
        cursor: "#2fe08a",
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef);
    fitAddon.fit();

    if (props.machine.banner) {
      term.writeln(props.machine.banner);
    }
    writePrompt();

    let historyIndex = props.machine.cannedCommands ? 0 : 0;
    void historyIndex;
    let navIndex = -1; // -1 = poza historią (świeża linia)

    term.onData((data) => {
      if (!term) return;
      // Enter
      if (data === "\r") {
        const line = lineBuffer;
        lineBuffer = "";
        navIndex = -1;
        const output = runCommand(props.machine, state, line);
        if (output === "\x1b[2J\x1b[H") {
          term.clear();
        } else if (output) {
          term.write(`\r\n${output}`);
        }
        writePrompt();
        return;
      }
      // Backspace
      if (data === "\u007f") {
        if (lineBuffer.length > 0) {
          lineBuffer = lineBuffer.slice(0, -1);
          term.write("\b \b");
        }
        return;
      }
      // Strzałka w górę — poprzednie polecenie
      if (data === "\u001b[A") {
        if (state.history.length === 0) return;
        navIndex = navIndex < 0 ? state.history.length - 1 : Math.max(0, navIndex - 1);
        const cmd = state.history[navIndex] ?? "";
        term.write("\r\x1b[K" + promptFor(props.machine, state) + cmd);
        lineBuffer = cmd;
        return;
      }
      // Strzałka w dół — następne polecenie
      if (data === "\u001b[B") {
        if (navIndex < 0) return;
        navIndex = navIndex + 1;
        const cmd = navIndex >= state.history.length ? "" : state.history[navIndex];
        if (navIndex >= state.history.length) navIndex = -1;
        term.write("\r\x1b[K" + promptFor(props.machine, state) + cmd);
        lineBuffer = cmd;
        return;
      }
      // Ctrl+C — przerwij bieżącą linię
      if (data === "\u0003") {
        lineBuffer = "";
        navIndex = -1;
        writePrompt();
        return;
      }
      // Zwykłe znaki drukowalne
      if (data >= " " || data === "\t") {
        lineBuffer += data;
        term.write(data);
      }
    });

    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(containerRef);
    onCleanup(() => resizeObserver.disconnect());
  });

  onCleanup(() => {
    term?.dispose();
  });

  return (
    <div class="terminal-panel simulated-terminal-panel">
      <div class="terminal-titlebar">
        <span class="terminal-dot dot-red" />
        <span class="terminal-dot dot-yellow" />
        <span class="terminal-dot dot-green" />
        <span class="terminal-label">
          🎯 maszyna docelowa (symulacja) — {props.machine.user}@{props.machine.hostname}
        </span>
      </div>
      <div class="terminal-body" ref={containerRef} />
      <div class="simulated-terminal-note">
        To bezpieczna symulacja do nauki — nie jest to prawdziwy system i nie wpływa na Twój komputer.
      </div>
    </div>
  );
};

export default SimulatedTerminal;
