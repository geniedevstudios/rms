import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/400-italic.css";
import "./styles/global.css";
import { loadPublishedContent, watchPublishedContent } from "./content/content";
import { watchIntro } from "./intro";

watchIntro();

async function mountStorefront() {
  await loadPublishedContent();
  watchPublishedContent();
  const { default: App } = await import("./app/app");
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode><App /></React.StrictMode>,
  );
}
void mountStorefront();
