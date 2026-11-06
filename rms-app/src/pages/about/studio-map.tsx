import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

const region = { lat: 5.6037, lng: -0.187 };
const studio = { lat: 5.710471, lng: -0.161357 };
const closeZoom = 16;

export function StudioMap({ focused, onSelect }: { focused: boolean; onSelect: () => void }) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const element = node.current;
    if (!element) return;
    const map = L.map(element, {
      scrollWheelZoom: true,
      touchZoom: true,
      zoomControl: false,
      attributionControl: false,
    }).setView([region.lat, region.lng], 4);
    mapRef.current = map;
    const labels = map.createPane("labels");
    labels.style.zIndex = "450";
    labels.style.pointerEvents = "none";
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      maxNativeZoom: 18,
    }).addTo(map);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      pane: "labels",
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    const marker = L.marker([studio.lat, studio.lng], {
      title: "RIVERMINDSTYLE, Vanilla Street, Adenta",
      keyboard: true,
      icon: L.divIcon({
        className: "studio-pin",
        html: `<span class="studio-pin-shape"><svg viewBox="0 0 64 96" aria-hidden="true"><path fill="#2c2c2c" d="M32 0C14.3 0 0 14.3 0 32c0 24 32 64 32 64s32-40 32-64C64 14.3 49.7 0 32 0z"/><circle cx="32" cy="31" r="22" fill="#fff"/></svg><span class="studio-pin-logo"><img src="/favicon.png" alt="" /></span></span>`,
        iconSize: [40, 60],
        iconAnchor: [20, 60],
      }),
    }).addTo(map);
    marker.on("click", () => {
      map.flyTo([studio.lat, studio.lng], closeZoom, { duration: 1.4 });
      onSelectRef.current();
    });
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => {
      window.cancelAnimationFrame(frame);
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (focused) map.flyTo([studio.lat, studio.lng], closeZoom, { duration: 1.4 });
    else if (map.getZoom() !== 4) map.flyTo([region.lat, region.lng], 4, { duration: 1.4 });
  }, [focused]);

  return <div ref={node} className="studio-map" role="region" aria-label="Map of the studio on Vanilla Street, Adenta" />;
}
