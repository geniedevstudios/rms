import { NotificationStatus } from "../notifications/notification-status";
import { useEffect, useState } from "react";
import { Download, RotateCcw, ShieldCheck, RefreshCw } from "lucide-react";
import { useContent } from "../../app/content.context";
import { api } from "../../lib/api";
import { PageHeading, Modal, Field, formatDate } from "../../components/ui";

type AccessPerson = {
  email: string;
  name: string;
  status: "active" | "invited";
  you: boolean;
};

export function Settings({
  localMode,
  canInvite,
}: {
  localMode: boolean;
  canInvite: boolean;
}) {
  const { state, discard, reload, busy } = useContent();
  const [confirm, setConfirm] = useState<"discard" | "reload" | null>(null);
  const [people, setPeople] = useState<AccessPerson[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [accessError, setAccessError] = useState("");
  const [accessNote, setAccessNote] = useState("");
  const [sending, setSending] = useState(false);

  async function loadAccess() {
    const data = await api<{ people: AccessPerson[] }>("admins");
    setPeople(data.people);
  }
  useEffect(() => {
    if (!canInvite) return;
    void loadAccess().catch((error: Error) => setAccessError(error.message));
  }, [canInvite]);
  async function giveAccess(address: string) {
    const email = address.trim();
    setSending(true);
    setAccessError("");
    setAccessNote("");
    try {
      await api("admins", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (email.toLowerCase() === inviteEmail.trim().toLowerCase())
        setInviteEmail("");
      setAccessNote(`Invitation sent to ${email}.`);
      await loadAccess();
    } catch (error) {
      setAccessError(
        error instanceof Error
          ? error.message
          : "The invitation could not be sent.",
      );
    } finally {
      setSending(false);
    }
  }
  async function revoke(email: string) {
    setSending(true);
    setAccessError("");
    setAccessNote("");
    try {
      await api("admins", {
        method: "DELETE",
        body: JSON.stringify({ email }),
      });
      await loadAccess();
    } catch (error) {
      setAccessError(
        error instanceof Error
          ? error.message
          : "That invitation could not be revoked.",
      );
    } finally {
      setSending(false);
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { content: state.draft, exportedAt: new Date().toISOString() },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "rms-content-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <PageHeading
        eyebrow="THE STUDIO"
        title="A little housekeeping."
        description="Keep your content organised, and your workspace in good order."
      />
      <NotificationStatus />
      {canInvite && (
        <section className="panel form-panel studio-access">
          <h2>Studio access</h2>
          <p>
            Invite an administrator. They receive an email with a link to set
            their name and password.
          </p>
          <form
            className="access-form"
            onSubmit={(event) => {
              event.preventDefault();
              void giveAccess(inviteEmail);
            }}
          >
            <Field label="Email">
              <input
                required
                type="email"
                inputMode="email"
                autoComplete="off"
                value={inviteEmail}
                disabled={sending}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </Field>
            <button className="button" disabled={sending}>
              {sending ? "Sending…" : "Give access"}
            </button>
          </form>
          {accessError && (
            <p className="error" role="alert">
              {accessError}
            </p>
          )}
          {accessNote && (
            <p className="access-note" role="status">
              {accessNote}
            </p>
          )}
          {people.length > 0 && (
            <ul className="access-list">
              {people.map((person) => (
                <li className="access-person" key={`${person.status}-${person.email}`}>
                  <div>
                    <strong>
                      {person.name || person.email}
                      {person.you ? " · You" : ""}
                    </strong>
                    <p>
                      {person.status === "invited"
                        ? "Invitation sent"
                        : person.name
                          ? person.email
                          : "Has access"}
                    </p>
                  </div>
                  {person.status === "invited" && (
                    <div className="access-actions">
                      <button
                        type="button"
                        className="text-button"
                        disabled={sending}
                        onClick={() => void giveAccess(person.email)}
                      >
                        Send again
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        disabled={sending}
                        onClick={() => void revoke(person.email)}
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <div className="settings-grid">
        <section className="panel form-panel">
          <ShieldCheck size={24} />
          <h2>{localMode ? "Your local studio" : "Protected workspace"}</h2>
          <p>
            {localMode
              ? "This dashboard is running on this computer. Publishing updates the storefront connected to this studio."
              : "This workspace is protected by an administrator password. Your session lasts eight hours."}
          </p>
          <dl>
            <div>
              <dt>Content revision</dt>
              <dd>{state.revision}</dd>
            </div>
            <div>
              <dt>Published revision</dt>
              <dd>{state.publishedRevision}</dd>
            </div>
            <div>
              <dt>Last publication</dt>
              <dd>{formatDate(state.publishedAt)}</dd>
            </div>
          </dl>
        </section>
        <section className="panel form-panel">
          <h2>Content care</h2>
          <div className="setting-action">
            <div>
              <strong>Export saved content</strong>
              <p>
                Download a copy of your saved draft. Uploaded media files are
                stored separately.
              </p>
            </div>
            <button className="button secondary" onClick={download}>
              <Download size={15} /> Export
            </button>
          </div>
          <div className="setting-action">
            <div>
              <strong>Reload the latest draft</strong>
              <p>Useful when another administrator has saved an update.</p>
            </div>
            <button
              className="button secondary"
              onClick={() => setConfirm("reload")}
            >
              <RefreshCw size={15} /> Reload
            </button>
          </div>
          <div className="setting-action">
            <div>
              <strong>Restore published content</strong>
              <p>
                Discard draft changes and return to the current storefront
                version.
              </p>
            </div>
            <button
              className="button secondary"
              onClick={() => setConfirm("discard")}
            >
              <RotateCcw size={15} /> Restore
            </button>
          </div>
        </section>
      </div>
      {confirm && (
        <Modal
          title={
            confirm === "discard"
              ? "Restore published content?"
              : "Reload the saved draft?"
          }
          onClose={() => setConfirm(null)}
        >
          <p>
            Your unsaved edits will be replaced. Uploaded files will remain in
            the media library.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setConfirm(null)}
            >
              Keep editing
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                await (confirm === "discard" ? discard() : reload());
                setConfirm(null);
              }}
            >
              Continue
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
