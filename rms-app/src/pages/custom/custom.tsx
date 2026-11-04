import { mediaSlot } from "../../content/content";
import "../collection/collection.styles.css";
import "./custom.styles.css";
import { type FormEvent, useState } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { SelectMenu } from "../../components/select-menu/select-menu";
import { consultationFee, customDesigns } from "../../data/custom-designs";
import { money } from "../../lib/format-currency";
import { CustomDesignCard } from "./custom-design-card";

const services = [
  ...customDesigns.map((design) => design.name),
  "A bespoke piece",
];

export function Custom() {
  const [booked, setBooked] = useState(false);

  const scrollTo = (id: string) => (event: { preventDefault: () => void }) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const book = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBooked(true);
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
            Want something that is not one of the designs above. A bespoke
            piece starts with a conversation. A consultation fee of{" "}
            {money(consultationFee)} holds your appointment. It is a down
            payment on the piece, taken when the work begins. Meet online, or
            come to the atelier.
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
            The consultation fee is {money(consultationFee)}.
          </p>
        </div>
        {booked ? (
          <p className="custom-confirmed" role="status">
            Your appointment request is in. We will be in touch to confirm an
            online meeting or a visit to the atelier.
          </p>
        ) : (
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
            <button className="button dark" type="submit">
              Request the appointment <ArrowRight size={16} />
            </button>
          </form>
        )}
      </section>
    </>
  );
}
