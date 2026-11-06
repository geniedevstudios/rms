import "./confirmation.styles.css";
import { type Order } from "../../types/order";
import { Check, ArrowRight } from "lucide-react";
import { money } from "../../lib/format-currency";
import { findPiece } from "../../data/catalog";
import { resolveColourway } from "../../data/size-guide";
import { pieceLine } from "../../features/products/colour";
import { Link } from "../../routing/link";
import {
  type AppointmentReceipt,
  formatAppointmentDay,
} from "./appointment";

export function Confirmation({
  order,
  appointment,
}: {
  order?: Order;
  appointment?: AppointmentReceipt | null;
}) {
  if (appointment !== undefined) return <AppointmentConfirmation appointment={appointment} />;
  return (
    <section className="confirmation section">
      <div className="confirmation-icon">
        <Check size={26} />
      </div>
      <span className="eyebrow">
        {order ? "YOUR ORDER IS CONFIRMED" : "ORDER NOT FOUND"}
      </span>
      <h1>{order ? "A beautiful choice." : "Let’s find your next piece."}</h1>
      <p>
        {order
          ? "Thank you. Your payment is confirmed."
          : "This order could not be found."}
      </p>
      {order && (
        <div className="confirmation-details">
          <span>{order.id}</span>
          <strong>{money(order.total)}</strong>
          {!!order.discount && <p>{order.promoCode} · You saved {money(order.discount)}.</p>}
          {order.items.map((item) => {
            const p = findPiece(item.productId)!;
            const colourway = resolveColourway(p, item.colourwayId);
            return (
              <div className="confirmation-item" key={`${p.id}-${item.colourwayId || ""}-${item.size}`}>
                <img src={item.image || colourway?.image || p.image} alt={p.name} />
                <div>
                  <strong>{p.name}</strong>
                  <span>{pieceLine(item.color || colourway?.color, item.size, item.quantity)}</span>
                </div>
                <span>{money(p.price * item.quantity)}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="confirmation-actions">
        {order && (
          <Link to="/orders" className="text-link">
            Your orders
          </Link>
        )}
        <Link to="/shop" className="button dark">
          Continue exploring <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

function AppointmentConfirmation({ appointment }: { appointment: AppointmentReceipt | null }) {
  return (
    <section className="confirmation section">
      <div className="confirmation-icon">
        <Check size={26} />
      </div>
      <span className="eyebrow">
        {appointment ? "PAYMENT CONFIRMED" : "APPOINTMENT NOT FOUND"}
      </span>
      <h1>{appointment ? "The day is with the studio." : "Let’s find that request."}</h1>
      <p>
        {appointment
          ? "Thank you. Your payment is confirmed. This is not yet a confirmed appointment. The studio may reschedule this day based on availability, and will email you when it is confirmed or if it needs to move."
          : "This appointment could not be found."}
      </p>
      {appointment && (
        <div className="confirmation-details">
          <span>{appointment.id}</span>
          <strong>{money(appointment.fee)}</strong>
          <div className="confirmation-line">
            <span>Service</span>
            <strong>{appointment.service}</strong>
          </div>
          <div className="confirmation-line">
            <span>Meeting</span>
            <strong>{appointment.meeting}</strong>
          </div>
          <div className="confirmation-line">
            <span>Day</span>
            <strong>{formatAppointmentDay(appointment.appointment)}</strong>
          </div>
          {appointment.vision && (
            <div className="confirmation-line">
              <span>Vision</span>
              <strong>{appointment.vision}</strong>
            </div>
          )}
        </div>
      )}
      <div className="confirmation-actions">
        {appointment && (
          <Link to="/custom" className="text-link">
            Custom
          </Link>
        )}
        <Link to="/shop" className="button dark">
          Continue exploring <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
