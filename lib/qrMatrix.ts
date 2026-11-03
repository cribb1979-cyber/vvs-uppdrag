// QR-modulmatris utan renderare: vi ritar rutorna själva så att de hamnar på
// exakta pixelgränser i den termiska skrivarens 96 punkter breda raster.
import { create } from "qrcode/lib/core/qrcode";

export interface QrMatrix {
  size: number;
  data: Uint8Array;
}

export function qrMatrix(value: string, errorCorrectionLevel: "L" | "M" | "Q" | "H" = "M"): QrMatrix {
  const qr = create(value, { errorCorrectionLevel });
  return { size: qr.modules.size, data: qr.modules.data };
}
