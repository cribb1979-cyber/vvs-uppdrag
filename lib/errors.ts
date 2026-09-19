// Extraherar ett läsbart felmeddelande oavsett feltyp. PostgrestError/
// AuthError från supabase-js ärver visserligen Error i denna version, men
// vi litar inte blint på det (framtida versioner, eller andra kastade
// objekt) -- kollar efter en `message`-sträng generellt istället för att
// bara falla tillbaka på en generisk text vid minsta avvikelse.
export function getErrorMessage(e: unknown, fallback = "Något gick fel."): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  if (typeof e === "string" && e) return e;
  return fallback;
}
