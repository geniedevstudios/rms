import { useEffect, useState } from "react";
import { ArrowUpRight, Eye, EyeOff, X, Check, AlertCircle } from "lucide-react";
import type { AdminState } from "../../shared/content.types";
import { api } from "../lib/api";
import { ContentProvider, useContent } from "./content.context";
import { Modal, Field } from "../components/ui";
import {
  StudioShell,
  studioPages,
} from "../components/studio-shell/studio-shell";
import { Overview } from "../features/overview/overview";
import { Website } from "../features/website/website";
import { Catalog } from "../features/catalog/catalog";
import { StudioOrders } from "../features/orders/orders";
import { StudioConsultations } from "../features/consultations/consultations";
import { Settings } from "../features/settings/settings";

function Dashboard({
  localMode,
  canInvite,
  logout,
}: {
  localMode: boolean;
  canInvite: boolean;
  logout: () => void;
}) {
  const { content, busy, message, error, setError, publish } = useContent();
  const [page, setPage] = useState(location.hash.slice(2) || "overview");
  const [publishing, setPublishing] = useState(false);
  useEffect(() => {
    const listener = () => setPage(location.hash.slice(2) || "overview");
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  function navigate(next: string) {
    location.hash = "/" + next;
    setPage(next);
    window.scrollTo(0, 0);
  }
  const inWebsite =
    page === "website" || page === "media" || page === "journal" || page === "promotions";
  const inProducts = page === "products" || page === "collections";
  const current =
    studioPages.find(
      (n) => n.id === (inWebsite ? "website" : inProducts ? "products" : page),
    ) || studioPages[0];
  return (
    <>
      <StudioShell
        page={current.id}
        navigate={navigate}
        localMode={localMode}
        logout={logout}
        onPublish={() => setPublishing(true)}
      >
        <main className="main-content" id="main-content" tabIndex={-1}>
          {error && (
            <div role="alert" className="error-banner">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button
                aria-label="Dismiss error"
                className="icon-button"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <fieldset className="workspace-fields" disabled={busy}>
            {current.id === "overview" ? (
              <Overview navigate={navigate} />
            ) : inWebsite ? (
              <Website
                section={
                  page === "media" || page === "journal" || page === "promotions" ? page : "website"
                }
                onSection={navigate}
              />
            ) : inProducts ? (
              <Catalog
                section={page === "collections" ? "collections" : "products"}
                onSection={navigate}
              />
            ) : current.id === "orders" ? (
              <StudioOrders />
            ) : current.id === "consultations" ? (
              <StudioConsultations />
            ) : (
              <Settings localMode={localMode} canInvite={canInvite} />
            )}
          </fieldset>
          <footer className="workspace-footer">
            <span>RIVERMINDSTYLE</span>
            <p>Rooted in identity. Open to the world.</p>
            <small>YOUR STUDIO, YOUR POINT OF VIEW.</small>
          </footer>
        </main>
      </StudioShell>
      {message && (
        <div className="toast" role="status">
          <Check size={17} />
          {message}
        </div>
      )}
      {publishing && (
        <Modal
          title="Ready for the world?"
          onClose={() => {
            if (!busy) setPublishing(false);
          }}
        >
          <p>
            Your saved content will replace the current storefront content.
            Visitors will see the update when they open or refresh the store.
          </p>
          <div className="publish-summary">
            <span>{content.hero.slides.length} hero slides</span>
            <span>
              {content.products.filter((p) => p.status === "active").length}{" "}
              active products
            </span>
            <span>
              {content.journals.filter((j) => j.status === "published").length}{" "}
              journal stories
            </span>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setPublishing(false)}
            >
              Keep editing
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                if (await publish()) setPublishing(false);
              }}
            >
              {busy ? "Publishing…" : "Publish storefront"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function StudioMark() {
  return (
    <div className="studio-signature">
      <span className="signature-wordmark">
        RIVERMINDSTYLE<span>.</span>
      </span>
      <span className="signature-label">THE STUDIO</span>
    </div>
  );
}

function hold(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function invitationToken() {
  return /^#\/join\/([A-Za-z0-9_-]{20,})$/.exec(location.hash)?.[1] ?? "";
}

type Session = {
  authenticated: boolean;
  localMode: boolean;
  canInvite: boolean;
};

function JoinStudio({
  email,
  unavailable,
  onJoin,
  onSignIn,
}: {
  email: string;
  unavailable: boolean;
  onJoin: (name: string, password: string) => Promise<void>;
  onSignIn: () => void;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!email && !unavailable)
    return (
      <div className="studio-loader">
        <span className="gate-line" />
      </div>
    );
  if (unavailable || !email)
    return (
      <>
        <h1>Invitation unavailable.</h1>
        <p>This invitation is no longer available. Ask for a new one to join the studio.</p>
        <button type="button" className="button" onClick={onSignIn}>
          Back to sign in
        </button>
      </>
    );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 12) {
      setError("Use at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onJoin(name.trim(), password);
    } catch (joinError) {
      setError((joinError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Welcome to the studio.</h1>
      <p>Set your name and password. This invitation was sent to {email}.</p>
      <form onSubmit={(event) => void submit(event)}>
        <Field label="Name">
          <input
            required
            autoFocus
            autoComplete="name"
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Password" hint="At least 12 characters.">
          <div className="password-field">
            <input
              required
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? (
                <EyeOff size={16} strokeWidth={1.75} />
              ) : (
                <Eye size={16} strokeWidth={1.75} />
              )}
            </button>
          </div>
        </Field>
        <Field label="Confirm password">
          <div className="password-field">
            <input
              required
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
        </Field>
        <button className="button" disabled={busy}>
          {busy ? "Joining…" : "Join the studio"}
          <ArrowUpRight size={16} />
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="text-button join-signin" onClick={onSignIn}>
        Sign in instead
      </button>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [initial, setInitial] = useState<AdminState | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<
    "boot" | "login" | "loading" | "studio" | "join"
  >("boot");
  const [invitation, setInvitation] = useState<{
    email: string;
    unavailable: boolean;
  } | null>(null);

  async function openOverview() {
    setPhase("loading");
    setError("");
    const started = performance.now();
    try {
      const state = await api<AdminState>("state");
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const remaining = (reduce ? 400 : 1500) - (performance.now() - started);
      if (remaining > 0) await hold(remaining);
      if (location.hash !== "#/overview") location.hash = "/overview";
      setInitial(state);
      setPhase("studio");
    } catch (e) {
      setInitial(null);
      setPhase("login");
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function showInvite() {
      const token = invitationToken();
      if (!token) return;
      setPhase("join");
      setInvitation(null);
      try {
        const preview = await api<{ email: string }>("join/preview", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        if (!cancelled)
          setInvitation({ email: preview.email, unavailable: false });
      } catch {
        if (!cancelled) setInvitation({ email: "", unavailable: true });
      }
    }
    void showInvite();
    if (!invitationToken()) {
      void (async () => {
        try {
          const next = await api<Session>("session");
          if (cancelled || invitationToken()) return;
          setSession(next);
          if (next.authenticated) await openOverview();
          else setPhase("login");
        } catch (e) {
          if (cancelled || invitationToken()) return;
          setPhase("login");
          setError((e as Error).message);
        }
      })();
    }
    const onHash = () => void showInvite();
    window.addEventListener("hashchange", onHash);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  function leaveInvitation() {
    location.hash = "";
    setInvitation(null);
    setError("");
    setPhase("login");
  }

  async function joinStudio(name: string, passwordValue: string) {
    const next = await api<Session>("join", {
      method: "POST",
      body: JSON.stringify({
        token: invitationToken(),
        name,
        password: passwordValue,
      }),
    });
    setSession(next);
    await openOverview();
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const next = await api<Session>("login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setSession(next);
      await openOverview();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (phase === "studio" && session?.authenticated && initial)
    return (
      <ContentProvider initial={initial}>
        <Dashboard
          localMode={session.localMode}
          canInvite={session.canInvite}
          logout={() => {
            void api("logout", { method: "POST" }).then(() => {
              setInitial(null);
              setSession({
                authenticated: false,
                localMode: false,
                canInvite: false,
              });
              setPhase("login");
              location.hash = "";
            });
          }}
        />
      </ContentProvider>
    );

  return (
    <div className="studio-gate">
      <section className="studio-gate-card" aria-live="polite">
        <StudioMark />
        {phase === "loading" || phase === "boot" ? (
          <div className="studio-loader">
            {phase === "loading" ? <p>Opening your studio</p> : null}
            <span className="gate-line" />
          </div>
        ) : phase === "join" ? (
          <JoinStudio
            email={invitation?.email || ""}
            unavailable={Boolean(invitation?.unavailable)}
            onJoin={joinStudio}
            onSignIn={leaveInvitation}
          />
        ) : (
          <>
            <h1>A space for your vision.</h1>
            <p>Sign in to your brand workspace.</p>
            <form onSubmit={login}>
              <Field label="Email">
                <input
                  required
                  autoFocus
                  autoComplete="username"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Password">
                <div className="password-field">
                  <input
                    required
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? (
                      <EyeOff size={16} strokeWidth={1.75} />
                    ) : (
                      <Eye size={16} strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </Field>
              <button className="button" disabled={busy}>
                {busy ? "Checking…" : "Enter the studio"}
                <ArrowUpRight size={16} />
              </button>
            </form>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
