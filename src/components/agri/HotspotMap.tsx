import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";

import { severityColor, severityWeight, type HotspotPoint } from "@/lib/agri/hotspots";

/**
 * Leaflet surveillance map. Loaded lazily inside <ClientOnly> — Leaflet touches
 * `window` at import time, so it is imported dynamically after hydration.
 */
export default function HotspotMap({
  points,
  center,
  heatmap,
}: {
  points: HotspotPoint[];
  center: { lat: number; lng: number };
  heatmap: boolean;
}) {
  const holder = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !holder.current || map.current) return;
      const instance = L.map(holder.current, { scrollWheelZoom: true }).setView(
        [center.lat, center.lng],
        7,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(instance);
      layer.current = L.layerGroup().addTo(instance);
      map.current = instance;
      window.setTimeout(() => instance.invalidateSize(), 120);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      layer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (map.current) map.current.setView([center.lat, center.lng], map.current.getZoom());
  }, [center.lat, center.lng]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !layer.current) return;
      layer.current.clearLayers();
      for (const p of points) {
        const weight = severityWeight(p.severity);
        const color = severityColor(p.severity);
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: heatmap ? 8 + weight * 6 : 5 + weight * 2,
          color: p.own ? "#1f6f3f" : color,
          weight: p.own ? 2 : 1,
          fillColor: color,
          fillOpacity: heatmap ? 0.22 : 0.75,
        });
        marker.bindPopup(
          `<strong>${escapeHtml(p.name)}</strong><br/>` +
            `${p.kind === "disease" ? "Disease" : "Pest"} · ${escapeHtml(p.severity)}<br/>` +
            `Crop: ${escapeHtml(p.crop)}<br/>` +
            `${new Date(p.date).toLocaleDateString()}${p.own ? "<br/><em>Your field</em>" : ""}`,
        );
        marker.addTo(layer.current);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [points, heatmap]);

  return <div ref={holder} className="h-[26rem] w-full rounded-[var(--radius-lg)]" />;
}

function escapeHtml(value: string) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
