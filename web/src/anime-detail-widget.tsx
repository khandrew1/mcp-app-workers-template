import { createRoot } from "react-dom/client";

import "../index.css";
import AnimeWidget from "../components/widgets/anime-widget";

window.addEventListener("load", () => {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }

  createRoot(root).render(<AnimeWidget />);
});
