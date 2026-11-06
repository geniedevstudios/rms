import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Modal, PageHeading } from "../../components/ui";
import { SelectMenu } from "../../components/select-menu/select-menu";
import {
  formatWheelValue,
  WheelDatePicker,
} from "../../../shared/wheel-picker.tsx";

type ConsultationStatus = "requested" | "confirmed" | "completed";

type Consultation = {
  id: string;
  date: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  meeting: string;
  vision?: string;
  status: ConsultationStatus;
  appointment?: string;
  scheduledAt?: string;
  rescheduled?: boolean;
  fee?: number;
  paid?: boolean;
};

const stages: { id: ConsultationStatus; label: string }[] = [
  { id: "requested", label: "Requested" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
];

function timeOnDay(item: Consultation) {
  const day = item.appointment || item.date.slice(0, 10);
  const existing = (item.scheduledAt || "").slice(0, 16);
  return existing.startsWith(`${day}T`) ? existing : `${day}T10:00`;
}

function when(item: Consultation) {
  if (item.scheduledAt) return formatWheelValue(item.scheduledAt.slice(0, 16), true);
  if (item.appointment) return formatWheelValue(item.appointment);
  return new Intl.DateTimeFormat("en-GH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Accra",
  }).format(new Date(item.date));
}

export function StudioConsultations() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [composer, setComposer] = useState<"" | "time" | "move">("");
  const [slot, setSlot] = useState("");
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const next = await api<Consultation[]>("consultations");
        if (!stop) {
          setItems(next);
          setProblem("");
        }
      } catch (reason) {
        if (!stop)
          setProblem(
            reason instanceof Error
              ? reason.message
              : "The consultations could not be loaded.",
          );
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 20000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  const open = items.find((item) => item.id === openId) || null;

  function remember(saved: Consultation) {
    setItems((current) =>
      current.map((entry) => (entry.id === saved.id ? saved : entry)),
    );
  }

  async function update(item: Consultation, body: Record<string, string>) {
    setSaving(true);
    setProblem("");
    try {
      const saved = await api<Consultation>(`consultations/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      remember(saved);
      setComposer("");
    } catch (reason) {
      setProblem(
        reason instanceof Error
          ? reason.message
          : "The consultation could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="CONSULTATIONS"
        title="Appointments, as they arrive."
        description="See each request, the piece they have in mind, and where you are with it."
      />
      {problem && !open && <p className="error">{problem}</p>}
      {!items.length ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">TODAY</div>
              <h2>No appointments yet.</h2>
            </div>
          </div>
          <p className="order-empty">
            Requests from the Custom page appear here, ready to confirm.
          </p>
        </section>
      ) : (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">IN THE STUDIO</div>
              <h2>
                {items.length} {items.length === 1 ? "consultation" : "consultations"}
              </h2>
            </div>
          </div>
          <div className="table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Appointment</th>
                  <th>Service</th>
                  <th>Meeting</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} onClick={() => setOpenId(item.id)}>
                    <td>
                      <button
                        className="product-name"
                        onClick={() => setOpenId(item.id)}
                      >
                        <span>
                          <strong>{item.name}</strong>
                          <small>{when(item)}</small>
                        </span>
                      </button>
                    </td>
                    <td>{item.service}</td>
                    <td>{item.meeting}</td>
                    <td>
                      <span className="badge">
                        {stages.find((stage) => stage.id === item.status)?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {open && (
        <Modal
          title={open.name}
          onClose={() => {
            setOpenId(null);
            setComposer("");
          }}
          wide
        >
          <div className="appointment-sheet">
            <div className="appointment-meta">
              <span className="eyebrow">{open.id}</span>
              <span className="badge">
                {stages.find((stage) => stage.id === open.status)?.label}
              </span>
            </div>
            <div className="appointment-grid">
              <section className="appointment-card">
                <span className="eyebrow">The piece</span>
                <strong>{open.service}</strong>
                <p>{open.vision || "No note with this request."}</p>
              </section>
              <section className="appointment-card">
                <span className="eyebrow">Reach them</span>
                <strong>{open.name}</strong>
                <span>{open.email}</span>
                <span>{open.phone}</span>
                <span>{open.meeting}</span>
              </section>
            </div>
            <section className="appointment-card appointment-day">
              <div>
                <span className="eyebrow">The day</span>
                <strong>{when(open)}</strong>
                <p>
                  {open.paid === false
                    ? "Payment has not been confirmed."
                    : open.status === "confirmed"
                      ? `Paid GH₵ ${open.fee || 300}. This time is confirmed.`
                      : `Paid GH₵ ${open.fee || 300}. The studio may move this day based on availability.`}
                </p>
              </div>
              {open.status === "requested" && (
                <div className="appointment-actions">
                  <button
                    type="button"
                    className="button"
                    disabled={saving || !open.appointment}
                    aria-expanded={composer === "time"}
                    onClick={() => {
                      setSlot(timeOnDay(open));
                      setComposer((current) => (current === "time" ? "" : "time"));
                    }}
                  >
                    Approve this day
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    disabled={saving}
                    aria-expanded={composer === "move"}
                    onClick={() => {
                      setSlot(
                        (open.scheduledAt || `${open.appointment || open.date.slice(0, 10)}T10:00`).slice(0, 16),
                      );
                      setComposer((current) => (current === "move" ? "" : "move"));
                    }}
                  >
                    Reschedule
                  </button>
                </div>
              )}
            </section>
            {open.status === "requested" && composer === "time" && (
              <section className="appointment-move is-time">
                <div className="appointment-move-copy">
                  <span className="eyebrow">A time on this day</span>
                  <p>They chose the day. Set the time they should arrive.</p>
                </div>
                <WheelDatePicker value={slot} onChange={setSlot} timeOnly />
                <div className="appointment-move-actions">
                  <button
                    type="button"
                    className="button secondary"
                    disabled={saving}
                    onClick={() => setComposer("")}
                  >
                    Leave it for now
                  </button>
                  <button
                    type="button"
                    className="button"
                    disabled={saving}
                    onClick={() =>
                      void update(open, { action: "approve", scheduledAt: slot })
                    }
                  >
                    {saving ? "Sending…" : "Confirm this time"}
                  </button>
                </div>
              </section>
            )}
            {open.status === "requested" && composer === "move" && (
              <section className="appointment-move">
                <div className="appointment-move-copy">
                  <span className="eyebrow">A new day</span>
                  <p>Choose the day and time. This is what the client receives.</p>
                </div>
                <WheelDatePicker value={slot} onChange={setSlot} withTime />
                <div className="appointment-move-actions">
                  <button
                    type="button"
                    className="button secondary"
                    disabled={saving}
                    onClick={() => setComposer("")}
                  >
                    Keep the current day
                  </button>
                  <button
                    type="button"
                    className="button"
                    disabled={saving}
                    onClick={() =>
                      void update(open, { action: "reschedule", scheduledAt: slot })
                    }
                  >
                    {saving ? "Sending…" : "Send the new day"}
                  </button>
                </div>
              </section>
            )}
            {problem && <p className="error">{problem}</p>}
            <div className="appointment-progress">
              <span className="eyebrow">Progress</span>
              <SelectMenu
                label="Progress"
                value={open.status}
                disabled={saving}
                onChange={(value) => {
                    if (value === "confirmed") {
                      if (open.status === "requested" && open.appointment) {
                        setSlot(timeOnDay(open));
                        setComposer("time");
                      }
                      return;
                    }
                  void update(open, { status: value });
                }}
                options={stages.map((stage) => ({
                  value: stage.id,
                  label: stage.label,
                }))}
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
