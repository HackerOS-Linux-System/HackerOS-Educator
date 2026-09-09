import { Component, onCleanup, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
  /** Unikalny identyfikator sesji, np. `${roomId}-${taskId}`. */
  sessionId: string;
  onFirstInput?: () => void;
}

const TerminalPanel: Component<TerminalProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let term: XTerm | undefined;
  let unlisten: UnlistenFn | undefined;
  let hasReportedFirstInput = false;

  onMount(async () => {
    if (!containerRef) return;

    term = new XTerm({
      convertEol: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: "#0d0d16",
        foreground: "#e7e6f5",
        cursor: "#9b8bff",
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef);
    fitAddon.fit();

    try {
      await invoke("terminal_spawn", { id: props.sessionId });
    } catch (err) {
      term.writeln(`\r\n[Błąd uruchamiania terminala: ${String(err)}]`);
      return;
    }

    unlisten = await listen<{ id: string; data: string }>("terminal-output", (event) => {
      if (event.payload.id === props.sessionId) {
        term?.write(event.payload.data);
      }
    });

    term.onData((data) => {
      if (!hasReportedFirstInput) {
        hasReportedFirstInput = true;
        props.onFirstInput?.();
      }
      void invoke("terminal_write", { id: props.sessionId, data });
    });

    term.onResize(({ cols, rows }) => {
      void invoke("terminal_resize", { id: props.sessionId, cols, rows });
    });

    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(containerRef);
    onCleanup(() => resizeObserver.disconnect());
  });

  onCleanup(() => {
    unlisten?.();
    void invoke("terminal_kill", { id: props.sessionId });
    term?.dispose();
  });

  return (
    <div class="terminal-panel">
      <div class="terminal-titlebar">
        <span class="terminal-dot dot-red" />
        <span class="terminal-dot dot-yellow" />
        <span class="terminal-dot dot-green" />
        <span class="terminal-label">terminal lokalny — {props.sessionId}</span>
      </div>
      <div class="terminal-body" ref={containerRef} />
    </div>
  );
};

export default TerminalPanel;
