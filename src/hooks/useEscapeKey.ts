// src/hooks/useEscapeKey.ts
import { useEffect } from "react";

/** Call the handler when Escape is pressed — for dismissable modals. */
export function useEscapeKey(onEscape: () => void) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEscape]);
}
