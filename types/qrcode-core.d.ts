// Minimal typdeklaration för kärnan i qrcode-paketet. Vi använder bara
// modulmatrisen och ritar den själva på canvas, så renderarna (som drar in
// canvas/fs) behövs aldrig.
declare module "qrcode/lib/core/qrcode" {
  export interface QrModules {
    size: number;
    data: Uint8Array;
  }
  export interface QrCode {
    modules: QrModules;
  }
  export function create(
    text: string,
    opts?: { errorCorrectionLevel?: "L" | "M" | "Q" | "H"; version?: number },
  ): QrCode;
}
