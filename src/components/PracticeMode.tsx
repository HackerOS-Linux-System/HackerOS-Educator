import { Component, createMemo, createSignal, Show } from "solid-js";
import { getAllRooms } from "../data/rooms";
import { checkAnswer, profile } from "../store/progress";
import type { Room, RoomTask } from "../types";

interface DrillItem {
  room: Room;
  task: RoomTask;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const PracticeMode: Component = () => {
  const pool = createMemo<DrillItem[]>(() => {
    const p = profile();
    const rooms = getAllRooms(p.customRooms);
    const items: DrillItem[] = [];
    for (const room of rooms) {
      const rp = p.rooms[room.id];
      if (!rp) continue;
      for (const task of room.tasks) {
        if (task.kind === "info" || !task.answer) continue;
        if (rp.taskProgress[task.id]?.completed) items.push({ room, task });
      }
    }
    return items;
  });

  const [session, setSession] = createSignal<DrillItem[] | null>(null);
  const [index, setIndex] = createSignal(0);
  const [answer, setAnswer] = createSignal("");
  const [feedback, setFeedback] = createSignal<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = createSignal({ correct: 0, total: 0 });

  function startSession() {
    setSession(shuffle(pool()));
    setIndex(0);
    setAnswer("");
    setFeedback("idle");
    setScore({ correct: 0, total: 0 });
  }

  function currentItem(): DrillItem | undefined {
    return session()?.[index()];
  }

  function submit(e: Event) {
    e.preventDefault();
    const item = currentItem();
    if (!item) return;
    const correct = checkAnswer(item.task, answer());
    setFeedback(correct ? "correct" : "wrong");
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    setIndex((i) => i + 1);
    setAnswer("");
    setFeedback("idle");
  }

  const finished = createMemo(() => {
    const s = session();
    return s !== null && index() >= s.length;
  });

  return (
    <div class="practice-mode">
      <h1>Tryb powtórek</h1>
      <p class="path-intro">
        Losowe pytania z zadań, które już rozwiązałeś — świetny sposób na utrwalenie wiedzy
        przed egzaminem czy certyfikatem. Nie wpływa na Twoje XP ani postęp pokoi.
      </p>

      <Show when={pool().length === 0}>
        <p class="empty-state">
          Rozwiąż kilka zadań w pokojach, żeby odblokować tryb powtórek.
        </p>
      </Show>

      <Show when={pool().length > 0 && session() === null}>
        <button class="primary-btn" onClick={startSession}>
          ▶ Zacznij sesję powtórek ({pool().length} pytań dostępnych)
        </button>
      </Show>

      <Show when={session() !== null && !finished()}>
        <div class="practice-card">
          <div class="practice-progress">
            Pytanie {index() + 1} / {session()!.length} · Wynik: {score().correct}/{score().total}
          </div>
          <h3>{currentItem()?.room.title}</h3>
          <p class="answer-question">{currentItem()?.task.question}</p>
          <form class="answer-row" onSubmit={submit}>
            <input
              type="text"
              placeholder="Twoja odpowiedź..."
              value={answer()}
              disabled={feedback() !== "idle"}
              onInput={(e) => setAnswer(e.currentTarget.value)}
            />
            <Show when={feedback() === "idle"} fallback={
              <button type="button" class="primary-btn" onClick={next}>Dalej →</button>
            }>
              <button type="submit" disabled={answer().trim() === ""}>Sprawdź</button>
            </Show>
          </form>
          <Show when={feedback() === "correct"}>
            <p class="feedback feedback-correct">Poprawnie! 🎉</p>
          </Show>
          <Show when={feedback() === "wrong"}>
            <p class="feedback feedback-wrong">
              Niepoprawnie. Poprawna odpowiedź: <strong>{currentItem()?.task.answer}</strong>
            </p>
          </Show>
        </div>
      </Show>

      <Show when={finished()}>
        <div class="practice-card practice-summary">
          <h2>Sesja zakończona!</h2>
          <p>
            Wynik: <strong>{score().correct} / {score().total}</strong> poprawnych odpowiedzi.
          </p>
          <button class="primary-btn" onClick={startSession}>🔁 Jeszcze raz</button>
        </div>
      </Show>
    </div>
  );
};

export default PracticeMode;
