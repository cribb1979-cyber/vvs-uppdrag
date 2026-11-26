// Principskisser för bockövningarna, ritade som SVG i appen.
//
// Varje skiss visar ett räkneexempel med riktiga mått – samma siffror som
// övningens förklaring i lib/bockVvs.ts. Ändrar du ett mått i texten, ändra
// det här också. Skisserna är principskisser, inte skalenliga ritningar.

export type BockSkissId =
  | "bock-90"
  | "bock-45"
  | "bock-offset"
  | "bock-u"
  | "bock-ritning"
  | "bock-tunnvaggig"
  | "bock-pex"
  | "bock-tathet"
  | "bock-insida"
  | "bock-s";

const B = 600;
const H = 380;
const FONT = "DejaVu Sans, Arial, Helvetica, sans-serif";
const NAVY = "#16324f";
const MUTED = "#5b6b80";
const ORANGE = "#d9711c";
const BLUE = "#1f5fbf";
const GREEN = "#2e8540";
const LIGHT = "#c8d2df";

type P = [number, number];

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function text(x: number, y: number, s: string, o: { size?: number; color?: string; bold?: boolean; anchor?: "start" | "middle" | "end"; rotate?: number } = {}): string {
  const rot = o.rotate ? ` transform="rotate(${o.rotate} ${x} ${y})"` : "";
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${o.size ?? 13}"${o.bold ? ' font-weight="bold"' : ""} fill="${o.color ?? NAVY}" text-anchor="${o.anchor ?? "start"}"${rot}>${esc(s)}</text>`;
}

/** Polylinje med rundade hörn – ser ut som ett bockat rör. */
function rorPath(punkter: P[], r = 22): string {
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

function ror(punkter: P[], o: { r?: number; farg?: string; bredd?: number } = {}): string {
  const d = rorPath(punkter, o.r);
  return `<path d="${d}" fill="none" stroke="${o.farg ?? NAVY}" stroke-width="${o.bredd ?? 11}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Tunn centrumlinje ovanpå röret. */
function centrum(punkter: P[], r?: number): string {
  return `<path d="${rorPath(punkter, r)}" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.8"/>`;
}

function pil(x: number, y: number, vinkel: number, farg: string): string {
  const s = 8;
  const a = vinkel;
  const p1: P = [x - s * Math.cos(a - 0.4), y - s * Math.sin(a - 0.4)];
  const p2: P = [x - s * Math.cos(a + 0.4), y - s * Math.sin(a + 0.4)];
  return `<path d="M${x.toFixed(1)},${y.toFixed(1)} L${p1[0].toFixed(1)},${p1[1].toFixed(1)} L${p2[0].toFixed(1)},${p2[1].toFixed(1)} Z" fill="${farg}"/>`;
}

/** Måttlinje med pilar i båda ändar och text på mitten. */
function matt(a: P, b: P, etikett: string, o: { farg?: string; textDx?: number; textDy?: number; anchor?: "start" | "middle" | "end"; size?: number } = {}): string {
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

function hjalplinje(a: P, b: P): string {
  return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${MUTED}" stroke-width="1" stroke-dasharray="4 4"/>`;
}

/** Märke tvärs över röret (märkpenna). */
function marke(x: number, y: number, vinkel: number, etikett?: string, o: { dx?: number; dy?: number; anchor?: "start" | "middle" | "end" } = {}): string {
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
function vinkelbage(c: P, r: number, v1: number, v2: number, etikett: string, farg = BLUE): string {
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

function nummer(x: number, y: number, n: number): string {
  return `<circle cx="${x}" cy="${y}" r="11" fill="${ORANGE}"/>` + text(x, y + 4.5, String(n), { size: 12, color: "#ffffff", bold: true, anchor: "middle" });
}

function ruta(titel: string, underrubrik: string, innehall: string, fot: string, h = H): string {
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

const FOT = "Principskiss, inte skalenlig. Kontrollera alltid mot ditt bockverktygs anvisning.";

// ---------------------------------------------------------------------------

function skiss90(): string {
  const pts: P[] = [[60, 270], [360, 270], [360, 90]];
  return ruta(
    "90°-bock med bockfjäder – koppar 15 mm",
    "Exempel: ben A = 300 mm, ben B = 200 mm, båda mätta till centrumlinjen.",
    `<path d="${rorPath([[270, 270], [360, 270], [360, 180]], 60)}" fill="none" stroke="${LIGHT}" stroke-width="22" stroke-linecap="round"/>` +
      ror(pts, { r: 60 }) +
      centrum(pts, 60) +
      text(60, 236, "Grått = bockfjädern. Den ska", { size: 11, color: MUTED }) +
      text(60, 251, "täcka hela bockzonen.", { size: 11, color: MUTED }) +
      marke(300, 270, 0, "märke", { dy: -20 }) +
      vinkelbage([360, 270], 86, Math.PI, (3 * Math.PI) / 2, "90°") +
      hjalplinje([60, 280], [60, 330]) +
      hjalplinje([360, 280], [360, 330]) +
      matt([60, 322], [360, 322], "ben A = 300 mm (röränd → centrum)", { textDy: -8 }) +
      hjalplinje([370, 90], [440, 90]) +
      hjalplinje([380, 270], [440, 270]) +
      matt([430, 270], [430, 90], "ben B = 200 mm", { textDx: 10, anchor: "start" }) +
      text(380, 236, "R = bockradie", { size: 11, color: MUTED }),
    FOT,
  );
}

function skiss45(): string {
  const pts: P[] = [[80, 280], [330, 280], [460, 150]];
  return ruta(
    "45°-bock – kontrollera mot vinkelmallen",
    "Bocka lugnt, ta ut röret och lägg det mot mallen. Hellre två försiktiga tag än ett för mycket.",
    ror(pts, { r: 40 }) +
      centrum(pts, 40) +
      hjalplinje([330, 280], [500, 280]) +
      vinkelbage([330, 280], 70, -Math.PI / 4, 0, "45°") +
      `<path d="M360,330 L520,330 L520,170 Z" fill="none" stroke="${GREEN}" stroke-width="2" stroke-dasharray="7 5"/>` +
      text(530, 250, "vinkelmall", { size: 12, color: GREEN, bold: true }) +
      text(530, 266, "45° ±2°", { size: 12, color: GREEN }) +
      marke(300, 280, 0, "märke", { dy: 30 }) +
      text(80, 120, "Två 45°-bockar åt motsatt håll", { size: 12, color: MUTED }) +
      text(80, 136, "blir en offset – nästa övning.", { size: 12, color: MUTED }),
    FOT,
  );
}

function skissOffset(): string {
  const pts: P[] = [[60, 280], [200, 280], [300, 180], [520, 180]];
  return ruta(
    "Offset – två motriktade 45°-bockar",
    "Exempel: flytta röret 100 mm. Avstånd mellan bockarna = 100 × 1,41 = 141 mm.",
    hjalplinje([200, 280], [560, 280]) +
      hjalplinje([60, 180], [300, 180]) +
      ror(pts, { r: 26 }) +
      centrum(pts, 26) +
      nummer(200, 312, 1) +
      text(216, 316, "bock 1", { size: 12, color: ORANGE, bold: true }) +
      nummer(300, 150, 2) +
      text(316, 154, "bock 2 – vänd röret", { size: 12, color: ORANGE, bold: true }) +
      vinkelbage([200, 280], 46, -Math.PI / 4, 0, "45°") +
      matt([182, 262], [282, 162], "141 mm", { textDx: -34, textDy: 0, anchor: "end" }) +
      matt([550, 280], [550, 180], "offset 100 mm", { textDx: -10, anchor: "end" }) +
      text(60, 120, "Offset mäts vinkelrätt mellan de två", { size: 12, color: MUTED }) +
      text(60, 136, "centrumlinjerna (de streckade linjerna).", { size: 12, color: MUTED }),
    FOT,
  );
}

function skissU(): string {
  const pts: P[] = [[130, 90], [130, 280], [390, 280], [390, 90]];
  return ruta(
    "U-bock – två 90°-bockar i samma plan",
    "Exempel: cc 200 mm mellan benen, höjd 150 mm. Centrum = 7,5 mm in från kanten.",
    ror(pts, { r: 40 }) +
      centrum(pts, 40) +
      hjalplinje([130, 290], [130, 334]) +
      hjalplinje([390, 290], [390, 334]) +
      matt([130, 326], [390, 326], "cc 200 mm", { textDy: -8 }) +
      hjalplinje([400, 90], [470, 90]) +
      hjalplinje([400, 280], [470, 280]) +
      matt([460, 280], [460, 90], "höjd 150 mm", { textDx: 10, anchor: "start" }) +
      nummer(110, 300, 1) +
      nummer(410, 300, 2) +
      text(260, 150, "Kontrollera med vinkelhake", { size: 12, color: MUTED, anchor: "middle" }) +
      text(260, 166, "att benen är parallella.", { size: 12, color: MUTED, anchor: "middle" }),
    FOT,
  );
}

function skissRitning(): string {
  const pts: P[] = [[70, 290], [320, 290], [320, 150], [410, 60]];
  let rutnat = "";
  for (let x = 40; x <= 560; x += 40) rutnat += `<line x1="${x}" y1="64" x2="${x}" y2="340" stroke="#e3e9f1" stroke-width="1"/>`;
  for (let y = 80; y <= 340; y += 40) rutnat += `<line x1="24" y1="${y}" x2="576" y2="${y}" stroke="#e3e9f1" stroke-width="1"/>`;
  return ruta(
    "Bocka efter ritning – i nummerordning",
    "Exempel: 250 mm → 90° → 150 mm → 45°. Alla mått till centrumlinjen.",
    rutnat +
      ror(pts, { r: 24 }) +
      centrum(pts, 24) +
      hjalplinje([70, 300], [70, 334]) +
      hjalplinje([320, 300], [320, 334]) +
      matt([70, 326], [320, 326], "250 mm", { textDy: -8 }) +
      hjalplinje([310, 150], [262, 150]) +
      matt([272, 290], [272, 150], "150 mm", { textDx: -8, anchor: "end" }) +
      nummer(346, 300, 1) +
      text(362, 304, "bock 1: 90°", { size: 12, color: ORANGE, bold: true }) +
      nummer(346, 150, 2) +
      text(362, 154, "bock 2: 45°", { size: 12, color: ORANGE, bold: true }) +
      text(430, 230, "Kontrollera mot mallen", { size: 12, color: MUTED }) +
      text(430, 246, "efter VARJE bock – ett fel", { size: 12, color: MUTED }) +
      text(430, 262, "växer genom hela serien.", { size: 12, color: MUTED }),
    FOT,
  );
}

function skissTunnvaggig(): string {
  const pts: P[] = [[50, 300], [270, 300], [270, 90]];
  return ruta(
    "Tunnväggigt rör – stor bockradie och ovalitet",
    "Ovalitet = största Ø − minsta Ø över bocken. Max 10 % av 15 mm = 1,5 mm.",
    ror(pts, { r: 120 }) +
      centrum(pts, 120) +
      `<circle cx="150" cy="180" r="3" fill="${BLUE}"/>` +
      `<line x1="150" y1="180" x2="235" y2="265" stroke="${BLUE}" stroke-width="1.6"/>` +
      text(160, 222, "stor R", { size: 13, color: BLUE, bold: true, anchor: "end" }) +
      text(60, 120, "Stor bockradie", { size: 12, color: MUTED }) +
      text(60, 136, "= mindre risk för veck.", { size: 12, color: MUTED }) +
      `<line x1="330" y1="70" x2="330" y2="330" stroke="${LIGHT}" stroke-width="1"/>` +
      `<circle cx="392" cy="190" r="36" fill="none" stroke="${NAVY}" stroke-width="7"/>` +
      text(392, 246, "före", { size: 12, anchor: "middle", bold: true }) +
      text(392, 262, "Ø 15,0", { size: 12, anchor: "middle" }) +
      `<ellipse cx="505" cy="190" rx="44" ry="31" fill="none" stroke="${NAVY}" stroke-width="7"/>` +
      matt([461, 140], [549, 140], "största Ø", { size: 11 }) +
      matt([566, 159], [566, 221], "", { size: 11 }) +
      text(580, 190, "minsta Ø", { size: 11, color: ORANGE, bold: true, anchor: "middle", rotate: 90 }) +
      text(505, 246, "efter", { size: 12, anchor: "middle", bold: true }) +
      text(505, 262, "mät över bocken", { size: 12, anchor: "middle" }) +
      text(455, 290, "Godkänt: 15,6 − 14,3 = 1,3 mm ✓", { size: 12, color: GREEN, bold: true, anchor: "middle" }) +
      text(455, 308, "Underkänt: 15,9 − 13,8 = 2,1 mm ✗", { size: 12, color: "#b3261e", bold: true, anchor: "middle" }),
    FOT,
  );
}

function skissPex(): string {
  const pts: P[] = [[110, 290], [230, 290], [330, 290], [330, 118]];
  return ruta(
    "PEX 16 mm – minsta bockradie",
    "Ofta 5 × ytterdiametern med bockfjäder: 5 × 16 = 80 mm. Tillverkaren avgör.",
    ror(pts, { r: 110, farg: "#c0392b" }) +
      `<rect x="62" y="278" width="48" height="24" rx="5" fill="#9aa8b8" stroke="${NAVY}" stroke-width="2"/>` +
      `<rect x="306" y="80" width="48" height="38" rx="5" fill="#9aa8b8" stroke="${NAVY}" stroke-width="2"/>` +
      text(86, 330, "presskoppling", { size: 11, anchor: "middle" }) +
      text(86, 344, "+ stödhylsa", { size: 11, anchor: "middle" }) +
      text(362, 104, "presskoppling + stödhylsa", { size: 11 }) +
      `<circle cx="220" cy="180" r="3" fill="${BLUE}"/>` +
      matt([220, 180], [298, 258], "R ≥ 80 mm", { size: 13, textDx: -30, textDy: -4, farg: BLUE }) +
      text(380, 180, "För snäv bock = knäck.", { size: 12, color: MUTED }) +
      text(380, 196, "Ett knäckt PEX-rör byts –", { size: 12, color: MUTED }) +
      text(380, 212, "det rätas inte ut.", { size: 12, color: MUTED }),
    FOT,
  );
}

function skissTathet(): string {
  const pts: P[] = [[150, 280], [400, 280], [400, 100]];
  return ruta(
    "Bocka, anslut och täthetsprova",
    "Provtryck 0,6 MPa = 6 bar. Vatten – aldrig luft. Lufta vid högsta punkten.",
    ror(pts, { r: 50 }) +
      `<rect x="128" y="266" width="28" height="28" rx="4" fill="#9aa8b8" stroke="${NAVY}" stroke-width="2"/>` +
      `<rect x="386" y="78" width="28" height="28" rx="4" fill="#9aa8b8" stroke="${NAVY}" stroke-width="2"/>` +
      `<rect x="390" y="64" width="20" height="14" rx="3" fill="${NAVY}"/>` +
      text(424, 76, "propp – lufta här", { size: 12, bold: true }) +
      text(424, 98, "klämringskoppling", { size: 11, color: MUTED }) +
      text(142, 320, "klämringskoppling", { size: 11, color: MUTED, anchor: "start" }) +
      `<line x1="128" y1="280" x2="70" y2="280" stroke="${NAVY}" stroke-width="4"/>` +
      `<line x1="70" y1="280" x2="70" y2="200" stroke="${NAVY}" stroke-width="4"/>` +
      `<circle cx="70" cy="170" r="30" fill="#ffffff" stroke="${NAVY}" stroke-width="3"/>` +
      `<line x1="70" y1="170" x2="88" y2="152" stroke="#b3261e" stroke-width="3"/>` +
      text(70, 192, "bar", { size: 10, color: MUTED, anchor: "middle" }) +
      text(70, 126, "manometer", { size: 12, bold: true, anchor: "middle" }) +
      text(70, 300, "från provtryckspumpen", { size: 11, color: MUTED, anchor: "middle" }) +
      text(440, 170, "1. fyll med vatten", { size: 12 }) +
      text(440, 188, "2. lufta", { size: 12 }) +
      text(440, 206, "3. höj trycket lugnt", { size: 12 }) +
      text(440, 224, "4. läs av manometern", { size: 12 }) +
      text(440, 242, "5. titta på alla fogar", { size: 12 }) +
      text(440, 260, "6. skriv i egenkontrollen", { size: 12 }),
    FOT,
  );
}

function skissInsida(): string {
  const pts: P[] = [[60, 290], [250, 290], [250, 120], [540, 120]];
  return ruta(
    "Seriebock – mät från rörets insida",
    "Exempel 15 mm rör, cc 150 mm: från insidan blir det 150 − 7,5 = 142,5 mm till nästa bock.",
    ror(pts, { r: 30 }) +
      centrum(pts, 30) +
      hjalplinje([240, 290], [180, 290]) +
      hjalplinje([240, 120], [180, 120]) +
      matt([190, 290], [190, 120], "cc 150", { textDx: -8, anchor: "end" }) +
      hjalplinje([262, 284.5], [330, 284.5]) +
      matt([320, 284.5], [320, 120], "142,5 från insida", { textDx: 8, anchor: "start" }) +
      nummer(232, 312, 1) +
      nummer(232, 98, 2) +
      `<circle cx="470" cy="240" r="44" fill="#ffffff" stroke="${NAVY}" stroke-width="6"/>` +
      `<circle cx="470" cy="240" r="2.5" fill="${NAVY}"/>` +
      matt([470, 240], [514, 240], "7,5", { size: 12, textDy: -8 }) +
      text(470, 306, "halva Ø = kompensation", { size: 12, anchor: "middle", bold: true }) +
      text(470, 322, "12 mm → 6 · 15 mm → 7,5", { size: 11, color: MUTED, anchor: "middle" }),
    FOT,
  );
}

function skissS(): string {
  // Övre delen: raka röret med streck. Nedre delen: resultatet.
  const rak: P[] = [[60, 120], [540, 120]];
  const bockad: P[] = [[60, 310], [230, 310], [310, 230], [540, 230]];
  return ruta(
    "S-bock med 110 + X – 15 mm rör",
    "Exempel: S = 80 mm → markavstånd 110 + 80 = 190 mm mellan startstreck och bockstreck.",
    text(60, 80, "Före: märk det raka röret", { size: 12, color: MUTED, bold: true }) +
      ror(rak) +
      marke(170, 120, 0, "startstreck", { dy: 34 }) +
      marke(360, 120, 0, "bockstreck", { dy: 34 }) +
      matt([170, 100], [360, 100], "190 mm", { textDy: -6 }) +
      text(60, 196, "Efter: två motriktade 45°-bockar", { size: 12, color: MUTED, bold: true }) +
      hjalplinje([230, 310], [570, 310]) +
      hjalplinje([60, 230], [310, 230]) +
      ror(bockad, { r: 24 }) +
      centrum(bockad, 24) +
      nummer(230, 340, 1) +
      nummer(310, 206, 2) +
      text(326, 210, "vänd röret, bockstreck på 0", { size: 11, color: ORANGE, bold: true }) +
      matt([560, 310], [560, 230], "S = 80 mm", { textDx: -10, anchor: "end" }),
    "Tight S-bock: ca 60 mm cc (15 mm) / 50 mm cc (12 mm). Alla bocknycklar slår olika – lär känna din egen.",
    H + 10,
  );
}

const RITA: Record<BockSkissId, () => string> = {
  "bock-90": skiss90,
  "bock-45": skiss45,
  "bock-offset": skissOffset,
  "bock-u": skissU,
  "bock-ritning": skissRitning,
  "bock-tunnvaggig": skissTunnvaggig,
  "bock-pex": skissPex,
  "bock-tathet": skissTathet,
  "bock-insida": skissInsida,
  "bock-s": skissS,
};

export const BOCK_SKISS_IDS = Object.keys(RITA) as BockSkissId[];

const cache = new Map<BockSkissId, string>();

export function bockSkissSvg(id: BockSkissId): string {
  let svg = cache.get(id);
  if (!svg) {
    svg = RITA[id]();
    cache.set(id, svg);
  }
  return svg;
}

/** Bredd/höjd ur skissens viewBox – för rätt proportioner i rutan. */
export function bockSkissProportion(id: BockSkissId): number {
  const m = /viewBox="0 0 (\d+) (\d+)"/.exec(bockSkissSvg(id));
  return m ? Number(m[1]) / Number(m[2]) : B / H;
}
