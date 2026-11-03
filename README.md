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

## Uppdragsbank och Säkervatten 2026:1

Fliken **🏦 Uppdragsbank** låter lärare dela färdiga uppdrag med varandra.

* **Sätt in:** öppna ett av dina uppdrag → **“Sätt in i uppdragsbanken”**.
  Uppdraget fryses som en kopia (material, quizfrågor, bedömning och
  Säkervatten-regler). Det går till status **Granskas**.
* **Granska:** en annan lärare öppnar mallen och väljer **Godkänn** eller
  **Avslå**. Ingen kan granska sin egen mall.
* **Ta ut:** en godkänd mall kan tas ut till din skola. Då skapas en **djup
  kopia** som ett utkast – banken och din kopia påverkar inte varandra.
* **Version:** en mall har `version`. Ett uttag sparar `source_mall_id` och
  `source_version`, så man kan se varifrån kopian kom.

Säkervatten-reglerna ligger i `lib/sakervatten.ts` som koder (t.ex.
`tappvatten-fogar`) och kopplas till uppdrag via `assignments.rule_refs`.
Appen visar en kort **egen sammanfattning** och länkar till
<https://sakervatten.se/branschregler2026/>. Den officiella regeltexten
återges inte – vill man visa hela texten i appen krävs tillstånd från
Säker Vatten.

Fliken **🛡️ Säkervatten** samlar regelbiblioteket i `lib/sakervatten.ts`
(38 regler) grupperat per område, med sökning och expanderbara
kontrollpunkter. Även där är texterna appens egna sammanfattningar; full
regeltext finns i boken och via länken till sakervatten.se.

Från fliken kan läraren också **skapa en övning** per regel eller per område.
Formuläret förifylls med titel, mål, egenkontroll, regelkoppling och
förvalda materialrader (`lib/ovningsmaterial.ts`). Läraren kan ändra allt
innan uppdraget sparas.

Kräver migrationen `supabase/migrations/0012_uppdragsbank.sql`. Kör den i
Supabase SQL Editor (eller `supabase db push`) innan fliken används.

Vill du ha sju färdiga exempeluppdrag i banken kör du även
`supabase/seed/0012_uppdragsbank_exempel.sql`. Skriptet kräver minst en
godkänd lärare och kan köras flera gånger utan att dubbletter skapas.

## Beställningar och RSK

Eleven skriver sin materialplan med RSK-nummer. När planen skickas in visas
den under **Beställningar** hos läraren. Därifrån kan läraren:

* **Skapa beställning** – raderna läggs i beställningslistan, RSK matchas mot
  Förrådet och `source_plan_item_id` hindrar att samma planrad beställs två
  gånger.
* **Spara RSK till Förrådet** – lägger upp en artikel per unikt RSK-nummer.
  Ett unikt index per skola och RSK gör att samma artikel inte kan skapas
  flera gånger.
* **QR-etiketter** – använder samma deduplicerade flöde och öppnar
  etikettstudion med en QR-etikett per material.

RSK finns i elevens materialplan och i beställningarna, inte i lärarens dolda
materialkrav – eleven tar reda på RSK själv.

Kräver migrationerna `0013_materialplan_rsk.sql` och
`0014_material_catalog_rsk_unique.sql`.

## AI-läge (lokalt)

I formuläret för nytt uppdrag finns **✨ Skapa med AI**. Läraren beskriver
uppdraget och väljer:

* **Kvalitet** – `gemma2:9b`, bättre text men långsammare
* **Snabb** – `stoffe-stabil`, snabbare och lite enklare

AI:n får Säkervatten-reglerna, bankmallarna och Förrådets artiklar som
underlag och returnerar ett strukturerat utkast. AI:n kontrollerar
materialförslagen mot Förrådet; RSK är elevens uppgift och sparas i elevens
materialplan/beställning, inte i lärarens facit. Utkastet hamnar i formuläret
och sparas först när läraren trycker på knappen.

Backenden anropar lokal Ollama på Y900 via `functions/generate-assignment`.
Styrs med `OLLAMA_URL`, `OLLAMA_MODEL_QUALITY`, `OLLAMA_MODEL_QUICK` och
`AI_TIMEOUT_MS`. Ingen API-kostnad och ingen elevdata lämnar skolan.

## Elevens drift- och underhållsplan

I både QR-flödet och klassflödet finns en textruta **🛠 Drift- och
underhållsplan**. Eleven skriver och sparar per uppdrag, och läraren ser
texten i uppdragets deltagarlista. Kräver migrationen
`supabase/migrations/0016_maintenance_plan.sql`.

## Kommentarer och insamlade svar

Lärarens kommentar skrivs i elevens materialplan och visas nu även direkt på
elevens uppdragssida. Läraren ser elevens anteckning, egenkontroll, reflektion
och drift- och underhållsplan under **Insamlat** i uppdraget. Knappen
**Uppdatera svar** hämtar det senaste utan att man lämnar sidan.

## Checklista före inlämning

På materialplanssidan visas en checklista. Eleven kan bara skicka in
materialplanen när:

* materialplanen har minst en rad
* egenkontrollen är sparad (QR-flödet, om uppdraget har punkter)
* reflektionen är sparad (QR-flödet, om uppdraget har frågor)
* drift- och underhållsplanen är sparad (uppdrag)

Checklistan visar ✓/☐ och listar det som saknas. Samma kontroll görs i
`submit_material_plan`, så den kan inte kringgås. Klassflödet kräver
materialplan + underhållsplan tills egenkontroll och reflektion finns där.

## Elevens omdöme

Eleven når **🎓 Se mitt omdöme** från både QR- och klassflödet. Vyn visar
bedömningskriterierna när läraren har publicerat bedömningen. Rena
QR-sessioner som inte är kopplade till en klass/student kan ännu inte bedömas
i lärargränssnittet – där är lärarens kommentar den återkoppling som visas.

Uppdragets valda Säkervatten-regler följer med till eleven: `join_session`
och `open_assignment_as_student` returnerar `rule_refs`, och elevens
uppdragssida visar rubrik, sammanfattning och kontrollpunkter för varje regel.
Kräver migrationen `supabase/migrations/0019_student_rule_refs.sql`.

## Bjud in lärare

På **Hem** finns QR-kod, skolkod och knappen **Dela inbjudan**. Länken går
till `/signup?lk=...` och fyller i skolkoden automatiskt. Kollegan skapar
konto, väljer **Gå med i skola** och skickar ansökan. Ansökan blir
**väntande** tills en admin godkänner den under **Inställningar → Väntande
lärare**. Äldre `/?lk=...`-länkar skickas vidare till registreringen.

## Elevlänk för datorer

Varje QR-session visar en direktlänk (`/elev/uppdrag/<kod>`) och knappen
**📋 Kopiera elevlänk**. Läraren kan klistra in länken i lärplattformen eller
mejla den, så elever på dator slipper skanna QR-koden.
