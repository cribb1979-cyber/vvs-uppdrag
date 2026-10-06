// Bygger QR-kodbara länkar. Om EXPO_PUBLIC_APP_URL är satt (appen är
// deployad någonstans) kodar vi en riktig https-länk, så att telefonens
// VANLIGA kamera kan öppna den direkt -- ingen appinstallation krävs.
// Utan den (lokal utveckling) faller vi tillbaka till ren textkod, som
// fortfarande fungerar med appens egen QR-skanner och manuell inmatning.
// På webben (Vercel) kan appen använda sin egen adress även om APP_URL inte är
// satt, så QR-koder/länkar alltid blir riktiga länkar där. I mobilappen krävs
// EXPO_PUBLIC_APP_URL.
const ENV_APP_URL = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/+$/, "") || "";
const WEBB_URL = (typeof window !== "undefined" && window.location?.origin)
  ? window.location.origin.replace(/\/+$/, "") : "";
// Känd produktionsadress. Används i mobilappen om varken EXPO_PUBLIC_APP_URL
// eller en webbadress finns, så att QR-koder/länkar ändå blir riktiga länkar.
const PROD_URL = "https://vvs-uppdrag.vercel.app";
const APP_URL = ENV_APP_URL || WEBB_URL || PROD_URL;

export function sessionJoinUrl(code: string): string {
  if (!APP_URL) return code;
  return `${APP_URL}/elev/uppdrag/${encodeURIComponent(code)}`;
}

// Inbjudan till en LÄRARE: en länk som öppnar appen med skolans kod ifylld (?lk=…).
// Utan publicerad webbadress faller vi tillbaka på bara koden.
export function larareInbjudanUrl(joinCode: string): string {
  if (!APP_URL) return joinCode;
  return `${APP_URL}/?lk=${encodeURIComponent(joinCode)}`;
}

export function studentRedeemUrl(code: string): string {
  if (!APP_URL) return code;
  return `${APP_URL}/elev/redeem/${encodeURIComponent(code)}`;
}

export function materialArticleUrl(articleId: string): string {
  if (!APP_URL) return articleId;
  return `${APP_URL}/forrad/artikel/${encodeURIComponent(articleId)}`;
}
