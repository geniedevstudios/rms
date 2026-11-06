import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { siteContent } from "../../content/content";
import { defaultPromotions } from "../../../../rms-admin/shared/promotions";
import { Link } from "../../routing/link";
import { Overlay } from "../../components/overlay/overlay";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { useRoute } from "../../routing/use-route";
import "./promotions.styles.css";

export function AnnouncementBar() {
  const banner = (siteContent.promotions ?? defaultPromotions).banner;
  if (!banner.enabled) return null;
  return <div className="announcement"><span>{banner.message}</span>{banner.buttonLabel &&
    <Link to={banner.buttonHref}>{banner.buttonLabel} <ArrowRight size={12} /></Link>}
  </div>;
}

export function PromotionPopup() {
  const popup = siteContent.promotions?.popup;
  const route = useRoute();
  const { dialog } = useDialogs();
  const excluded = /^\/(checkout|confirmation)(\/|\?|$)/.test(route);
  const [dismissed, setDismissed] = useState(excluded);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!popup?.enabled || dismissed || excluded || dialog) return;
    const timer = window.setTimeout(() => setReady(true), 900);
    return () => window.clearTimeout(timer);
  }, [popup?.enabled, dismissed, excluded, dialog]);
  if (!popup?.enabled || dismissed || excluded || dialog || !ready) return null;
  return <Overlay title="An invitation from RMS" popup onClose={() => setDismissed(true)}>
    <div className="store-promotion">
      {popup.image && <img src={popup.image} alt={popup.imageAlt} />}
      <div className="store-promotion-copy"><span className="eyebrow">RIVERMINDSTYLE</span>
        <h2>{popup.title}</h2><p>{popup.message}</p>
        {popup.buttonLabel && <Link className="button dark" to={popup.buttonHref}>{popup.buttonLabel}<ArrowRight size={16} /></Link>}
        <button className="text-link" onClick={() => setDismissed(true)}>Continue exploring</button>
      </div>
    </div>
  </Overlay>;
}
