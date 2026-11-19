import { type ReactNode } from "react";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { Link } from "../../routing/link";
import "./legal.styles.css";

function NotePage({
  eyebrow,
  title,
  lead,
  sections,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  sections: { heading: string; body: ReactNode[] }[];
}) {
  return (
    <section className="section legal-page">
      <div className="page-intro">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{lead}</p>
      </div>
      <div className="legal-body">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </section>
        ))}
        <p>
          Questions can come to{" "}
          <a href="mailto:hello@rivermindstyle.com">hello@rivermindstyle.com</a>.
        </p>
      </div>
    </section>
  );
}

export function Privacy() {
  return (
    <NotePage
      eyebrow="LEGAL"
      title="Privacy"
      lead="How RIVERMINDSTYLE looks after what you share with us."
      sections={[
        {
          heading: "What you give us",
          body: [
            "When you create an account, place an order, or request an appointment, we keep the details you type in: your name, email, phone, and the notes that belong with that order or visit.",
            "Messages you send to hello@rivermindstyle.com stay with the studio so we can reply.",
          ],
        },
        {
          heading: "On this device",
          body: [
            "Your bag, saved pieces, and a copy of your orders stay in this browser, so the shop can remember them when you come back.",
          ],
        },
        {
          heading: "Payment",
          body: [
            "Orders and appointments are paid through Paystack. Paystack receives what it needs to take the payment, including your email, phone, and the amount.",
          ],
        },
        {
          heading: "What we do not do",
          body: [
            "We do not sell your details. We use them to make the piece, keep the appointment, and answer you.",
          ],
        },
      ]}
    />
  );
}

export function Terms() {
  return (
    <NotePage
      eyebrow="LEGAL"
      title="Terms"
      lead="The understanding between you and RIVERMINDSTYLE when you shop, book, or visit."
      sections={[
        {
          heading: "Orders",
          body: [
            "Placing an order is a request to buy the pieces in your bag at the prices shown, in Ghana cedis.",
            "Payment is taken through Paystack before an order is confirmed. Delivery is complimentary.",
          ],
        },
        {
          heading: "Appointments",
          body: [
            "A styling consultation or bespoke appointment is GH₵ 500. Paying holds the request. It is not yet a confirmed time.",
            "The studio confirms a time on the day you asked for, and may move it when that day is not available.",
          ],
        },
        {
          heading: "The pieces",
          body: [
            "Ready-to-wear is sold as shown. Made-to-order and bespoke pieces are made from the measurements and notes you give us.",
            "If a piece arrives and it is not as described, write to us and we will look at it with you.",
          ],
        },
        {
          heading: "The studio",
          body: [
            "The house is on Vanilla Street, Adenta, Accra. A visit is arranged ahead. Hours are Monday–Saturday, 10 am–6 pm.",
          ],
        },
        {
          heading: "The work",
          body: [
            "Photographs, designs, and writing on this site belong to RIVERMINDSTYLE.",
          ],
        },
      ]}
    />
  );
}

export function Contact() {
  return (
    <NotePage
      eyebrow="CLIENT CARE"
      title="Contact us"
      lead="A note, a visit, or an appointment. The studio is here."
      sections={[
        {
          heading: "Write to us",
          body: [
            <>
              Write to{" "}
              <a href="mailto:hello@rivermindstyle.com">hello@rivermindstyle.com</a>.
              We would love to hear from you.
            </>,
          ],
        },
        {
          heading: "The studio",
          body: [
            "Vanilla Street, Adenta, Accra, Ghana. Monday–Saturday, 10 am–6 pm. A visit is arranged ahead.",
            <Link to="/about" className="text-link">Find the studio</Link>,
          ],
        },
        {
          heading: "An appointment",
          body: [
            "Styling consultations and bespoke tailoring are arranged ahead.",
            <Link to="/custom" className="text-link">Book an appointment</Link>,
          ],
        },
      ]}
    />
  );
}

export function Delivery() {
  const { openDialog } = useDialogs();
  return (
    <NotePage
      eyebrow="CLIENT CARE"
      title="Delivery & returns"
      lead="How a piece leaves the studio, and what to do if it is not as you expected."
      sections={[
        {
          heading: "Delivery",
          body: [
            "Delivery is complimentary.",
            "An order is confirmed once payment is taken through Paystack.",
          ],
        },
        {
          heading: "Made for you",
          body: [
            "Ready-to-wear leaves as it is shown. A made-to-order piece begins once your measurements are confirmed, and the time is shown on that piece.",
          ],
        },
        {
          heading: "Returns & Exchanges",
          body: [
            <>
              If you wish to exchange an item, please contact us via{" "}
              <a href="mailto:hello@rivermindstyle.com">email</a> or{" "}
              <a href="https://wa.me/233544248058" target="_blank" rel="noopener noreferrer">WhatsApp</a>{" "}
              within five days of receiving your order. Kindly include your
              order number and specify the item you wish to exchange.
            </>,
            "Once your request has been reviewed and approved, the item must be returned within 10 business days, following the instructions provided by our team. Returns received outside this period will not be accepted.",
            "All return shipping costs are the responsibility of the client.",
            "To qualify for an exchange, items must be returned in their original condition: unworn, unwashed, clean and unaltered, with all original tags attached and packaging intact.",
            "Every returned item is subject to inspection. Rivermindstyle reserves the right to decline exchanges for items that do not meet these conditions.",
            <>
              We encourage clients to consult our{" "}
              <button
                type="button"
                className="legal-inline-link"
                onClick={() => openDialog({ type: "size-guide" })}
              >
                Size Guide
              </button>{" "}
              before placing an order. A fit preference or sizing issue arising
              from the size selected does not, in itself, constitute a product
              defect.
            </>,
          ],
        },
        {
          heading: "Exchanges & Store Credit",
          body: [
            "Approved change-of-mind or fit-related returns will be handled through an exchange or store credit, subject to availability and approval. No cash refunds will be issued for these returns. Rivermindstyle does offer exchanges or store credit for items on Sale.",
          ],
        },
        {
          heading: "If something is not right",
          body: [
            "If a piece arrives and it is not as described, write to us and we will look at it with you.",
          ],
        },
      ]}
    />
  );
}
