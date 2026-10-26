// QR-modulmatris utan renderare: vi ritar rutorna själva så att de hamnar på
// exakta pixelgränser i den termiska skrivarens 96 punkter breda raster.
import { create } from "qrcode/lib/core/qrcode";

export interface QrMatrix {
  size: number;
  data: Uint8Array;
}

export function qrMatrix(value: string): QrMatrix {
  const qr = create(value, { errorCorrectionLevel: "M" });
  return { size: qr.modules.size, data: qr.modules.data };
}
