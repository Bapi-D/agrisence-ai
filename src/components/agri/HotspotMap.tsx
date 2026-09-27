import { useEffect, useRef } from "react";
import type {
  Map as LeafletMap,
  LayerGroup,
  Marker,
} from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  severityColor,
  severityWeight,
  type HotspotPoint,
} from "@/lib/agri/hotspots";

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

  const normalLayer = useRef<LayerGroup | null>(null);
  const heatLayer = useRef<LayerGroup | null>(null);

  /*
   * Create Leaflet map
   */
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = await import("leaflet");

      if (
        cancelled ||
        !holder.current ||
        map.current
      ) {
        return;
      }

      const instance = L.map(holder.current, {
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView(
        [center.lat, center.lng],
        7,
      );

      L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            "&copy; OpenStreetMap contributors",
          maxZoom: 18,
        },
      ).addTo(instance);

      /*
       * Normal report markers
       */
      normalLayer.current =
        L.layerGroup().addTo(instance);

      /*
       * Heatmap layer
       */
      heatLayer.current =
        L.layerGroup().addTo(instance);

      map.current = instance;

      window.setTimeout(() => {
        instance.invalidateSize();
      }, 150);
    })();

    return () => {
      cancelled = true;

      map.current?.remove();

      map.current = null;
      normalLayer.current = null;
      heatLayer.current = null;
    };

    // Map is created only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Update center
   */
  useEffect(() => {
    if (!map.current) return;

    map.current.setView(
      [center.lat, center.lng],
      map.current.getZoom(),
      {
        animate: false,
      },
    );
  }, [center.lat, center.lng]);

  /*
   * Render heatmap / normal markers
   */
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = await import("leaflet");

      if (
        cancelled ||
        !map.current ||
        !normalLayer.current ||
        !heatLayer.current
      ) {
        return;
      }

      normalLayer.current.clearLayers();
      heatLayer.current.clearLayers();

      /*
       * ============================================================
       * HEATMAP MODE
       * ============================================================
       */
      if (heatmap) {
        /*
         * Draw every hotspot as a large radial gradient.
         *
         * The gradient itself creates:
         * center -> strong color
         * middle -> lighter color
         * outside -> transparent
         */
        for (const point of points) {
          const weight = Math.max(
            1,
            Math.min(
              3,
              severityWeight(point.severity),
            ),
          );

          const color =
            weight >= 3
              ? "239, 68, 68"
              : weight === 2
                ? "245, 180, 35"
                : "34, 197, 94";

          const size =
            weight >= 3
              ? 220
              : weight === 2
                ? 190
                : 160;

          const opacity =
            weight >= 3
              ? 0.88
              : weight === 2
                ? 0.72
                : 0.62;

          const icon =
            L.divIcon({
              className:
                "agrisense-heatmap-point",
              iconSize: [size, size],
              iconAnchor: [
                size / 2,
                size / 2,
              ],
              html: `
                <div
                  style="
                    width:${size}px;
                    height:${size}px;
                    border-radius:50%;
                    pointer-events:none;
                    background:
                      radial-gradient(
                        circle,
                        rgba(${color}, ${opacity}) 0%,
                        rgba(${color}, 0.55) 20%,
                        rgba(${color}, 0.30) 42%,
                        rgba(${color}, 0.12) 64%,
                        rgba(${color}, 0) 78%
                      );
                    filter: blur(1px);
                    transform: translateZ(0);
                  "
                ></div>
              `,
            });

          const marker =
            L.marker(
              [point.lat, point.lng],
              {
                icon,
                interactive: true,
                zIndexOffset:
                  weight * 10,
              },
            );

          marker.bindPopup(
            `
              <div style="min-width:180px">
                <strong>
                  ${escapeHtml(point.name)}
                </strong>
                <br/>
                ${
                  point.kind === "disease"
                    ? "Disease"
                    : "Pest"
                }
                ·
                ${escapeHtml(point.severity)}
                <br/>
                Crop:
                ${escapeHtml(point.crop)}
                <br/>
                ${new Date(
                  point.date,
                ).toLocaleDateString()}
                ${
                  point.own
                    ? "<br/><em>Your field</em>"
                    : ""
                }
              </div>
            `,
          );

          marker.addTo(
            heatLayer.current!,
          );
        }

        /*
         * Add a small center indicator for
         * the user's own farm.
         */
        const ownPoint =
          points.find((p) => p.own);

        if (ownPoint) {
          const ownIcon =
            L.divIcon({
              className:
                "agrisense-own-field",
              iconSize: [18, 18],
              iconAnchor: [9, 9],
              html: `
                <div
                  style="
                    width:18px;
                    height:18px;
                    border-radius:50%;
                    background:#16a34a;
                    border:3px solid white;
                    box-shadow:
                      0 2px 8px rgba(0,0,0,.35);
                  "
                ></div>
              `,
            });

          const ownMarker =
            L.marker(
              [ownPoint.lat, ownPoint.lng],
              {
                icon: ownIcon,
                zIndexOffset: 1000,
              },
            );

          ownMarker.bindPopup(
            `
              <strong>
                ${escapeHtml(ownPoint.name)}
              </strong>
              <br/>
              <em>Your field</em>
            `,
          );

          ownMarker.addTo(
            normalLayer.current!,
          );
        }

        return;
      }

      /*
       * ============================================================
       * NORMAL MAP MODE
       * ============================================================
       */
      for (const point of points) {
        const weight =
          severityWeight(
            point.severity,
          );

        const color =
          severityColor(
            point.severity,
          );

        const marker =
          L.circleMarker(
            [
              point.lat,
              point.lng,
            ],
            {
              radius:
                5 + weight * 2,
              color: point.own
                ? "#1f6f3f"
                : color,
              weight:
                point.own ? 2 : 1,
              fillColor: color,
              fillOpacity: 0.75,
            },
          );

        marker.bindPopup(
          `
            <strong>
              ${escapeHtml(point.name)}
            </strong>
            <br/>
            ${
              point.kind === "disease"
                ? "Disease"
                : "Pest"
            }
            ·
            ${escapeHtml(point.severity)}
            <br/>
            Crop:
            ${escapeHtml(point.crop)}
            <br/>
            ${new Date(
              point.date,
            ).toLocaleDateString()}
            ${
              point.own
                ? "<br/><em>Your field</em>"
                : ""
            }
          `,
        );

        marker.addTo(
          normalLayer.current!,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [points, heatmap]);

  /*
   * Redraw / resize map correctly when
   * browser size changes.
   */
  useEffect(() => {
    const instance = map.current;

    if (!instance) return;

    const resizeObserver =
      new ResizeObserver(() => {
        instance.invalidateSize();
      });

    if (holder.current) {
      resizeObserver.observe(
        holder.current,
      );
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={holder}
      className="
        h-[26rem]
        w-full
        overflow-hidden
        rounded-[var(--radius-lg)]
      "
    />
  );
}

function escapeHtml(value: string) {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!,
  );
}