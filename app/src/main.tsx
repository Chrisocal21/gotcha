import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/figtree";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "./index.css";
import App from "./App";
import AuthGate from "./components/AuthGate";
import { initPrefs } from "./lib/prefs";

initPrefs();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </StrictMode>,
);
