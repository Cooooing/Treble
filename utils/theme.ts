export const themes = ["light", "dark"] as const;

export type Theme = (typeof themes)[number];

export const defaultTheme: Theme = "light";

export function isDarkTheme(theme: Theme) {
  return theme === "dark";
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return defaultTheme;
  return window.localStorage.getItem("treble.theme") === "dark" ? "dark" : defaultTheme;
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("treble.theme", theme);
  window.dispatchEvent(new CustomEvent<Theme>("treble-theme-change", { detail: theme }));
}
