import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, LogOut, Settings, Upload } from "lucide-react";
import { useContent } from "../../app/content.context";
import { api } from "../../lib/api";
import { Field, Modal } from "../ui";
import "./studio-shell.styles.css";

type Profile = { name: string; image: string };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "M";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export const studioPages = [
  { id: "overview", label: "Overview" },
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
  { id: "consultations", label: "Consultations" },
  { id: "website", label: "Website" },
  { id: "settings", label: "Settings" },
];

type Props = {
  page: string;
  navigate: (page: string) => void;
  localMode: boolean;
  logout: () => void;
  onPublish: () => void;
  children: ReactNode;
};

export function StudioShell({
  page,
  navigate,
  localMode,
  logout,
  onPublish,
  children,
}: Props) {
  const { dirty, pending, busy, save } = useContent();
  const navigationRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile>({ name: "Mimi", image: "" });
  const [draft, setDraft] = useState<Profile | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  useEffect(() => {
    void api<Profile>("profile")
      .then(setProfile)
      .catch(() => {});
  }, []);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);
  function openProfile() {
    setDraft(profile);
    setPhoto(null);
    setPreview("");
    setProfileError("");
  }
  function resetProfileEditor() {
    setDraft(null);
    setPhoto(null);
    setPreview("");
    setProfileError("");
  }
  function closeProfile() {
    if (savingProfile) return;
    resetProfileEditor();
  }
  async function saveProfile() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      setProfileError("Add your name.");
      return;
    }
    setSavingProfile(true);
    setProfileError("");
    try {
      let image = draft.image;
      if (photo) {
        const response = await fetch("/api/cms/profile/photo", {
          method: "POST",
          headers: {
            "Content-Type": photo.type || "application/octet-stream",
            "X-File-Name": encodeURIComponent(photo.name),
          },
          body: photo,
        });
        const uploaded = await response.json();
        if (!response.ok)
          throw new Error(uploaded.error || "That photo could not be saved.");
        image = uploaded.url;
      }
      const saved = await api<Profile>("profile", {
        method: "PUT",
        body: JSON.stringify({ name, image }),
      });
      setProfile(saved);
      resetProfileEditor();
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Could not save your profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }
  useEffect(() => {
    const navigation = navigationRef.current;
    const selected = navigation?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    if (!navigation || !selected) return;
    navigation.scrollLeft =
      selected.offsetLeft - (navigation.clientWidth - selected.offsetWidth) / 2;
  }, [page]);
  return (
    <div className="admin-shell studio-frame">
      <a
        className="studio-skip"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to workspace
      </a>
      <div className="studio-top">
      <header className="studio-header">
        <a
          href="#/overview"
          className="studio-signature"
          onClick={(e) => {
            e.preventDefault();
            navigate("overview");
          }}
          aria-label="RMS Studio overview"
        >
          <span className="signature-wordmark">
            RIVERMINDSTYLE<span>.</span>
          </span>
          <span className="signature-label">THE STUDIO</span>
        </a>
        <nav
          ref={navigationRef}
          className="studio-nav"
          aria-label="Main navigation"
        >
          {studioPages
            .filter((item) => item.id !== "settings")
            .map((item) => (
              <button
                key={item.id}
                className={page === item.id ? "active" : ""}
                aria-current={page === item.id ? "page" : undefined}
                onClick={() => navigate(item.id)}
              >
                {item.label}
              </button>
            ))}
        </nav>
        <div className="studio-utilities">
          <button
            className={`studio-settings ${page === "settings" ? "active" : ""}`}
            title="Workspace settings"
            aria-label="Settings"
            aria-current={page === "settings" ? "page" : undefined}
            onClick={() => navigate("settings")}
          >
            <Settings size={15} strokeWidth={1.5} />
            <span>Settings</span>
          </button>
          <button
            type="button"
            className="studio-avatar"
            aria-label={`Profile, ${profile.name}`}
            title={profile.name}
            onClick={openProfile}
          >
            {profile.image ? (
              <img src={profile.image} alt="" />
            ) : (
              initials(profile.name)
            )}
          </button>
          {!localMode && (
            <button
              className="studio-signout"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => {
                if (
                  !dirty ||
                  confirm("Leave without saving your latest edits?")
                )
                  logout();
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>
      <div className="studio-toolbar">
        <div className="studio-greeting">
          <div>
            <p>{profile.name},</p>
            <strong>Welcome back</strong>
          </div>
          <time className="studio-date" dateTime={new Date().toISOString().slice(0, 10)}>
            <span>{new Date().toLocaleDateString("en-GB", { day: "2-digit" })}</span>
            <small>
              <b>{new Date().toLocaleDateString("en-GB", { weekday: "short" })}</b>
              {new Date().toLocaleDateString("en-GB", { month: "long" })}
            </small>
          </time>
        </div>
        <div className="studio-actions">
          <a
            className="button secondary"
            href={
              import.meta.env.VITE_STOREFRONT_URL || "http://127.0.0.1:5173/"
            }
            target="_blank"
            rel="noreferrer"
          >
            View storefront
            <ArrowUpRight size={14} />
          </a>
          <button
            className="button secondary"
            disabled={!dirty || busy}
            onClick={() => void save()}
          >
            Save draft
          </button>
          <button
            className="button"
            disabled={!pending || busy}
            onClick={onPublish}
          >
            <Upload size={14} />
            <span>Publish</span>
          </button>
        </div>
      </div>
      </div>
      <div className="workspace">{children}</div>
      {draft && (
        <Modal title="Your profile" onClose={closeProfile}>
          <div className="profile-editor">
            <button
              type="button"
              className="profile-photo"
              onClick={() => photoRef.current?.click()}
              disabled={savingProfile}
            >
              {preview || draft.image ? (
                <img src={preview || draft.image} alt="" />
              ) : (
                <span>{initials(draft.name)}</span>
              )}
            </button>
            <input
              ref={photoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                setPhoto(file);
                setPreview((current) => {
                  if (current) URL.revokeObjectURL(current);
                  return URL.createObjectURL(file);
                });
              }}
            />
            <div className="profile-photo-actions">
              <button
                type="button"
                className="button secondary"
                disabled={savingProfile}
                onClick={() => photoRef.current?.click()}
              >
                {draft.image || photo ? "Change photo" : "Add photo"}
              </button>
              {(draft.image || photo) && (
                <button
                  type="button"
                  className="text-button"
                  disabled={savingProfile}
                  onClick={() => {
                    setPhoto(null);
                    setPreview("");
                    setDraft({ ...draft, image: "" });
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            <Field label="Name">
              <input
                value={draft.name}
                maxLength={40}
                autoFocus
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </Field>
            {profileError && (
              <p className="error" role="alert">
                {profileError}
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                disabled={savingProfile}
                onClick={closeProfile}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button"
                disabled={savingProfile}
                onClick={() => void saveProfile()}
              >
                {savingProfile ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
