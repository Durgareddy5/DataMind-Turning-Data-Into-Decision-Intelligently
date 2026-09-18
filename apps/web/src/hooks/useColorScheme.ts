import { useEffect, useState } from "react";

export function useColorScheme(): "light" | "dark" {
  const query = "(prefers-color-scheme: dark)";
  const [scheme, setScheme] = useState<"light" | "dark">(() =>
    typeof window !== "undefined" && window.matchMedia(query).matches ? "dark" : "light"
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setScheme(event.matches ? "dark" : "light");
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  return scheme;
}
