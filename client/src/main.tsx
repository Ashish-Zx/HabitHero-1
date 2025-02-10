import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Simple theme initialization
const storedTheme = localStorage.getItem("theme");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const theme = storedTheme || (systemPrefersDark ? "dark" : "light");

// Remove any existing theme classes and add the correct one
document.documentElement.classList.remove("light", "dark");
document.documentElement.classList.add(theme);

// Save the initial theme
if (!storedTheme) {
  localStorage.setItem("theme", theme);
}

createRoot(document.getElementById("root")!).render(<App />);