# VVS Uppdrag

Uppdrag, material och examensprov för VVS-utbildningen. Expo-app (iOS, Android, webb)
med Supabase som backend.

## Examensprov (nytt)

Fliken **🎓 Examensprov** i lärarvyn bygger på VVS-Branschens Yrkesnämnds
"Gymnasiearbetet VVS-montör" (2018-10-17). Där finns 12 delmoment med samma
uppskattade tider som i originalet:

| Delmoment | Tid |
|---|---|
| Egna reflektioner | 1 tim |
| Drift- och skötselinstruktion | 3 tim |
| Monteringsanvisningar – klämringskopplingar | 2 tim |
| Egenkontroll | 1 tim |
| Tryck- och täthetskontroll | 3 tim |
| Riskbedömning | 2 tim |
| Normtid | 6 tim |
| Materialspecifikation | 6 tim |
| Teknisk beskrivning | 2 tim |
| Installation – slutet expansionskärl | 8 tim |
| Installation – varmvattenberedare | 8 tim |
| Installation – komplettering av badrum | 8 tim |

Varje delmoment kan startas i två lägen:

* **🎓 Övning** – facit, referensbild och AI-hjälp på. Ingen klocka. Gör om hur mycket som helst.
* **🔒 Skarpt läge** – klocka på uppskattad tid, facit/referens/AI av. När tiden är slut
  låses knapparna och eleven får besked om att lämna in. Klockan startar första gången
  eleven öppnar uppdraget och ligger kvar på enheten, så en omladdning inte ger ny tid.

Innehållet ligger i `lib/examVvs.ts` – ändra där, inte i databasen. Tidsgränsen sparas i
uppdragets `steps` (JSONB) via `lib/examMode.ts`, så ingen databasmigrering behövs.

## Publicering

Appen publiceras på **Vercel** (`https://vvs-uppdrag.vercel.app`) från `main` i
`github.com/cribb1979-cyber/vvs-uppdrag`. Vercel kör `npx expo export --platform web`
och serverar `dist/` med SPA-rewrite enligt `vercel.json`.

```bash
git push origin main     # Vercel bygger och publicerar automatiskt
```

`EXPO_PUBLIC_APP_URL` ska peka på produktionsadressen, så att QR-koder och
inbjudningslänkar fungerar även i mobilappen:

```
EXPO_PUBLIC_APP_URL=https://vvs-uppdrag.vercel.app
```

På webben används webbläsarens adress automatiskt om variabeln är tom.

## Infobank (QR i verkstaden)

Fliken **📷 Infobank** kopplar en QR-kod till en fysisk installation. Den som
scannar får funktion, driftsättning och flödesschema – **utan inloggning**, med
telefonens vanliga kamera.

* Adressen är `https://vvs-uppdrag.vercel.app/i/<token>` och ligger kvar så
  länge du vill; en utskriven QR blir aldrig ogiltig av sig själv.
* Läraren kan **stänga av visningen** direkt, sätta **visas från/till**, eller
  ta bort installationen (då svarar koden "hittades inte").
* Token är 16 slumpade hextecken, aldrig löpnummer – ingen kan gissa sig till
  en annan installations sida.
* Flödesschemat laddas upp som bild (fota CAD-ritningen eller exportera
  PNG/SVG från Cadverkstaden).

Kräver migrationen `supabase/migrations/0011_infobank.sql` (tabellen
`installations`, publik läsfunktion `installation_public` och bucketen
`installationer`).
