// Principskisser för examensprovets installationer (VVS-montör).
//
// Skisserna visar ordningen på komponenterna, inte exakta mått. De visas för
// eleven i övningsläge; i provläge döljer databasen referensbilden
// (reveal_mode = 'hidden'). Rita om här om skolans examensritning ändras.

import { B, BLUE, GREEN, LIGHT, MUTED, NAVY, ORANGE, nummer, pil, ror, ruta, text } from "./skissRitning";

export type ExamSkissId = "exam-vvb" | "exam-badrum" | "exam-expansion";

const RED = "#c0392b";
const H = 430;
const FOT = "Principskiss, inte skalenlig. Examensritningen och tillverkarens anvisning gäller.";

type Riktning = "h" | "v";

/** Avstängningsventil: två trianglar spets mot spets. */
function ventil(x: number, y: number, r: Riktning, farg = NAVY, fylld = false): string {
  const s = 11;
  const d =
    r === "h"
      ? `M${x - s},${y - s} L${x - s},${y + s} L${x + s},${y - s} L${x + s},${y + s} Z`
      : `M${x - s},${y - s} L${x + s},${y - s} L${x - s},${y + s} L${x + s},${y + s} Z`;
  return `<path d="${d}" fill="${fylld ? farg : "#ffffff"}" stroke="${farg}" stroke-width="2.2" stroke-linejoin="round"/>`;
}

/** Backventil: ventil med fylld halva och pil i flödesriktningen. */
function backventil(x: number, y: number, r: Riktning, flode: "upp" | "hoger", farg = NAVY): string {
  const s = 11;
  const tri =
    r === "v"
      ? `M${x - s},${y + s} L${x + s},${y + s} L${x},${y} Z`
      : `M${x - s},${y - s} L${x - s},${y + s} L${x},${y} Z`;
  const pilV = flode === "upp" ? -Math.PI / 2 : 0;
  const px = r === "v" ? x + 22 : x;
  const py = r === "v" ? y : y - 22;
  return (
    ventil(x, y, r, farg) +
    `<path d="${tri}" fill="${farg}"/>` +
    `<line x1="${px - (r === "h" ? 10 : 0)}" y1="${py + (r === "v" ? 10 : 0)}" x2="${px + (r === "h" ? 10 : 0)}" y2="${py - (r === "v" ? 10 : 0)}" stroke="${farg}" stroke-width="1.6"/>` +
    pil(px + (r === "h" ? 10 : 0), py - (r === "v" ? 10 : 0), pilV, farg)
  );
}

/** Säkerhetsventil: vinkelventil med fjäder och spillrör nedåt. */
function sakerhetsventil(x: number, y: number, farg = RED, spillTill?: number): string {
  return (
    `<path d="M${x - 10},${y - 10} L${x + 10},${y - 10} L${x},${y + 4} Z" fill="#ffffff" stroke="${NAVY}" stroke-width="2"/>` +
    `<path d="M${x},${y + 4} L${x + 12},${y + 14} L${x + 12},${y - 6} Z" fill="#ffffff" stroke="${NAVY}" stroke-width="2"/>` +
    `<path d="M${x},${y - 10} l-5,-4 l10,-4 l-10,-4 l10,-4" fill="none" stroke="${NAVY}" stroke-width="1.6"/>` +
    `<rect x="${x - 6}" y="${y - 32}" width="12" height="8" rx="2" fill="${farg}"/>` +
    (spillTill !== undefined
      ? `<path d="M${x + 12},${y + 4} L${x + 30},${y + 4} L${x + 30},${spillTill}" fill="none" stroke="${MUTED}" stroke-width="3" stroke-dasharray="6 4"/>` +
        `<path d="M${x + 20},${spillTill} L${x + 40},${spillTill} L${x + 34},${spillTill + 10} L${x + 26},${spillTill + 10} Z" fill="none" stroke="${MUTED}" stroke-width="1.6"/>`
      : "")
  );
}

function manometer(x: number, y: number): string {
  return (
    `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 18}" stroke="${NAVY}" stroke-width="3"/>` +
    `<circle cx="${x}" cy="${y - 30}" r="12" fill="#ffffff" stroke="${NAVY}" stroke-width="2"/>` +
    `<line x1="${x}" y1="${y - 30}" x2="${x + 7}" y2="${y - 36}" stroke="${RED}" stroke-width="2"/>`
  );
}

function avluftare(x: number, y: number): string {
  return (
    `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 14}" stroke="${NAVY}" stroke-width="3"/>` +
    `<rect x="${x - 9}" y="${y - 34}" width="18" height="20" rx="3" fill="#ffffff" stroke="${NAVY}" stroke-width="2"/>` +
    `<line x1="${x}" y1="${y - 38}" x2="${x}" y2="${y - 50}" stroke="${MUTED}" stroke-width="1.6"/>` +
    pil(x, y - 52, -Math.PI / 2, MUTED)
  );
}

/** Blandningsventil: tre trianglar med spetsen i mitten. */
function blandningsventil(x: number, y: number): string {
  const s = 12;
  return (
    `<path d="M${x - s},${y - s} L${x - s},${y + s} L${x},${y} Z M${x + s},${y - s} L${x + s},${y + s} L${x},${y} Z M${x - s},${y + s} L${x + s},${y + s} L${x},${y} Z" fill="#ffffff" stroke="${NAVY}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<circle cx="${x}" cy="${y - 20}" r="8" fill="${NAVY}"/>` +
    `<line x1="${x}" y1="${y - 12}" x2="${x}" y2="${y - 2}" stroke="${NAVY}" stroke-width="2"/>`
  );
}

function legend(x: number, y: number, rader: string[]): string {
  return rader
    .map((r, i) => nummer(x, y + i * 26, i + 1) + text(x + 18, y + i * 26 + 4.5, r, { size: 12 }))
    .join("");
}

function klammer(x: number, y: number, r: Riktning): string {
  return r === "h"
    ? `<rect x="${x - 3}" y="${y - 30}" width="6" height="44" rx="2" fill="#ffffff" stroke="${MUTED}" stroke-width="1.4"/>`
    : `<rect x="${x - 30}" y="${y - 3}" width="44" height="6" rx="2" fill="#ffffff" stroke="${MUTED}" stroke-width="1.4"/>`;
}

// ---------------------------------------------------------------------------

function skissVvb(): string {
  return ruta(
    "Varmvattenberedare – säkerhetsutrustning",
    "Fixturen (den uppochnedvända U:n) är beredaren. Ordningen på kallvattnet räknas nerifrån.",
    // KV till beredaren och VV från beredaren
    ror([[200, 395], [200, 140]], { farg: BLUE, r: 0 }) +
      ror([[200, 140], [200, 90], [340, 90], [340, 140]], { farg: NAVY, r: 55 }) +
      ror([[340, 130], [340, 250], [292, 250]], { farg: RED, r: 18 }) +
      // KV-gren till blandningsventilen
      ror([[200, 250], [248, 250]], { farg: BLUE, r: 0 }) +
      // Blandat VV ut
      ror([[270, 262], [270, 395]], { farg: "#e0803c", r: 0 }) +
      text(270, 78, "fixtur = beredare", { size: 12, color: NAVY, bold: true, anchor: "middle" }) +
      text(270, 120, "rundgång", { size: 11, color: MUTED, anchor: "middle" }) +
      // komponenter på KV, nerifrån och upp
      ventil(200, 365, "v", BLUE) +
      nummer(172, 365, 1) +
      backventil(200, 320, "v", "upp", BLUE) +
      nummer(172, 320, 2) +
      blandningsventil(270, 250) +
      nummer(300, 222, 3) +
      `<line x1="200" y1="190" x2="140" y2="190" stroke="${BLUE}" stroke-width="9" stroke-linecap="round"/>` +
      sakerhetsventil(128, 190, "#2e86c1", 395) +
      nummer(100, 160, 4) +
      text(200, 412, "KV in", { size: 12, color: BLUE, bold: true, anchor: "middle" }) +
      pil(200, 384, -Math.PI / 2, "#ffffff") +
      text(270, 412, "VV ut (blandat)", { size: 12, color: "#e0803c", bold: true, anchor: "start" }) +
      text(150, 412, "spill → golvbrunn", { size: 10.5, color: MUTED, anchor: "end" }) +
      legend(400, 150, [
        "Avstängningsventil",
        "Backventil (flöde uppåt)",
        "Blandningsventil",
        "Säkerhetsventil + spillrör",
      ]) +
      text(400, 270, "Blandningsventilen får sitt", { size: 11, color: MUTED }) +
      text(400, 285, "kallvatten EFTER backventilen.", { size: 11, color: MUTED }) +
      text(400, 308, "Ingen avstängning mellan", { size: 11, color: MUTED }) +
      text(400, 323, "säkerhetsventil och beredare.", { size: 11, color: MUTED }),
    FOT,
    H + 30,
  );
}

function skissBadrum(): string {
  const golv = 372;
  let k = "";
  for (const x of [70, 180, 300, 400]) k += klammer(x, 334, "h");
  return ruta(
    "Komplettering av badrum – synligt dragna rör",
    "Rören bockas och klamras på vägg. Vid tappstället: varmt till vänster, kallt till höger.",
    `<rect x="24" y="70" width="${B - 48}" height="${golv - 70}" fill="#eef2f6"/>` +
      `<line x1="24" y1="${golv}" x2="${B - 24}" y2="${golv}" stroke="${NAVY}" stroke-width="3"/>` +
      // tvättställ
      `<path d="M60,214 L170,214 L160,244 L70,244 Z" fill="#ffffff" stroke="${NAVY}" stroke-width="2"/>` +
      `<path d="M110,244 L110,300 L130,300" fill="none" stroke="${LIGHT}" stroke-width="6"/>` +
      text(115, 206, "tvättställ", { size: 11, color: MUTED, anchor: "middle" }) +
      // WC
      `<rect x="232" y="196" width="56" height="54" rx="6" fill="#ffffff" stroke="${NAVY}" stroke-width="2"/>` +
      `<path d="M226,262 L300,262 L292,${golv} L238,${golv} Z" fill="#ffffff" stroke="${NAVY}" stroke-width="2"/>` +
      text(260, 188, "WC", { size: 11, color: MUTED, anchor: "middle" }) +
      // dusch
      `<rect x="474" y="226" width="54" height="12" rx="4" fill="#9aa8b8" stroke="${NAVY}" stroke-width="2"/>` +
      `<line x1="520" y1="226" x2="520" y2="96" stroke="${MUTED}" stroke-width="3"/>` +
      `<rect x="512" y="104" width="16" height="22" rx="4" fill="#ffffff" stroke="${MUTED}" stroke-width="2"/>` +
      text(500, 216, "duschblandare", { size: 11, color: MUTED, anchor: "middle" }) +
      // VV (rött) – övre ledningen
      ror([[30, 322], [480, 322], [480, 238]], { farg: RED, r: 18, bredd: 8 }) +
      ror([[95, 322], [95, 244]], { farg: RED, r: 0, bredd: 8 }) +
      // KV (blått) – nedre ledningen, bockas förbi VV vid tappställena
      ror([[30, 346], [500, 346], [500, 238]], { farg: BLUE, r: 18, bredd: 8 }) +
      `<line x1="135" y1="346" x2="135" y2="244" stroke="#eef2f6" stroke-width="16"/>` +
      ror([[135, 346], [135, 244]], { farg: BLUE, r: 0, bredd: 8 }) +
      `<line x1="310" y1="346" x2="310" y2="250" stroke="#eef2f6" stroke-width="16"/>` +
      ror([[310, 346], [310, 222], [288, 222]], { farg: BLUE, r: 10, bredd: 8 }) +
      k +
      ventil(95, 270, "v", RED) +
      ventil(135, 270, "v", BLUE) +
      ventil(310, 280, "v", BLUE) +
      text(40, 316, "VV", { size: 12, color: RED, bold: true }) +
      text(40, 364, "KV", { size: 12, color: BLUE, bold: true }) +
      text(300, 100, "Kontrollera före montering:", { size: 12, color: NAVY, bold: true }) +
      text(300, 118, "• höjder mot ritning och tillverkare", { size: 11, color: MUTED }) +
      text(300, 134, "• avlopp till befintlig avsättning", { size: 11, color: MUTED }) +
      text(300, 150, "• fall mot avloppet", { size: 11, color: MUTED }) +
      text(300, 166, "• egenkontroll när du är klar", { size: 11, color: MUTED }) +
      text(76, 392, "klammer", { size: 10.5, color: MUTED, anchor: "middle" }) +
      text(200, 392, "Där KV korsar VV bockas röret förbi (överbockning).", { size: 10.5, color: MUTED }),
    FOT,
    H + 10,
  );
}

function skissExpansion(): string {
  return ruta(
    "Slutet expansionskärl – säkerhetsutrustning",
    "Lösa komponenter. Kärlet ska kunna bytas utan att systemet töms.",
    ror([[30, 150], [430, 150], [430, 262]], { farg: RED, r: 24 }) +
      text(34, 178, "från pannan", { size: 12, color: RED, bold: true }) +
      pil(70, 150, 0, "#ffffff") +
      // säkerhetsventil
      `<line x1="110" y1="150" x2="110" y2="128" stroke="${NAVY}" stroke-width="3"/>` +
      sakerhetsventil(110, 118, RED, 196) +
      nummer(84, 92, 1) +
      // manometer
      manometer(200, 150) +
      nummer(226, 108, 2) +
      // automatisk avluftare
      avluftare(290, 150) +
      nummer(316, 108, 3) +
      // avstängning + avtappning på kärlsidan
      ventil(430, 196, "v", NAVY) +
      nummer(458, 196, 4) +
      `<line x1="430" y1="232" x2="400" y2="232" stroke="${NAVY}" stroke-width="3"/>` +
      ventil(392, 232, "h", NAVY) +
      nummer(366, 232, 5) +
      // kärlet
      `<rect x="392" y="262" width="76" height="98" rx="26" fill="${RED}" stroke="${NAVY}" stroke-width="2"/>` +
      `<line x1="392" y1="300" x2="468" y2="300" stroke="#e8b4ae" stroke-width="2"/>` +
      text(430, 382, "slutet kärl", { size: 12, color: NAVY, bold: true, anchor: "middle" }) +
      text(156, 214, "spillrör → golvbrunn", { size: 10.5, color: MUTED }) +
      legend(40, 252, [
        "Säkerhetsventil",
        "Manometer",
        "Automatisk avluftare (högsta punkt)",
        "Avstängningsventil till kärlet",
        "Avtappning (kärlsidan)",
      ]) +
      `<rect x="478" y="182" width="112" height="92" rx="8" fill="#fff6e8" stroke="${ORANGE}" stroke-width="1.4"/>` +
      text(536, 200, "Ingen avstängning", { size: 10.5, color: NAVY, bold: true, anchor: "middle" }) +
      text(536, 214, "mellan pannan och", { size: 10.5, color: NAVY, anchor: "middle" }) +
      text(536, 228, "säkerhets-", { size: 10.5, color: NAVY, anchor: "middle" }) +
      text(536, 242, "ventilen.", { size: 10.5, color: NAVY, anchor: "middle" }) +
      text(536, 262, "Provtrycks!", { size: 10.5, color: GREEN, bold: true, anchor: "middle" }),
    FOT,
    H,
  );
}

const RITA: Record<ExamSkissId, () => string> = {
  "exam-vvb": skissVvb,
  "exam-badrum": skissBadrum,
  "exam-expansion": skissExpansion,
};

export const EXAM_SKISS_IDS = Object.keys(RITA) as ExamSkissId[];

const cache = new Map<ExamSkissId, string>();

export function examSkissSvg(id: ExamSkissId): string {
  let svg = cache.get(id);
  if (!svg) {
    svg = RITA[id]();
    cache.set(id, svg);
  }
  return svg;
}

export function examSkissProportion(id: ExamSkissId): number {
  const m = /viewBox="0 0 (\d+) (\d+)"/.exec(examSkissSvg(id));
  return m ? Number(m[1]) / Number(m[2]) : B / H;
}
