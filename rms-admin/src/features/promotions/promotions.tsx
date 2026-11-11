import { useState } from "react";
import { Plus, Tag, Megaphone, PanelTop, Trash2 } from "lucide-react";
import type { PromoCode, PromotionAdvert, Promotions as PromotionSettings } from "../../../shared/content.types";
import { defaultPromotions, emptyAdvert } from "../../../shared/promotions";
import { useContent } from "../../app/content.context";
import { Empty, Field, Modal, PageHeading } from "../../components/ui";
import { SelectMenu } from "../../components/select-menu/select-menu";
import { MediaField } from "../media/media-picker";
import { DestinationPicker } from "../../components/destination-picker";
import "./promotions.styles.css";

const freshCode = (): PromoCode => ({ code: "", type: "percentage", value: 10, minimumSpend: 0, expiresOn: "", active: true });

export function Promotions() {
  const { content, update } = useContent();
  const settings = content.promotions ?? defaultPromotions;
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  function change(fn: (settings: PromotionSettings) => void) {
    update(c => { c.promotions ??= structuredClone(defaultPromotions); fn(c.promotions); });
  }
  function edit(code?: PromoCode) {
    setOriginal(code?.code ?? null);
    setEditing(code ? { ...code } : freshCode());
    setError("");
  }
  function saveCode() {
    if (!editing) return;
    const next = { ...editing, code: editing.code.trim().toUpperCase() };
    if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(next.code)) {
      setError("Use 3–32 letters, numbers, hyphens or underscores for the code."); return;
    }
    if (settings.codes.some(c => c.code === next.code && c.code !== original)) {
      setError("That promo code already exists."); return;
    }
    if (!Number.isFinite(next.value) || next.value <= 0 || next.value > (next.type === "percentage" ? 99 : 1e7) || !Number.isFinite(next.minimumSpend) || next.minimumSpend < 0) {
      setError("Enter a positive discount and a valid minimum spend. Percentage discounts can be up to 99%."); return;
    }
    change(s => { s.codes = original ? s.codes.map(c => c.code === original ? next : c) : [...s.codes, next]; });
    setEditing(null);
  }
  return <>
    <PageHeading eyebrow="A LITTLE MORE TO LOVE" title="An invitation to discover."
      description="Create offers and give them a place in your storefront. Save and publish to make changes live." />
    <div className="promotion-stats">
      <div><Tag size={18} /><strong>{settings.codes.filter(c => c.active && (!c.expiresOn || c.expiresOn >= new Date().toISOString().slice(0, 10))).length}</strong><span>Active codes in draft</span></div>
      <div><PanelTop size={18} /><strong>{settings.banner.enabled ? "On" : "Off"}</strong><span>Announcement bar</span></div>
      <div><Megaphone size={18} /><strong>{settings.popup.enabled ? "On" : "Off"}</strong><span>Welcome popup</span></div>
    </div>
    <section className="panel promotion-codes">
      <div className="promotion-section-heading"><div><span className="eyebrow">01 / THE OFFER</span><h2>Promo codes</h2><p className="muted">One code per order, across ready-to-wear and made-to-order pieces.</p></div>
        <button className="button" onClick={() => edit()}><Plus size={16} /> Create code</button></div>
      {!settings.codes.length ? <Empty title="Your first offer starts here." description="Create a percentage or fixed-amount discount for checkout." /> :
        <div className="promotion-code-list">{[...settings.codes].reverse().map(code => {
          const expired = !!code.expiresOn && code.expiresOn < new Date().toISOString().slice(0, 10);
          return <div className="promotion-code" key={code.code}>
            <div><strong>{code.code}</strong><p>{code.type === "percentage" ? `${code.value}%` : `GH₵ ${code.value.toFixed(2)}`} off{code.minimumSpend ? ` · Spend GH₵ ${code.minimumSpend.toFixed(2)}` : " · No minimum spend"}</p><small>{code.expiresOn ? `Expires ${code.expiresOn} at the end of the day (Ghana time)` : "No expiry date"}</small></div>
            <span className={`badge ${code.active && !expired ? "green" : ""}`}>{expired ? "Expired" : code.active ? "Active" : "Inactive"}</span>
            <div className="row-actions"><button className="button secondary" onClick={() => edit(code)}>Edit</button><button className="button secondary" onClick={() => change(s => { s.codes.find(c => c.code === code.code)!.active = !code.active; })}>{code.active ? "Deactivate" : "Activate"}</button><button className="icon-button" aria-label={`Delete ${code.code}`} onClick={() => setRemoving(code.code)}><Trash2 size={16} /></button></div>
          </div>;
        })}</div>}
    </section>
    <div className="promotion-adverts">
      <AdvertEditor kind="banner" value={settings.banner} onChange={value => change(s => { s.banner = value; })} />
      <AdvertEditor kind="popup" value={settings.popup} onChange={value => change(s => { s.popup = value; })} />
    </div>
    {editing && <Modal title={original ? "Edit promo code" : "Create a promo code"} onClose={() => setEditing(null)}>
      <Field label="Promo code"><input maxLength={32} placeholder="WELCOME10" value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} /></Field>
      <Field label="Discount type"><SelectMenu label="Discount type" value={editing.type} options={[{ value: "percentage", label: "Percentage off" }, { value: "fixed", label: "Fixed amount off (GH₵)" }]} onChange={type => setEditing({ ...editing, type: type as PromoCode["type"] })} /></Field>
      <div className="form-grid"><Field label={editing.type === "percentage" ? "Discount (%)" : "Discount (GH₵)"}><input type="number" min="0.01" max={editing.type === "percentage" ? 99 : 1e7} step="0.01" value={editing.value} onChange={e => setEditing({ ...editing, value: e.target.valueAsNumber })} /></Field>
      <Field label="Minimum spend (GH₵)"><input type="number" min="0" step="0.01" value={editing.minimumSpend} onChange={e => setEditing({ ...editing, minimumSpend: e.target.valueAsNumber })} /></Field></div>
      <Field label="Expiry date" hint="Optional. Valid until the end of this day in Ghana."><input type="date" value={editing.expiresOn} onChange={e => setEditing({ ...editing, expiresOn: e.target.value })} /></Field>
      <label className="promotion-toggle"><input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} /> Active when published</label>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="modal-actions"><button className="button secondary" onClick={() => setEditing(null)}>Cancel</button><button className="button" onClick={saveCode}>Apply to draft</button></div>
    </Modal>}
    {removing && <Modal title="Delete this promo code?" onClose={() => setRemoving(null)}><p>{removing} will stop being available after you publish. Existing paid orders keep their discount.</p><div className="modal-actions"><button className="button secondary" onClick={() => setRemoving(null)}>Keep code</button><button className="button" onClick={() => { change(s => { s.codes = s.codes.filter(c => c.code !== removing); }); setRemoving(null); }}>Delete code</button></div></Modal>}
  </>;
}

function AdvertEditor({ kind, value, onChange }: { kind: "banner" | "popup"; value: PromotionAdvert; onChange: (value: PromotionAdvert) => void }) {
  const [removing, setRemoving] = useState(false);
  const popup = kind === "popup";
  const patch = (next: Partial<PromotionAdvert>) => onChange({ ...value, ...next });
  return <section className="panel form-panel promotion-advert">
    <span className="eyebrow">{popup ? "03 / THE WELCOME" : "02 / ABOVE THE WORDMARK"}</span>
    <h2>{popup ? "Welcome popup" : "Announcement bar"}</h2>
    <p className="muted">{popup ? "Appears on a fresh visit or refresh, once per page load. Skips checkout and order confirmation." : "The slim announcement above the RIVERMINDSTYLE logo on every page."}</p>
    <label className="promotion-toggle"><input type="checkbox" checked={value.enabled} onChange={e => patch({ enabled: e.target.checked })} /> Show on the storefront</label>
    {popup && <Field label="Headline"><input maxLength={120} value={value.title} onChange={e => patch({ title: e.target.value })} /></Field>}
    <Field label="Message"><textarea rows={popup ? 3 : 2} maxLength={1000} value={value.message} onChange={e => patch({ message: e.target.value })} /></Field>
    <Field label="Button text" hint="Leave blank for a message without a link."><input maxLength={60} value={value.buttonLabel} onChange={e => patch({ buttonLabel: e.target.value })} /></Field>
    <Field label="Button destination" hint="Choose a store page or a piece, collection or story ready to publish."><DestinationPicker value={value.buttonHref} onChange={buttonHref => patch({ buttonHref })} /></Field>
    {popup && <><MediaField label="Photograph (optional)" value={value.image} onChange={m => patch({ image: m.url, imageAlt: m.alt })} />{value.image && <><Field label="Image description"><input value={value.imageAlt} onChange={e => patch({ imageAlt: e.target.value })} /></Field><button className="text-button" onClick={() => patch({ image: "", imageAlt: "" })}>Remove photograph</button></>}</>}
    <div className={`promotion-preview ${popup ? "is-popup" : "is-banner"}`} aria-label={`${popup ? "Popup" : "Banner"} preview`}>
      {popup && value.image && <img src={value.image} alt={value.imageAlt} />}
      {popup && <h3>{value.title || "Your headline goes here"}</h3>}
      <p>{value.message || "Your message goes here"}</p>
      {value.buttonLabel && <span>{value.buttonLabel} →</span>}
    </div>
    <button className="button secondary" onClick={() => setRemoving(true)}><Trash2 size={15} /> Remove {popup ? "popup" : "banner"}</button>
    {removing && <Modal title={`Remove the ${popup ? "popup" : "banner"}?`} onClose={() => setRemoving(false)}><p>This clears the advertisement from your draft. Publish to remove it from the storefront.</p><div className="modal-actions"><button className="button secondary" onClick={() => setRemoving(false)}>Keep advertisement</button><button className="button" onClick={() => { onChange({ ...emptyAdvert }); setRemoving(false); }}>Remove advertisement</button></div></Modal>}
  </section>;
}
