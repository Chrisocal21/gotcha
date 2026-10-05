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
import "@fontsource/comic-neue/400.css";
import "@fontsource/comic-neue/700.css";
import "@fontsource-variable/baloo-2";
import "@fontsource-variable/comfortaa";
import "@fontsource/patrick-hand";
import "@fontsource/chewy";
import "@fontsource/bangers";
import "@fontsource/righteous";
import "@fontsource/permanent-marker";
import "@fontsource/lobster";
import "@fontsource/press-start-2p";
import "./index.css";
import App from "./App";
import AuthGate from "./components/AuthGate";
import { initPrefs } from "./lib/prefs";
import { initPwa } from "./lib/pwa";

initPrefs();
initPwa();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </StrictMode>,
);
