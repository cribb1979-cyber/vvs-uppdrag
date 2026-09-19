// Bygger QR-kodbara länkar. Om EXPO_PUBLIC_APP_URL är satt (appen är
// deployad någonstans) kodar vi en riktig https-länk, så att telefonens
// VANLIGA kamera kan öppna den direkt -- ingen appinstallation krävs.
// Utan den (lokal utveckling) faller vi tillbaka till ren textkod, som
// fortfarande fungerar med appens egen QR-skanner och manuell inmatning.
const APP_URL = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/+$/, "");

export function sessionJoinUrl(code: string): string {
  if (!APP_URL) return code;
  return `${APP_URL}/elev/uppdrag/${encodeURIComponent(code)}`;
}

export function studentRedeemUrl(code: string): string {
  if (!APP_URL) return code;
  return `${APP_URL}/elev/redeem/${encodeURIComponent(code)}`;
}

export function materialArticleUrl(articleId: string): string {
  if (!APP_URL) return articleId;
  return `${APP_URL}/forrad/artikel/${encodeURIComponent(articleId)}`;
}
