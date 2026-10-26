// Etikettutskrift direkt från webbläsaren till Phomemo D35 (Clas Ohlson 44-5567)
// och snarlika termoskrivare, över Web Bluetooth.
//
// Protokollet är ESC/POS-liknande:
//   service 0000ff00-…  characteristic 0000ff02-…  ("write without response")
//   init   ESC @                     1B 40
//   bild   GS v 0 0 xL xH yL yH      + 1-bitars raster, MSB = vänster
//
// Skrivhuvudet är 96 punkter brett (12 mm) och papperet matas 8 punkter/mm.
// Därför ritas layouten "liggande" och roteras 90° innan den skickas: bredden
// i det som skickas = skrivhuvudet, höjden = antal matade rader.

import { qrMatrix } from "@/lib/qrMatrix";

export const HEAD_WIDTH_PX = 96;
export const PX_PER_MM = 8;

const SERVICE_UUID = "0000ff00-0000-1000-8000-00805f9b34fb";
const WRITE_UUID = "0000ff02-0000-1000-8000-00805f9b34fb";

const MARGIN = 4;
const GAP = 8;

export type LabelFont = "sans" | "mono" | "serif";
export type LabelAlign = "left" | "center" | "right";

export interface LabelStyle {
  /** 1 = liten, 2 = normal, 3 = stor, 4 = extra stor */
  size: number;
  bold: boolean;
  uppercase: boolean;
  align: LabelAlign;
  font: LabelFont;
  /** Vit text på svart botten – tydlig rubrik. */
  invert: boolean;
}

export interface LabelSpec {
  text: string;
  qr?: string;
  style: LabelStyle;
  /** Fast längd i mm. 0/undefined = anpassa längden efter innehållet. */
  lengthMm?: number;
}

export const DEFAULT_STYLE: LabelStyle = {
  size: 2,
  bold: true,
  uppercase: false,
  align: "center",
  font: "sans",
  invert: false,
};

export function bluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && !!(navigator as unknown as { bluetooth?: unknown }).bluetooth;
}

/* ------------------------------------------------------------------ rityta */

function nyCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

function context(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Kunde inte skapa rityta");
  return ctx;
}

function fontString(style: LabelStyle, size: number): string {
  const weight = style.bold ? "800" : "500";
  const family =
    style.font === "mono"
      ? '"DejaVu Sans Mono", Consolas, "Courier New", monospace'
      : style.font === "serif"
        ? 'Georgia, "Times New Roman", serif'
        : '"DejaVu Sans", Arial, Helvetica, sans-serif';
  return `${weight} ${size}px ${family}`;
}

function wrapLines(ctx: CanvasRenderingContext2D, lines: string[], maxWidth: number): string[] {
  const out: string[] = [];
  for (const line of lines) {
    if (!line) {
      out.push("");
      continue;
    }
    let current = "";
    for (const word of line.split(" ")) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(candidate).width > maxWidth) {
        out.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    out.push(current);
  }
  return out;
}

interface Block {
  canvas: HTMLCanvasElement;
  width: number;
}

function textBlock(text: string, style: LabelStyle): Block {
  const raw = text.split("\n").map((l) => (style.uppercase ? l.toUpperCase() : l));
  const measurer = context(nyCanvas(1, 1));
  const base = [0, 18, 24, 32, 42][Math.min(4, Math.max(0, style.size))];

  let size = base;
  let wrapped: string[] = raw;
  let lineHeight = size;
  let width = HEAD_WIDTH_PX;
  for (; size >= 7; size--) {
    measurer.font = fontString(style, size);
    wrapped = wrapLines(measurer, raw, HEAD_WIDTH_PX - 2 * MARGIN);
    lineHeight = Math.round(size * 1.22);
    width = Math.ceil(Math.max(...wrapped.map((l) => measurer.measureText(l).width), 1)) + 2 * MARGIN;
    if (lineHeight * wrapped.length + 2 * MARGIN <= HEAD_WIDTH_PX) break;
  }

  const canvas = nyCanvas(width, HEAD_WIDTH_PX);
  const ctx = context(canvas);
  ctx.fillStyle = style.invert ? "#000" : "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = style.invert ? "#fff" : "#000";
  ctx.font = fontString(style, size);
  ctx.textBaseline = "alphabetic";

  let y = Math.round((canvas.height - lineHeight * wrapped.length) / 2) + Math.round(size * 0.8);
  for (const line of wrapped) {
    const w = ctx.measureText(line).width;
    const x =
      style.align === "left" ? MARGIN : style.align === "right" ? canvas.width - MARGIN - w : (canvas.width - w) / 2;
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return { canvas, width: canvas.width };
}

function qrBlock(value: string): Block {
  const qr = qrMatrix(value);
  const count = qr.size;
  const quiet = 2; // tyst zon i moduler, krävs för att kameran ska hitta koden
  const total = count + 2 * quiet;

  const modules = nyCanvas(total, total);
  const mctx = context(modules);
  mctx.fillStyle = "#fff";
  mctx.fillRect(0, 0, total, total);
  mctx.fillStyle = "#000";
  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      if (qr.data[y * count + x]) mctx.fillRect(x + quiet, y + quiet, 1, 1);
    }
  }

  // Skala upp utan utjämning: skarpa moduler även när skalan inte är ett heltal.
  const canvas = nyCanvas(HEAD_WIDTH_PX, HEAD_WIDTH_PX);
  const ctx = context(canvas);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(modules, 0, 0, total, total, 0, 0, HEAD_WIDTH_PX, HEAD_WIDTH_PX);
  return { canvas, width: HEAD_WIDTH_PX };
}

function composeArtwork(spec: LabelSpec): HTMLCanvasElement {
  const blocks: Block[] = [];
  if (spec.text.trim()) blocks.push(textBlock(spec.text, spec.style));
  if (spec.qr) blocks.push(qrBlock(spec.qr));
  if (!blocks.length) blocks.push(textBlock("Etikett", spec.style));

  const contentWidth = blocks.reduce((sum, b) => sum + b.width, 0) + GAP * (blocks.length - 1);
  const wanted = spec.lengthMm ? Math.round(spec.lengthMm * PX_PER_MM) : 0;
  const artworkWidth = Math.max(contentWidth, wanted);

  const art = nyCanvas(artworkWidth, HEAD_WIDTH_PX);
  const ctx = context(art);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, art.width, art.height);
  let x = Math.floor((artworkWidth - contentWidth) / 2);
  for (const block of blocks) {
    ctx.drawImage(block.canvas, x, 0);
    x += block.width + GAP;
  }
  return art;
}

export interface Raster {
  width: number;
  height: number;
  pixels: ImageData;
}

/** Roterar layouten till det skrivaren vill ha: bredd = skrivhuvud, höjd = matning. */
export function renderRaster(spec: LabelSpec): Raster {
  const art = composeArtwork(spec);
  const raster = nyCanvas(HEAD_WIDTH_PX, art.width);
  const ctx = context(raster);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, raster.width, raster.height);
  ctx.translate(0, art.width);
  ctx.rotate(-Math.PI / 2);
  ctx.drawImage(art, 0, 0);
  return { width: raster.width, height: raster.height, pixels: ctx.getImageData(0, 0, raster.width, raster.height) };
}

/** Förhandsvisning som data-URL (samma pixlar som skickas till skrivaren). */
export function renderPreview(spec: LabelSpec): { uri: string; width: number; height: number } {
  const { width, height, pixels } = renderRaster(spec);
  const canvas = nyCanvas(width, height);
  context(canvas).putImageData(pixels, 0, 0);
  return { uri: canvas.toDataURL("image/png"), width, height };
}

/** 1-bitars raster, MSB = vänster. Ren funktion så den går att testa. */
export function packBitmap(pixels: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const bytesPerRow = width >> 3;
  const out = new Uint8Array(bytesPerRow * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    for (let bx = 0; bx < bytesPerRow; bx++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const i = (y * width + bx * 8 + bit) * 4;
        // Heltalsluminans: exakt tröskel vid 128, inga flyttalsavrundningar.
        const lum = (pixels[i] * 299 + pixels[i + 1] * 587 + pixels[i + 2] * 114) / 1000;
        if (lum < 128) byte |= 0x80 >> bit;
      }
      out[o++] = byte;
    }
  }
  return out;
}

export function escposPayload(bitmap: Uint8Array, width: number, height: number): Uint8Array {
  const bytesPerRow = width >> 3;
  const header = [
    0x1b, 0x40, // ESC @ – init
    0x1d, 0x76, 0x30, 0x00, // GS v 0 0 – rasterbild
    bytesPerRow & 0xff, (bytesPerRow >> 8) & 0xff,
    height & 0xff, (height >> 8) & 0xff,
  ];
  const out = new Uint8Array(header.length + bitmap.length);
  out.set(header, 0);
  out.set(bitmap, header.length);
  return out;
}

export function labelToPayload(spec: LabelSpec): { payload: Uint8Array; width: number; height: number } {
  const { width, height, pixels } = renderRaster(spec);
  return { payload: escposPayload(packBitmap(pixels.data, width, height), width, height), width, height };
}

/* ------------------------------------------------------------- bluetooth */

export interface Printer {
  name: string;
  write(data: Uint8Array): Promise<void>;
  disconnect(): void;
}

interface BluetoothCharacteristicLike {
  writeValueWithoutResponse?(data: Uint8Array): Promise<void>;
  writeValueWithResponse?(data: Uint8Array): Promise<void>;
  writeValue?(data: Uint8Array): Promise<void>;
}

export async function connectPrinter(): Promise<Printer> {
  const bt = (navigator as unknown as { bluetooth?: { requestDevice(o: unknown): Promise<unknown> } }).bluetooth;
  if (!bt) {
    throw new Error("Web Bluetooth finns inte i den här webbläsaren. Öppna appen i Chrome eller Edge på en dator.");
  }

  const device = (await bt.requestDevice({
    acceptAllDevices: true,
    optionalServices: [SERVICE_UUID],
  })) as {
    name?: string | null;
    gatt?: { connect(): Promise<unknown>; disconnect(): void };
  };
  if (!device.gatt) throw new Error("Enheten har ingen GATT-server.");

  const server = (await device.gatt.connect()) as {
    getPrimaryService(uuid: string): Promise<{
      getCharacteristic(uuid: string): Promise<BluetoothCharacteristicLike>;
    }>;
  };
  const service = await server.getPrimaryService(SERVICE_UUID);
  const characteristic = await service.getCharacteristic(WRITE_UUID);

  async function write(data: Uint8Array) {
    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      const slice = data.slice(i, i + chunkSize);
      if (characteristic.writeValueWithoutResponse) await characteristic.writeValueWithoutResponse(slice);
      else if (characteristic.writeValue) await characteristic.writeValue(slice);
      else if (characteristic.writeValueWithResponse) await characteristic.writeValueWithResponse(slice);
      else throw new Error("Skrivarens characteristic går inte att skriva till.");
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  return {
    name: device.name ?? "D35",
    write,
    disconnect() {
      try {
        device.gatt?.disconnect();
      } catch {
        // ignorera
      }
    },
  };
}

/** Skriver ut alla etiketter i följd över en och samma anslutning. */
export async function printLabels(
  printer: Printer,
  specs: LabelSpec[],
  onProgress?: (klara: number, total: number) => void,
): Promise<void> {
  for (let i = 0; i < specs.length; i++) {
    const { payload } = labelToPayload(specs[i]);
    await printer.write(payload);
    // Låt skrivaren mata klart innan nästa bild skickas.
    await new Promise((r) => setTimeout(r, 500));
    onProgress?.(i + 1, specs.length);
  }
}
