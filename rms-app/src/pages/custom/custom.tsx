import { mediaSlot } from "../../content/content";
import "../collection/collection.styles.css";
import "./custom.styles.css";
import { type FormEvent, useState, useRef } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { SelectMenu } from "../../components/select-menu/select-menu";
import { consultationFee, customDesigns } from "../../data/custom-designs";
import { money } from "../../lib/format-currency";
import { openPaystack, preparePaystack } from "../../features/payments/paystack";
import { rememberAppointment } from "../confirmation/appointment";
import { go } from "../../routing/navigation";
import {
  accraToday,
  WheelDatePicker,
} from "../../shared/wheel-picker.tsx";
import { CustomDesignCard } from "./custom-design-card";

const services = ["Styling consultation", "Bespoke tailoring"];

function comingDay() {
  const [year, month, date] = accraToday().split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + 1)).toISOString().slice(0, 10);
}

export function Custom() {
  const requestId = useRef<string | null>(null);
  const signature = useRef("");
  const [day, setDay] = useState(comingDay);
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState("");

  const scrollTo = (id: string) => (event: { preventDefault: () => void }) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const book = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const booking = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      service: String(data.get("service") || ""),
      meeting: String(data.get("meeting") || ""),
      vision: String(data.get("vision") || ""),
      appointment: day,
    };
    const nextSignature = JSON.stringify(booking);
    if (signature.current !== nextSignature) {
      signature.current = nextSignature;
      requestId.current = null;
    }
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    const id = (requestId.current ||=
      "CST-" +
      [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase());
    setSending(true);
    setProblem("");
    try {
      const started = await fetch("/api/cms/consultations/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...booking, id }),
      });
      const payment = (await started.json().catch(() => ({}))) as {
        accessCode?: string;
        reference?: string;
        error?: string;
      };
      if (!started.ok || !payment.accessCode || !payment.reference)
        throw new Error(payment.error || "Payment could not be started.");
      await preparePaystack();
      const reference = await openPaystack(payment.accessCode, payment.reference);
      const recorded = await fetch("/api/cms/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const saved = (await recorded.json().catch(() => ({}))) as {
        id?: string;
        fee?: number;
        error?: string;
      };
      if (!recorded.ok) throw new Error(saved.error || "The appointment could not be saved.");
      const receiptId = saved.id || reference;
      rememberAppointment({
        id: receiptId,
        name: booking.name,
        service: booking.service,
        meeting: booking.meeting,
        appointment: booking.appointment,
        fee: typeof saved.fee === "number" ? saved.fee : consultationFee,
        vision: booking.vision || undefined,
      });
      go(`/confirmation/${receiptId}`);
    } catch (error) {
      setProblem(
        error instanceof Error && error.message
          ? error.message
          : "We could not send the request. Try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section className="collection-hero">
        <img
          src={mediaSlot("custom-hero").src}
          alt={mediaSlot("custom-hero").alt}
        />
        <div>
          <span className="eyebrow">CUSTOM MADE</span>
          <h1>
            Custom made
            <br />
            dresses
          </h1>
          <p>
            Dresses cut to you, from designs already in the atelier. Open a
            design to choose your size. The time in the workroom is on its
            page.
          </p>
          <a
            href="#custom-designs"
            className="text-link"
            onClick={scrollTo("custom-designs")}
          >
            Explore custom designs <ArrowDown size={15} />
          </a>
        </div>
      </section>

      <section id="custom-designs" className="section custom-designs">
        <div className="page-intro">
          <span className="eyebrow">DESIGNS YOU CAN ORDER</span>
          <h2>Made for you, from the atelier.</h2>
          <p>
            Open a design to choose your size. Each one is made to your
            measurements.
          </p>
        </div>
        <div className="product-grid">
          {customDesigns.map((design) => (
            <CustomDesignCard key={design.id} design={design} />
          ))}
        </div>
      </section>

      <section className="collection-hero custom-bespoke">
        <img
          src={mediaSlot("custom-detail").src}
          alt={mediaSlot("custom-detail").alt}
        />
        <div>
          <span className="eyebrow">BEYOND THE DESIGNS</span>
          <h2>
            A piece that
            <br />
            is only yours
          </h2>
          <p>
            A styling consultation or bespoke tailoring starts here. The fee
            of {money(consultationFee)} requests the appointment. Choose a day,
            then pay. The studio may reschedule that day based on availability.
          </p>
          <a
            href="#custom-booking"
            className="text-link"
            onClick={scrollTo("custom-booking")}
          >
            Book a consultation <ArrowDown size={15} />
          </a>
        </div>
      </section>

      <section id="custom-booking" className="section custom-booking">
        <div className="page-intro">
          <span className="eyebrow">BOOK AN APPOINTMENT</span>
          <h2>Tell us how to reach you.</h2>
          <p>
            The appointment fee is {money(consultationFee)}. Pay when you
            request the day.
          </p>
        </div>
        <form className="custom-form" onSubmit={book}>
            <div className="form-row">
              <label>
                Full name
                <input name="name" required autoComplete="name" />
              </label>
              <label>
                Email
                <input name="email" type="email" required autoComplete="email" />
              </label>
            </div>
            <div className="form-row">
              <label>
                Phone
                <input name="phone" type="tel" required autoComplete="tel" />
              </label>
              <div className="field">
                <label htmlFor="custom-service">Service type</label>
                <SelectMenu
                  id="custom-service"
                  name="service"
                  label="Service type"
                  required
                  placeholder="Select a service"
                  options={services.map((service) => ({
                    value: service,
                    label: service,
                  }))}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="custom-meeting">Appointment</label>
              <SelectMenu
                id="custom-meeting"
                name="meeting"
                label="Appointment"
                required
                placeholder="Online meeting or atelier visit"
                options={[
                  { value: "Online meeting", label: "Online meeting" },
                  { value: "Atelier visit", label: "Atelier visit" },
                ]}
              />
            </div>
            <div className="field">
              <span>Preferred day</span>
              <WheelDatePicker value={day} onChange={setDay} />
              <p className="custom-note">
                The studio may reschedule this day based on availability. You’ll
                get an email when it is confirmed, or if it needs to move.
              </p>
            </div>
            <label>
              <span className="field-name">
                Your vision <em>Optional</em>
              </span>
              <textarea
                name="vision"
                rows={4}
                placeholder="A note about the piece you have in mind"
              />
            </label>
            {problem && <p className="form-error">{problem}</p>}
            <button className="button dark" type="submit" disabled={sending}>
              {sending ? "Opening payment…" : "Request the appointment"}{" "}
              <ArrowRight size={16} />
            </button>
        </form>
      </section>
    </>
  );
}
