import { useEffect, useState } from "react";

// Tiny hash router: "#/", "#/collection", "#/collection/<id>".
// Hash routes keep browser back working without any server config.

const current = () => window.location.hash.replace(/^#/, "") || "/";

export function useRoute(): string {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const onChange = () => setRoute(current());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function navigate(to: string) {
  if (current() !== to) window.location.hash = to;
}
