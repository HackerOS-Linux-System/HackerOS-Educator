import { Component, createSignal, onMount, Show } from "solid-js";
import Sidebar, { type ViewId } from "./components/Sidebar";
import RoomList from "./components/RoomList";
import RoomView from "./components/RoomView";
import LearningPath from "./components/LearningPath";
import CareerPaths from "./components/CareerPaths";
import Badges from "./components/Badges";
import Dashboard from "./components/Dashboard";
import RoomEditor from "./components/RoomEditor";
import About from "./components/About";
import Onboarding from "./components/Onboarding";
import MyLearning from "./components/MyLearning";
import PracticeMode from "./components/PracticeMode";
import CompletionModal from "./components/CompletionModal";
import { initProfiles, loaded, profile } from "./store/progress";
import "./styles/global.css";

const App: Component = () => {
  const [view, setView] = createSignal<ViewId>("my-learning");
  const [activeRoomId, setActiveRoomId] = createSignal<string | null>(null);

  onMount(() => {
    void initProfiles();
  });

  function openRoom(roomId: string) {
    setActiveRoomId(roomId);
  }

  function backToRooms() {
    setActiveRoomId(null);
  }

  function changeView(v: ViewId) {
    setView(v);
    setActiveRoomId(null);
  }

  return (
    <Show when={loaded()} fallback={<div class="app-loading">Ładowanie…</div>}>
      <div class="app-shell">
        <Sidebar view={view} setView={changeView} />
        <main class="app-main">
          <Show when={activeRoomId()} fallback={
            <>
              <Show when={view() === "my-learning"}><MyLearning onOpenRoom={openRoom} /></Show>
              <Show when={view() === "rooms"}><RoomList onOpenRoom={openRoom} /></Show>
              <Show when={view() === "path"}><LearningPath onOpenRoom={openRoom} /></Show>
              <Show when={view() === "careers"}><CareerPaths onOpenRoom={openRoom} /></Show>
              <Show when={view() === "practice"}><PracticeMode /></Show>
              <Show when={view() === "badges"}><Badges /></Show>
              <Show when={view() === "dashboard"}><Dashboard /></Show>
              <Show when={view() === "editor"}><RoomEditor /></Show>
              <Show when={view() === "about"}><About /></Show>
            </>
          }>
            <RoomView roomId={activeRoomId()!} onBack={backToRooms} onOpenRoom={openRoom} />
          </Show>
        </main>
      </div>

      <Show when={!profile().onboardingSeen}>
        <Onboarding />
      </Show>
      <CompletionModal />
    </Show>
  );
};

export default App;
