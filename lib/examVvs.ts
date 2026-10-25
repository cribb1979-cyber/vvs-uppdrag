// Examensprov för VVS-montör, byggt på VVS-Branschens Yrkesnämnds
// "Gymnasiearbetet VVS-montör" (2018-10-17). Tiderna är deras uppskattade
// tider. Innehållet är avsiktligt nära originalet så att eleven känner igen
// uppgifterna från det skarpa provet.

export type ExamKategori = "Dokumentation" | "Kontroll" | "Beräkning" | "Installation";

export interface ExamTask {
  id: string;
  titel: string;
  minut: number;
  kategori: ExamKategori;
  beskrivning: string;
  /** Punkter eleven bockar av / kontrollerar. */
  checklista: string[];
  /** Frågor som ska besvaras, i övningsläge med ledtråd. */
  fragor: string[];
  /** Ledtråd som bara visas i övningsläge. */
  ledtrad?: string;
}

export const EXAM_TASKS: ExamTask[] = [
  {
    id: "egna-reflektioner",
    titel: "Egna reflektioner",
    minut: 60,
    kategori: "Dokumentation",
    beskrivning: "Skriv ner vad du fått ut av den här arbetsuppgiften.",
    checklista: [],
    fragor: ["Vad gick lätt?", "Vad var svårast?", "Vad gör du annorlunda nästa gång?", "Vad lärde du dig?"],
    ledtrad: "Skriv kort och konkret. Det är din egen reflektion, inte en rapport.",
  },
  {
    id: "drift-och-skotsel",
    titel: "Drift- och skötselinstruktion",
    minut: 180,
    kategori: "Dokumentation",
    beskrivning:
      "Gör en enklare drift- och underhållsinstruktion som överlämnas till kunden när installationen är klar. " +
      "Instruktionen ska göra att kunden själv kan sköta anläggningen genom att söka information i den.",
    checklista: [
      "Uppbyggnad med flödesschema",
      "Funktion beskriven",
      "Produktblad bifogade",
      "Underhåll och prövning",
      "Felsökningsanvisningar",
      "Protokoll",
    ],
    fragor: [
      "Vad händer i anläggningen, steg för steg?",
      "Vilka underhållspunkter finns och hur ofta?",
      "Vad ska kunden göra vid ett larm eller stopp?",
    ],
    ledtrad: "Följ branschstandardens ordning. Flödesschemat ska gå att följa utan förkunskaper.",
  },
  {
    id: "klamringskopplingar",
    titel: "Monteringsanvisningar – klämringskopplingar",
    minut: 120,
    kategori: "Dokumentation",
    beskrivning:
      "På skolan används oftast ett fabrikat. Välj två andra fabrikat och redogör för dem med hjälp av tillverkarnas hemsidor.",
    checklista: [],
    fragor: [
      "Vilka rör förutom kopparrör kan skarvas?",
      "Hur hårt ska kopplingen dras?",
      "När ska stödhylsa användas?",
      "Hur förminskar man en koppling, till exempel 15 till 12?",
      "Finns det kopplingar till äldre utgående dimensioner?",
      "Kan man använda konor eller muttrar från andra fabrikat?",
    ],
    ledtrad: "Svara fabrikat för fabrikat. Skriv var du hittat uppgiften.",
  },
  {
    id: "egenkontroll",
    titel: "Egenkontroll",
    minut: 60,
    kategori: "Kontroll",
    beskrivning:
      "Egenkontroll innebär att företaget har checklistor som kontrollerar att installationen uppfyller de krav som ställs på material och arbete. " +
      "Checklistan ska anpassas till den installation som utförs.",
    checklista: [
      "Flödesriktningar stämmer enligt ritning",
      "Rätt ventiler monterade",
      "Rätt verktyg använt",
      "Inga rördelar skadade",
      "Upptäckta fel nedskrivna, även de som åtgärdats direkt",
    ],
    fragor: ["Vilka fel hittade du?", "Vad åtgärdade du direkt?", "Vad behöver någon annan titta på?"],
    ledtrad: "Skriv även fel som du rättar på en gång. Det är det som gör egenkontrollen värd något.",
  },
  {
    id: "tryck-och-tathet",
    titel: "Tryck- och täthetskontroll",
    minut: 180,
    kategori: "Kontroll",
    beskrivning:
      "Installationen ska tryck- och täthetskontrolleras innan den överlämnas till kund. Kontrollen utförs enligt Säker Vatten " +
      "om inte den tekniska beskrivningen anger något annat tryck. Se även \"Åtgärder före tryck- och täthetskontroll med vätska\" i Teknikhandboken. " +
      "Kontrollen utförs och dokumenteras med den mall som finns.",
    checklista: [
      "Rätt provtryck enligt Säker Vatten/teknisk beskrivning",
      "Åtgärder före kontroll med vätska genomförda",
      "Kontrollen genomförd",
      "Dokumenterad i mallen",
    ],
    fragor: ["Vilket provtryck gäller och varför?", "Hur länge ska provet stå?", "Vad gjorde du före provtryckningen?"],
    ledtrad: "Provtryck och tider finns i Säker Vatten. Hänvisa till rätt avsnitt.",
  },
  {
    id: "riskbedomning",
    titel: "Riskbedömning",
    minut: 120,
    kategori: "Dokumentation",
    beskrivning: "Gör en bedömning av vilka risker som kan förekomma vid installationsarbetet.",
    checklista: [],
    fragor: [
      "Vad finns för risker med maskiner?",
      "Vad finns för risker med verktyg?",
      "Vad finns för risker med materialet?",
      "Vilka krav ställs på din personliga skyddsutrustning?",
      "Finns kemiska ämnen som kräver extra skyddsutrustning?",
      "Används lyft eller ställningar?",
      "Hur agerar du vid ett olycksfall?",
      "Finns risker med användandet av installationen som ska med i drift- och skötselinstruktionen?",
    ],
    ledtrad: "En risk per rad: vad som kan hända, hur sannolikt det är och vad du gör åt det.",
  },
  {
    id: "normtid",
    titel: "Normtid",
    minut: 360,
    kategori: "Beräkning",
    beskrivning:
      "Gör en enklare beräkning efter normtidslistan för komplettering av badrum, för att få en uppfattning om hur länge en VVS-montör behöver. " +
      "Du som elev behöver mer tid – syftet är att förstå tidsåtgången.",
    checklista: [
      "Duschstång",
      "Duschblandare",
      "WC-stol",
      "Tvättställ",
      "Blandare och bottenventil TS",
      "Komplettering",
    ],
    fragor: [
      "Vad blir summan för kompletteringen?",
      "Uppskattad arbetstid för slutet expansionskärl?",
      "Uppskattad arbetstid för varmvattenberedare?",
    ],
    ledtrad: "Normtidslistan delas ut av läraren. Räkna post för post och summera.",
  },
  {
    id: "materialspecifikation",
    titel: "Materialspecifikation",
    minut: 360,
    kategori: "Beräkning",
    beskrivning:
      "Skriv upp material med artikelnummer och pris för att få en uppfattning om vad materialet till installationen kostar. Gör en materiallista för varje installationsuppgift.",
    checklista: ["Artikelnummer", "Dimension", "Mängd", "Pris", "Summa"],
    fragor: ["Vad kostar materialet till expansionkärlet?", "Vad kostar materialet till varmvattenberedaren?", "Vad kostar badrums komplettering?"],
    ledtrad: "Ta med spill och smådelar. En lista utan kopplingar och tätningar blir för billig.",
  },
  {
    id: "teknisk-beskrivning",
    titel: "Teknisk beskrivning",
    minut: 120,
    kategori: "Dokumentation",
    beskrivning:
      "Gör en enklare teknisk beskrivning: allmän orientering och arbetets gång, samt vilka rör, apparater och komponenter som ingår. " +
      "Ritningar och beskrivningar kompletterar varandra.",
    checklista: ["Allmän orientering", "Arbetsgång", "Rör och dimensioner", "Apparater", "Komponenter"],
    fragor: ["Vad skiljer beskrivningen från ritningen?", "Vilka komponenter styr arbetets ordning?"],
    ledtrad: "AMA behöver inte tillämpas fullt ut, men strukturen kan följas.",
  },
  {
    id: "expansionskarl",
    titel: "Installation – slutet expansionskärl",
    minut: 480,
    kategori: "Installation",
    beskrivning:
      "Montera ett slutet expansionskärl med den säkerhetsutrustning installationen kräver. Säkerhetsutrustningen ska monteras med lösa komponenter, " +
      "inte med samlingsrör. Installationen ska ha en avstängningsventil så systemet inte behöver tappas ur vid byte av kärl. " +
      "Utför med mekanisk koppling, presskoppling och lödskarv. Rita och beskriv även hur ett öppet expansionskärl fungerar.",
    checklista: [
      "Dimensionskontroll",
      "Anslutningar",
      "Strömningsriktning",
      "Funktion",
      "Säkerhetsventiler",
      "Luftning",
      "Avtappningar",
      "Upphängning/klamring",
      "Monterat enligt ritningar",
      "Monterat enligt arbetsbeskrivning",
      "Monterat enligt monteringsanvisningar",
      "Installationen fackmässigt utförd",
      "Använt rätt verktyg",
      "Heta arbeten",
      "Provtryckning",
      "Städning av arbetsplatsen",
    ],
    fragor: ["Hur fungerar ett öppet expansionskärl jämfört med ett slutet?", "Varför ska säkerhetsutrustningen ha lösa komponenter?"],
    ledtrad: "Kontrollmomenten är samma lista som läraren använder vid bedömning.",
  },
  {
    id: "varmvattenberedare",
    titel: "Installation – varmvattenberedare",
    minut: 480,
    kategori: "Installation",
    beskrivning:
      "Montera och koppla in en varmvattenberedare med den säkerhetsutrustning installationen kräver. Säkerhetsutrustningen ska monteras med lösa komponenter. " +
      "Beredaren kan bestå av fixturen med rundgång. Utför med mekanisk koppling, presskoppling och lödskarv.",
    checklista: [
      "Dimensionskontroll",
      "Anslutningar",
      "Strömningsriktning",
      "Säkerhetsventiler",
      "Blandningsventil",
      "Luftning",
      "Avtappning",
      "Upphängning/klamring",
      "Monterat enligt ritning och anvisning",
      "Heta arbeten",
      "Provtryckning",
      "Städning",
    ],
    fragor: ["Vad gör rundgången för nytta?", "Vilka skyddsfunktioner krävs på en beredare?"],
    ledtrad: "Säkerhetsutrustningen är det som bedöms hårdast. Ta den först.",
  },
  {
    id: "komplettering-badrum",
    titel: "Installation – komplettering av badrum",
    minut: 480,
    kategori: "Installation",
    beskrivning:
      "Montera WC-stol, tvättställ och badkar eller dusch. Avlopp ansluts till befintliga avsättningar. Rören dras synligt på vägg och ska i första hand bockas. " +
      "När arbetet är utfört ska egenkontroll göras av den som utfört installationen.",
    checklista: [
      "WC-stol monterad",
      "Tvättställ monterad",
      "Badkar eller dusch monterad",
      "Avlopp anslutet till befintlig avsättning",
      "Rör dragna synligt och bockade",
      "Höjder kontrollerade",
      "Egenkontroll utförd",
    ],
    fragor: [
      "Vilka höjder gäller för WC, tvättställ och dusch?",
      "Var ska varm- respektive kallvatten ligga?",
      "Hur kontrollerade du fallet mot avloppet?",
    ],
    ledtrad: "Kontrollera höjder och avstånd mot mått innan du börjar montera.",
  },
];

export function examTask(id: string): ExamTask | undefined {
  return EXAM_TASKS.find((t) => t.id === id);
}

export function timmar(minut: number): string {
  const h = Math.floor(minut / 60);
  const m = minut % 60;
  if (h && m) return `${h} tim ${m} min`;
  if (h) return `${h} tim`;
  return `${m} min`;
}
