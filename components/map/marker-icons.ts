import L from "leaflet";
import { DIETARY, type DietaryKey, primaryDietary, DIETARY_ORDER } from "@/lib/dietary";

function svgMarker(cats: DietaryKey[], verified: boolean): string {
  if (cats.length === 0) {
    return `
      <svg width="26" height="32" viewBox="0 0 26 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="13" cy="13" r="10" fill="#0f0f0f" stroke="#6b7280" stroke-width="1.5"/>
      </svg>`;
  }

  if (cats.length === 1) {
    const c = DIETARY[cats[0]].color;
    const verifiedDot = verified
      ? `<circle cx="20" cy="6" r="3.5" fill="#22c55e" stroke="#000" stroke-width="1.2"/>`
      : "";
    return `
      <svg width="26" height="32" viewBox="0 0 26 32" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="13" cy="29" rx="4" ry="1.4" fill="#000" opacity="0.6"/>
        <circle cx="13" cy="13" r="10" fill="${c}" stroke="#000" stroke-width="1.5"/>
        <circle cx="13" cy="13" r="3.2" fill="#ffffff" fill-opacity="0.85"/>
        ${verifiedDot}
      </svg>`;
  }

  // Multi-category: split vertical halves (max 2 colors shown)
  const sorted = DIETARY_ORDER.filter((k) => cats.includes(k));
  const c1 = DIETARY[sorted[0]].color;
  const c2 = DIETARY[sorted[1]].color;
  const verifiedDot = verified
    ? `<circle cx="20" cy="6" r="3.5" fill="#22c55e" stroke="#000" stroke-width="1.2"/>`
    : "";
  return `
    <svg width="26" height="32" viewBox="0 0 26 32" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="13" cy="29" rx="4" ry="1.4" fill="#000" opacity="0.6"/>
      <defs>
        <clipPath id="half-left"><rect x="0" y="0" width="13" height="26"/></clipPath>
        <clipPath id="half-right"><rect x="13" y="0" width="13" height="26"/></clipPath>
      </defs>
      <circle cx="13" cy="13" r="10" fill="${c1}" stroke="#000" stroke-width="1.5" clip-path="url(#half-left)"/>
      <circle cx="13" cy="13" r="10" fill="${c2}" stroke="#000" stroke-width="1.5" clip-path="url(#half-right)"/>
      <line x1="13" y1="3" x2="13" y2="23" stroke="#000" stroke-width="1.2"/>
      <circle cx="13" cy="13" r="2.8" fill="#ffffff" fill-opacity="0.85"/>
      ${verifiedDot}
    </svg>`;
}

export function makeRestaurantIcon(
  cats: DietaryKey[],
  opts: { verified?: boolean; active?: boolean } = {}
): L.DivIcon {
  const primary = primaryDietary(cats);
  const verified = !!opts.verified;
  const html = `
    <div class="pm-marker ${opts.active ? "pm-marker-active" : ""}"
         data-primary="${primary ?? "none"}">
      ${svgMarker(cats, verified)}
    </div>`;

  return L.divIcon({
    className: "pm-marker-wrap",
    html,
    iconSize: [26, 32],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24],
  });
}

export function makeClusterIcon(cluster: { getChildCount(): number }) {
  const count = cluster.getChildCount();
  const sizeClass =
    count < 10 ? "marker-cluster-custom-sm" : count < 50 ? "marker-cluster-custom-md" : "marker-cluster-custom-lg";
  return L.divIcon({
    html: `<div class="marker-cluster-custom ${sizeClass}"><span>${count}</span></div>`,
    className: "pm-cluster",
    iconSize: L.point(40, 40, true),
  });
}
