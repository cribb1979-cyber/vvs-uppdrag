// Ritverktyg för principskisserna (SVG som strängar). Används av
// lib/bockSkisser.ts och lib/examSkisser.ts så att alla skisser ser likadana ut.

export const B = 600;
export const H = 380;
export const FONT = "DejaVu Sans, Arial, Helvetica, sans-serif";
export const NAVY = "#16324f";
export const MUTED = "#5b6b80";
export const ORANGE = "#d9711c";
export const BLUE = "#1f5fbf";
export const GREEN = "#2e8540";
export const LIGHT = "#c8d2df";

export type P = [number, number];

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function text(x: number, y: number, s: string, o: { size?: number; color?: string; bold?: boolean; anchor?: "start" | "middle" | "end"; rotate?: number } = {}): string {
  const rot = o.rotate ? ` transform="rotate(${o.rotate} ${x} ${y})"` : "";
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${o.size ?? 13}"${o.bold ? ' font-weight="bold"' : ""} fill="${o.color ?? NAVY}" text-anchor="${o.anchor ?? "start"}"${rot}>${esc(s)}</text>`;
}

/** Polylinje med rundade hörn – ser ut som ett bockat rör. */
export function rorPath(punkter: P[], r = 22): string {
  let d = `M${punkter[0][0]},${punkter[0][1]}`;
  for (let i = 1; i < punkter.length - 1; i++) {
    const [px, py] = punkter[i - 1];
    const [cx, cy] = punkter[i];
    const [nx, ny] = punkter[i + 1];
    const l1 = Math.hypot(cx - px, cy - py);
    const l2 = Math.hypot(nx - cx, ny - cy);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const a: P = [cx - ((cx - px) / l1) * rr, cy - ((cy - py) / l1) * rr];
    const b: P = [cx + ((nx - cx) / l2) * rr, cy + ((ny - cy) / l2) * rr];
    d += ` L${a[0].toFixed(1)},${a[1].toFixed(1)} Q${cx},${cy} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
  }
  const sista = punkter[punkter.length - 1];
  return d + ` L${sista[0]},${sista[1]}`;
}

export function ror(punkter: P[], o: { r?: number; farg?: string; bredd?: number } = {}): string {
  const d = rorPath(punkter, o.r);
  return `<path d="${d}" fill="none" stroke="${o.farg ?? NAVY}" stroke-width="${o.bredd ?? 11}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Tunn centrumlinje ovanpå röret. */
export function centrum(punkter: P[], r?: number): string {
  return `<path d="${rorPath(punkter, r)}" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.8"/>`;
}

export function pil(x: number, y: number, vinkel: number, farg: string): string {
  const s = 8;
  const a = vinkel;
  const p1: P = [x - s * Math.cos(a - 0.4), y - s * Math.sin(a - 0.4)];
  const p2: P = [x - s * Math.cos(a + 0.4), y - s * Math.sin(a + 0.4)];
  return `<path d="M${x.toFixed(1)},${y.toFixed(1)} L${p1[0].toFixed(1)},${p1[1].toFixed(1)} L${p2[0].toFixed(1)},${p2[1].toFixed(1)} Z" fill="${farg}"/>`;
}

/** Måttlinje med pilar i båda ändar och text på mitten. */
export function matt(a: P, b: P, etikett: string, o: { farg?: string; textDx?: number; textDy?: number; anchor?: "start" | "middle" | "end"; size?: number } = {}): string {
  const farg = o.farg ?? ORANGE;
  const v = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const mx = (a[0] + b[0]) / 2 + (o.textDx ?? 0);
  const my = (a[1] + b[1]) / 2 + (o.textDy ?? -8);
  return (
    `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${farg}" stroke-width="1.8"/>` +
    pil(b[0], b[1], v, farg) +
    pil(a[0], a[1], v + Math.PI, farg) +
    text(mx, my, etikett, { size: o.size ?? 13, color: farg, bold: true, anchor: o.anchor ?? "middle" })
  );
}

export function hjalplinje(a: P, b: P): string {
  return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${MUTED}" stroke-width="1" stroke-dasharray="4 4"/>`;
}

/** Märke tvärs över röret (märkpenna). */
export function marke(x: number, y: number, vinkel: number, etikett?: string, o: { dx?: number; dy?: number; anchor?: "start" | "middle" | "end" } = {}): string {
  const n = vinkel + Math.PI / 2;
  const l = 13;
  const a: P = [x + Math.cos(n) * l, y + Math.sin(n) * l];
  const b: P = [x - Math.cos(n) * l, y - Math.sin(n) * l];
  return (
    `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${ORANGE}" stroke-width="3.5" stroke-linecap="round"/>` +
    (etikett ? text(x + (o.dx ?? 0), y + (o.dy ?? 30), etikett, { size: 12, color: ORANGE, bold: true, anchor: o.anchor ?? "middle" }) : "")
  );
}

/** Vinkelbåge från riktning v1 till v2 (radianer) med etikett. */
export function vinkelbage(c: P, r: number, v1: number, v2: number, etikett: string, farg = BLUE): string {
  const a: P = [c[0] + r * Math.cos(v1), c[1] + r * Math.sin(v1)];
  const b: P = [c[0] + r * Math.cos(v2), c[1] + r * Math.sin(v2)];
  const sweep = v2 > v1 ? 1 : 0;
  const mid = (v1 + v2) / 2;
  const t: P = [c[0] + (r + 16) * Math.cos(mid), c[1] + (r + 16) * Math.sin(mid) + 5];
  return (
    `<path d="M${a[0].toFixed(1)},${a[1].toFixed(1)} A${r},${r} 0 0 ${sweep} ${b[0].toFixed(1)},${b[1].toFixed(1)}" fill="none" stroke="${farg}" stroke-width="2"/>` +
    text(t[0], t[1], etikett, { size: 14, color: farg, bold: true, anchor: "middle" })
  );
}

export function nummer(x: number, y: number, n: number): string {
  return `<circle cx="${x}" cy="${y}" r="11" fill="${ORANGE}"/>` + text(x, y + 4.5, String(n), { size: 12, color: "#ffffff", bold: true, anchor: "middle" });
}

export function ruta(titel: string, underrubrik: string, innehall: string, fot: string, h = H): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${B} ${h}">` +
    `<rect width="${B}" height="${h}" fill="#f7f9fc"/>` +
    text(24, 34, titel, { size: 18, bold: true }) +
    text(24, 54, underrubrik, { size: 12, color: MUTED }) +
    innehall +
    `<line x1="24" y1="${h - 30}" x2="${B - 24}" y2="${h - 30}" stroke="${LIGHT}" stroke-width="1"/>` +
    text(24, h - 12, fot, { size: 10.5, color: MUTED }) +
    `</svg>`
  );
}

export const FOT = "Principskiss, inte skalenlig. Kontrollera alltid mot ditt bockverktygs anvisning.";
