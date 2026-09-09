import { render } from "solid-js/web";
import App from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Nie znaleziono elementu #root w index.html");

render(() => <App />, root);
