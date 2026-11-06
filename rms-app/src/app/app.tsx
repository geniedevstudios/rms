import { useEffect, useState } from "react";
import { subscribeContent } from "../content/content";
import { AppProviders } from "./app.providers";
import { AppRoutes } from "./app.routes";
import { Header } from "../components/header/header";
import { Footer } from "../components/footer/footer";
import { Newsletter } from "../features/newsletter/newsletter";
import { DialogHost } from "../components/dialogs/dialog-host";
import { Toast } from "../components/toast/toast";
import { PromotionPopup } from "../features/promotions/promotions";

export default function App() {
  const [, refresh] = useState(0);
  useEffect(() => subscribeContent(() => refresh((value) => value + 1)), []);
  return (
    <AppProviders>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <AppRoutes />
      </main>
      <Newsletter />
      <Footer />
      <Toast />
      <DialogHost />
      <PromotionPopup />
    </AppProviders>
  );
}
