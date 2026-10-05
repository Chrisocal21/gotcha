import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/figtree";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/nunito";
import "@fontsource-variable/quicksand";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/lora";
import "@fontsource-variable/merriweather";
import "@fontsource-variable/oswald";
import "@fontsource-variable/caveat";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/800.css";
import "@fontsource/pacifico/400.css";
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
