import { useEffect, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-react";
import { getProfile, saveProfile, setTokenGetter } from "../lib/api";
import { getExplorerName, setExplorerName } from "../lib/prefs";
import { startStyleSync } from "../lib/styleSync";
import { CardFan } from "./GameCard";
import Logo from "./Logo";
import { SHOWCASE } from "../lib/showcase";

export const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

// Only this account sees the developer tools (the worker enforces the same rule).
export const DEV_EMAIL = ((import.meta.env.VITE_DEV_EMAIL as string | undefined) ?? "").trim().toLowerCase();

// Clerk draws its own form; these settings make it use the app's colors and fonts, as a rounded card like the Welcome panel.
const APPEARANCE = {
  variables: {
    colorPrimary: "var(--accent)",
    colorBackground: "var(--color-paper)",
    colorText: "var(--color-ink)",
    colorTextSecondary: "var(--color-ink-2)",
    colorInputBackground: "var(--color-paper-2)",
    colorInputText: "var(--color-ink)",
    colorNeutral: "var(--color-ink)",
    fontFamily: "var(--font-sans)",
    borderRadius: "14px",
  },
  elements: {
    rootBox: { width: "100%" },
    cardBox: { width: "100%", borderRadius: "28px", boxShadow: "var(--shadow-lift)", border: "none" },
    card: { borderRadius: "28px", padding: "32px" },
    footer: { background: "transparent" },
    headerTitle: { fontFamily: "var(--font-display)", fontWeight: 800 },
    formButtonPrimary: { borderRadius: "9999px", boxShadow: "none" },
  },
};

// Hands the session token to the API client and keeps the explorer name in sync with the saved profile.
function Session({ children }: { children: ReactNode }) {
  const { getToken, userId } = useAuth();
  const { user } = useUser();

  // Set during render so the first requests from the app already carry the token.
  setTokenGetter(() => getToken());

  // Their look follows them to every device they sign in on.
  useEffect(() => {
    if (!userId) return;
    return startStyleSync();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile();
        if (cancelled) return;
        if (profile?.displayName) {
          setExplorerName(profile.displayName);
          return;
        }
        const initial = getExplorerName() || user?.firstName || user?.username || "";
        if (initial) {
          setExplorerName(initial);
          await saveProfile({ displayName: initial.trim().slice(0, 24) });
        }
      } catch {
        // The local name keeps working; the profile syncs next time.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, user?.firstName, user?.username]);

  return <>{children}</>;
}

export default function AuthGate({ children }: { children: ReactNode }) {
  if (!CLERK_KEY) {
    return <div className="grid min-h-dvh place-items-center p-6 text-center text-ink-2">Sign-in isn't configured. Set VITE_CLERK_PUBLISHABLE_KEY in app/.env.local.</div>;
  }
  return (
    <ClerkProvider publishableKey={CLERK_KEY} afterSignOutUrl="/">
      <SignedOut>
        <div className="welcome fixed inset-0 overflow-y-auto">
          <div className="relative mx-auto flex min-h-full max-w-[1120px] flex-col px-4 py-6 sm:px-6 lg:py-8">
            <header className="flex justify-center text-white lg:justify-start">
              <Logo className="text-[40px] lg:text-[46px]" />
            </header>
            <div className="grid flex-1 content-center items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
              <div className="flex flex-col items-center text-center text-white">
                <CardFan cards={SHOWCASE} width={176} className="welcome__fan" />
                <h1 className="mt-6 max-w-[380px] font-display text-[26px] leading-[1.1] font-extrabold tracking-tight">
                  Every animal you meet becomes a card
                </h1>
                <p className="mt-2 max-w-[340px] text-[15px] text-white/75">Sign in to pick up where you left off.</p>
              </div>
              <div className="rise-in flex justify-center">
                <SignIn routing="hash" appearance={APPEARANCE} />
              </div>
            </div>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <Session>{children}</Session>
      </SignedIn>
    </ClerkProvider>
  );
}
