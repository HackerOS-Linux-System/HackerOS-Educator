import { Component, createMemo, createSignal, Show } from "solid-js";
import { marked } from "marked";
import type { Room, RoomTask } from "../types";
import { checkAnswer, completeTask, profile, recordAttempt, setTaskNote } from "../store/progress";
import TerminalPanel from "./Terminal";
import SimulatedTerminal from "./SimulatedTerminal";

interface TaskBlockProps {
  room: Room;
  task: RoomTask;
}

const TaskBlock: Component<TaskBlockProps> = (props) => {
  const [answer, setAnswer] = createSignal("");
  const [showHint, setShowHint] = createSignal(false);
  const [showWalkthrough, setShowWalkthrough] = createSignal(false);
  const [showNotes, setShowNotes] = createSignal(false);
  const [feedback, setFeedback] = createSignal<"idle" | "correct" | "wrong">("idle");

  const html = createMemo(() => marked.parse(props.task.content) as string);

  const progressEntry = createMemo(
    () => profile().rooms[props.room.id]?.taskProgress[props.task.id]
  );
  const done = createMemo(() => progressEntry()?.completed ?? false);
  const attempts = createMemo(() => progressEntry()?.attempts ?? 0);
  const note = createMemo(() => progressEntry()?.note ?? "");

  const walkthroughThreshold = () => props.task.walkthroughUnlockAfterAttempts ?? 3;
  const walkthroughAvailable = createMemo(
    () => !!props.task.walkthrough && (done() || attempts() >= walkthroughThreshold())
  );

  async function submit(e: Event) {
    e.preventDefault();
    if (done()) return;
    const correct = checkAnswer(props.task, answer());
    if (correct) {
      setFeedback("correct");
      await completeTask(props.room.id, props.task);
    } else {
      setFeedback("wrong");
      await recordAttempt(props.room.id, props.task.id);
    }
  }

  let noteTimeout: number | undefined;
  function onNoteInput(value: string) {
    window.clearTimeout(noteTimeout);
    noteTimeout = window.setTimeout(() => {
      void setTaskNote(props.room.id, props.task.id, value);
    }, 500);
  }

  return (
    <section class={"task-block" + (done() ? " task-done" : "")}>
      <header class="task-header">
        <h3>{props.task.title}</h3>
        <Show when={props.task.points > 0}>
          <span class="task-points">+{props.task.points} XP</span>
        </Show>
        <Show when={done()}>
          <span class="task-check">✓</span>
        </Show>
      </header>

      <div class="task-content" innerHTML={html()} />

      <Show when={props.task.hasTerminal}>
        <TerminalPanel sessionId={`${props.room.id}-${props.task.id}`} />
      </Show>

      <Show when={props.task.simulatedMachine}>
        <SimulatedTerminal machine={props.task.simulatedMachine!} />
      </Show>

      <Show when={props.task.kind !== "info" && props.task.question}>
        <form class="answer-form" onSubmit={submit}>
          <label class="answer-question">{props.task.question}</label>
          <div class="answer-row">
            <input
              type="text"
              placeholder="Twoja odpowiedź..."
              value={answer()}
              disabled={done()}
              onInput={(e) => setAnswer(e.currentTarget.value)}
            />
            <button type="submit" disabled={done() || answer().trim() === ""}>
              {done() ? "Ukończone" : "Sprawdź"}
            </button>
          </div>

          <div class="task-tools">
            <Show when={props.task.hint}>
              <button type="button" class="hint-toggle" onClick={() => setShowHint((v) => !v)}>
                {showHint() ? "Ukryj podpowiedź" : "💡 Podpowiedź"}
              </button>
            </Show>
            <Show when={props.task.walkthrough}>
              <button
                type="button"
                class="hint-toggle"
                disabled={!walkthroughAvailable()}
                title={
                  walkthroughAvailable()
                    ? ""
                    : `Dostępne po ${walkthroughThreshold()} nieudanych próbach (masz: ${attempts()})`
                }
                onClick={() => setShowWalkthrough((v) => !v)}
              >
                {showWalkthrough() ? "Ukryj rozwiązanie" : "📖 Pełne rozwiązanie"}
              </button>
            </Show>
            <button type="button" class="hint-toggle" onClick={() => setShowNotes((v) => !v)}>
              {showNotes() ? "Ukryj notatkę" : "📝 Notatka"}
            </button>
          </div>

          <Show when={showHint()}>
            <p class="hint-text">💡 {props.task.hint}</p>
          </Show>
          <Show when={showWalkthrough() && walkthroughAvailable()}>
            <div class="walkthrough-text" innerHTML={marked.parse(props.task.walkthrough ?? "") as string} />
          </Show>
          <Show when={showNotes()}>
            <textarea
              class="task-note"
              placeholder="Twoje prywatne notatki do tego zadania..."
              value={note()}
              onInput={(e) => onNoteInput(e.currentTarget.value)}
            />
          </Show>

          <Show when={feedback() === "correct"}>
            <p class="feedback feedback-correct">Poprawna odpowiedź! Zdobywasz {props.task.points} XP.</p>
          </Show>
          <Show when={feedback() === "wrong"}>
            <p class="feedback feedback-wrong">Niepoprawnie, spróbuj ponownie. (próba {attempts() + 1})</p>
          </Show>
        </form>
      </Show>
    </section>
  );
};

export default TaskBlock;
