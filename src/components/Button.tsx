// src/components/Button.tsx
// Shared button primitive. The variant strings are the approved UI's action
// button skins extracted verbatim from their call sites — sizing, margins and
// typography stay per-site via className, since Tailwind class conflicts make
// baked-in sizes unsafe to override.
import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // avit-blue action button (splash start buttons, modal confirms)
  primary: "btn rounded-lg text-white bg-avit-blue active:bg-[#011c50]",
  // its cancel/secondary counterpart
  outline: "btn rounded-lg btn-outline active:bg-gray-100",
  // Header-style transparent icon button; pair with `selected`.
  // nav-btn / nav-btn-selected are plain un-layered CSS hooks in index.css —
  // an engine-proof fallback for the panel webview where @layer'd utilities
  // can silently drop (see the comment there).
  ghost:
    "nav-btn cursor-pointer select-none border-0 outline-none focus-visible:ring-2 focus-visible:ring-avit-blue font-semibold transition-colors flex flex-col justify-center items-center w-20 h-20",
};

const GHOST_SELECTED = "nav-btn-selected rounded-2xl bg-blue-600 text-white";
const GHOST_UNSELECTED = "bg-transparent";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** ghost only: the Header-style selected (blue) state */
  selected?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", selected, disabled, className, children, ...rest },
    ref,
  ) {
    const stateClasses =
      variant === "ghost" ? (selected ? GHOST_SELECTED : GHOST_UNSELECTED) : "";
    return (
      <button
        {...rest}
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        className={[VARIANT_CLASSES[variant], stateClasses, "ui-disabled", className]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </button>
    );
  },
);
