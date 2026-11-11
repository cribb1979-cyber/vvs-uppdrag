// Bockövningar för VVS-utbildningen.
// Språket följer verkstadens yrkesspråk: bockmått, bockradie, ovalitet,
// veckbildning, skäva, klämringskoppling, täthetsprovning osv.
//
// Övningarna är statiska och versioneras i koden. Ett uppdrag som skapas
// från en övning får moment, kontrollpunkter och materialrader förifyllda.

export type BockNiva = "Grund" | "Fördjupning" | "Mästare";

export interface BockMaterial {
  component: string;
  dimension?: string;
  quantity?: number;
}

export interface BockOvning {
  /** Stabil kod. Ändra aldrig i efterhand. */
  id: string;
  titel: string;
  niva: BockNiva;
  tidMin: number;
  sammanfattning: string;
  /** Enkel förklaring för eleven – vad övningen går ut på och varför. */
  forklaring?: string;
  mal: string[];
  material: BockMaterial[];
  verktyg: string[];
  moment: string[];
  kontroll: string[];
  vanligaFel: string[];
  yrkestermer: string[];
  sakerhet: string[];
  reflektion: string[];
  /** Källa/idé, t.ex. en video eller ett leverantörsdokument. */
  kalla?: string;
}

export const BOCK_IMAGE_BASE = "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning";

/** Lagrad sökväg i quiz-images-bucketen. quizImageUrl() bygger publik URL. */
export function bockImagePath(id: string): string {
  return `${BOCK_IMAGE_BASE}/${id}.png`;
}

export const BOCKNINGAR: BockOvning[] = [
  {
    id: "bock-90-koppar-15",
    titel: "Bocka 90° med bockfjäder – koppar 15 mm",
    niva: "Grund",
    tidMin: 45,
    sammanfattning:
      "Bocka ett 15 mm kopparrör 90° med bockfjäder. Öva bockmått, bockradie och kontroll av bockvinkel och ovalitet.",
    mal: [
      "Mäta och märka ut bockmått före bockning.",
      "Välja rätt bockfjäder för rördiameter och bockradie.",
      "Bocka ett 15 mm kopparrör 90° utan veck eller skador.",
      "Kontrollera bockvinkel, bockradie och ovalitet med vinkelhake och skjutmått.",
      "Skäva rörändarna och kontrollera att röret är fritt från grader.",
    ],
    material: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 1 },
      { component: "Klämringskoppling rak", dimension: "15 mm", quantity: 2 },
      { component: "Propp", dimension: '1/2"', quantity: 2 },
      { component: "Fiberpackning", dimension: '1/2"', quantity: 2 },
    ],
    verktyg: [
      "Rörkap",
      "Skäverktyg",
      "Gradverktyg",
      "Bockfjäder 15 mm",
      "Vinkelhake",
      "Tumstock",
      "Märkpenna",
      "Skjutmått",
    ],
    moment: [
      "Mät upp bockmåttet från röränden och märk bockpunkten med märkpenna.",
      "Kontrollera att bockfjädern är hel och av rätt dimension för 15 mm rör.",
      "För in bockfjädern så att den täcker hela bockzonen.",
      "Bocka långsamt och jämnt mot vinkelhaken tills röret är 90°.",
      "Dra ut bockfjädern utan att vrida röret.",
      "Kapa röret till rätt längd, skäva insida och utsida och kontrollera att röret är fritt från grader.",
      "Kontrollera bockvinkel, bockradie och ovalitet. Dokumentera resultatet i egenkontrollen.",
    ],
    kontroll: [
      "Bockvinkeln är 90° ±2°.",
      "Bockradien är jämn och utan veck.",
      "Ovaliteten är mindre än 10 % av rördiametern.",
      "Röret är skävt och fritt från grader.",
      "Inga sprickor eller sträckningar i bocken.",
    ],
    vanligaFel: [
      "Bockfjädern är för kort eller för liten, så röret veckar sig.",
      "Bocken blir för snäv och röret blir ovalt.",
      "Röret bockas för kallt eller för hårt, så det spricker.",
      "Bockmåttet mäts från fel punkt, så längden blir fel.",
      "Röret skävas inte efter kapning.",
    ],
    yrkestermer: [
      "bockfjäder",
      "bockmått",
      "bockradie",
      "bockvinkel",
      "ovalitet",
      "veckbildning",
      "sträckning",
      "skäva",
    ],
    sakerhet: [
      "Vassa rörändar – använd handskar.",
      "Bockfjädern kan slinta – håll röret stadigt.",
      "Använd skyddsglasögon vid kapning och skävning.",
      "Spänn fast röret om det behövs.",
    ],
    reflektion: [
      "Hur påverkar bockradien flödet i röret?",
      "Varför är det viktigt att skäva röret efter kapning?",
      "Vad händer med röret om bockfjädern är för kort?",
      "Hur kontrollerar du att bocken är godkänd?",
    ],
  },
  {
    id: "bock-45-koppar-15",
    titel: "Bocka 45° och kontrollera bockvinkel",
    niva: "Grund",
    tidMin: 30,
    sammanfattning:
      "Bocka ett 15 mm kopparrör 45° med bockfjäder och kontrollera vinkeln mot en vinkelmall.",
    mal: [
      "Mäta och märka ut bockmått.",
      "Bocka 45° med bockfjäder utan veck.",
      "Kontrollera bockvinkel och ovalitet.",
      "Skäva rörändarna.",
    ],
    material: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 1 },
      { component: "Propp", dimension: '1/2"', quantity: 2 },
    ],
    verktyg: ["Rörkap", "Skäverktyg", "Gradverktyg", "Bockfjäder 15 mm", "Vinkelmall", "Tumstock"],
    moment: [
      "Mät upp bockmåttet och märk bockpunkten.",
      "För in bockfjädern i bockzonen.",
      "Bocka långsamt till 45° och kontrollera mot vinkelmallen.",
      "Dra ut bockfjädern och kontrollera ovaliteten.",
      "Kapa och skäva röret.",
    ],
    kontroll: [
      "Bockvinkeln är 45° ±2°.",
      "Bockradien är jämn.",
      "Ingen veckbildning på insidan.",
      "Ovaliteten är mindre än 10 %.",
    ],
    vanligaFel: [
      "Bocken blir för stor eller för liten.",
      "Bockfjädern är för kort.",
      "Röret vrids under bockningen.",
    ],
    yrkestermer: ["bockvinkel", "bockmått", "bockradie", "ovalitet", "vinkelmall", "skäva"],
    sakerhet: ["Handskar vid vassa rörändar.", "Skyddsglasögon vid kapning."],
    reflektion: [
      "Varför används 45° ofta i trånga utrymmen?",
      "Hur påverkar en felaktig bockvinkel nästa anslutning?",
      "Vad gör du om bocken blir för stor?",
    ],
  },
  {
    id: "bock-offset-45",
    titel: "Parallellförskjutning (offset) – två 45°-bockar",
    niva: "Fördjupning",
    tidMin: 60,
    sammanfattning:
      "En offset används när röret ska fortsätta rakt men hamna på en annan nivå eller i sidled. Du gör två motriktade 45°-bockar. Här får du förklaringen steg för steg.",
    forklaring:
      "Tänk dig att röret går rakt fram. Du vill inte svänga av – du vill bara flytta röret lite åt sidan eller uppåt och sedan fortsätta rakt. Det gör du med två lika stora bockar åt motsatt håll: först 45° uppåt, sedan 45° tillbaka. Resultatet blir en förskjutning – röret fortsätter i samma riktning men på en ny nivå.\n\n" +
      "Orden: offset = hur mycket röret förskjuts. Bockvinkel = hur mycket du böjer i varje bock (här 45°). Bockmått = avståndet mellan de två bockpunkterna. Parallellitet = de två raka delarna är parallella.\n\n" +
      "Räkneexempel: vill du flytta röret 50 mm med 45°-bockar blir avståndet mellan bockarna 50 × 1,41 ≈ 70 mm. Vill du flytta 100 mm blir det 100 × 1,41 ≈ 141 mm. Kontrollera alltid mot din bockverktygs anvisning – måtten kan skilja mellan fabrikat.\n\n" +
      "Så gör du: mät offset vinkelrätt, räkna ut bockmåttet, märk båda bockpunkterna, bocka första 45°, vänd röret, bocka andra 45° åt motsatt håll och kontrollera att de raka delarna är parallella.",
    mal: [
      "Kunna förklara vad en offset är och varför den används.",
      "Mäta offset vinkelrätt mellan den gamla och nya centrumlinjen.",
      "Räkna ut bockmåttet med faktor 1,41 vid 45°.",
      "Bocka två motriktade 45°-bockar i samma plan.",
      "Kontrollera offsetmått, parallellitet och bockplan.",
    ],
    material: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 1 },
      { component: "Propp", dimension: '1/2"', quantity: 2 },
    ],
    verktyg: ["Bockfjäder 15 mm", "Vinkelhake", "Tumstock", "Märkpenna", "Skjutmått", "Ritning/mall"],
    moment: [
      "Bestäm offsetmåttet: hur mycket ska röret flyttas? Mät vinkelrätt mellan den gamla och den nya centrumlinjen.",
      "Välj bockvinkel, till exempel 45°.",
      "Räkna ut bockmåttet: offset × 1,41 vid 45°.",
      "Märk första bockpunkten och andra bockpunkten med bockmåttet mellan.",
      "Bocka första 45°-bocken.",
      "Vänd röret och bocka andra 45°-bocken åt motsatt håll, i samma plan.",
      "Kontrollera offsetmått, parallellitet och att bockarna ligger i samma plan.",
      "Skäva rörändarna och dokumentera resultatet.",
    ],
    kontroll: [
      "Offsetmåttet stämmer med ritningen ±2 mm.",
      "Båda bockvinklarna är 45° ±2°.",
      "De raka delarna är parallella.",
      "Bockarna ligger i samma plan.",
      "Inga veck eller ovalitet.",
    ],
    vanligaFel: [
      "Man bockar åt samma håll i stället för motsatt.",
      "Man mäter offset snett i stället för vinkelrätt.",
      "Man glömmer att vända röret mellan bockarna.",
      "Bockarna hamnar i olika plan.",
      "Fel bockmått eftersom faktorn inte används.",
    ],
    yrkestermer: [
      "offset",
      "förskjutning",
      "bockmått",
      "bockvinkel",
      "parallellitet",
      "motriktad bock",
      "centrumlinje",
    ],
    sakerhet: ["Spänn fast röret vid bockning.", "Handskar och skyddsglasögon."],
    reflektion: [
      "Varför ska bockarna vara motriktade?",
      "Vad händer om du använder 30° i stället för 45°?",
      "Hur påverkar offsetmåttet bockmåttet?",
      "Varför är det viktigt att bockarna ligger i samma plan?",
    ],
    kalla:
      "Faktorn 1,41 för 45° är samma princip som i S-bock-övningen (RörmokarLäraren). Kontrollera mot din bockverktygstillverkares anvisning.",
  },
  {
    id: "bock-dubbel-90",
    titel: "Dubbelbock/U-bock efter mått",
    niva: "Fördjupning",
    tidMin: 60,
    sammanfattning:
      "Bocka en U-form med två 90°-bockar. Kontrollera cc-mått, höjd och att benen blir parallella.",
    mal: [
      "Mäta upp cc-mått och höjd.",
      "Bocka två 90°-bockar i samma plan.",
      "Kontrollera cc-mått, höjd och parallellitet.",
      "Skäva och dokumentera resultatet.",
    ],
    material: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 1 },
      { component: "Propp", dimension: '1/2"', quantity: 2 },
    ],
    verktyg: ["Bockfjäder 15 mm", "Vinkelhake", "Tumstock", "Skjutmått", "Märkpenna"],
    moment: [
      "Mät upp cc-måttet och märk båda bockpunkterna.",
      "Bocka första 90°-bocken.",
      "Bocka andra 90°-bocken i samma plan.",
      "Kontrollera cc-mått, höjd och parallellitet.",
      "Skäva rörändarna och kontrollera bockarna.",
    ],
    kontroll: [
      "Cc-måttet stämmer ±2 mm.",
      "Höjden stämmer ±2 mm.",
      "Båda bockvinklarna är 90° ±2°.",
      "Benen är parallella och utan veck.",
    ],
    vanligaFel: [
      "Benen hamnar inte i samma plan.",
      "Cc-måttet blir fel.",
      "Andra bocken vrids.",
      "Bockarna blir för snäva.",
    ],
    yrkestermer: ["dubbelbock", "cc-mått", "bockmått", "parallellitet", "bockplan"],
    sakerhet: ["Spänn fast röret.", "Handskar och skyddsglasögon."],
    reflektion: [
      "Varför är det viktigt att båda bockarna ligger i samma plan?",
      "Hur kontrollerar du cc-måttet efter bockning?",
      "Vad händer om den andra bocken blir för snäv?",
    ],
  },
  {
    id: "bock-efter-ritning",
    titel: "Bocka efter ritning och mall",
    niva: "Fördjupning",
    tidMin: 75,
    sammanfattning:
      "Läs en enkel rörritning, måttsätt och bocka röret efter mall. Kontrollera mått, vinklar och toleranser mot ritningen.",
    mal: [
      "Läsa byggmått och centrumlinjer på en rörritning.",
      "Mäta ut bockpunkter och bockmått.",
      "Bocka i rätt ordning efter mall.",
      "Kontrollera mått, vinklar och toleranser.",
    ],
    material: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 2 },
      { component: "Propp", dimension: '1/2"', quantity: 2 },
      { component: "Ritning/mall", quantity: 1 },
    ],
    verktyg: ["Bockfjäder 15 mm", "Rörbock", "Vinkelhake", "Tumstock", "Skjutmått", "Märkpenna"],
    moment: [
      "Läs ritningen och markera byggmått och centrumlinjer.",
      "Bestäm bockpunkter och bockmått.",
      "Märk röret och bocka i rätt ordning.",
      "Kontrollera röret mot mallen.",
      "Justera vid behov och dokumentera resultatet.",
    ],
    kontroll: [
      "Måtten stämmer med ritningen ±2 mm.",
      "Vinklarna stämmer ±2°.",
      "Bockarna ligger i rätt plan.",
      "Röret följer mallen utan veck.",
    ],
    vanligaFel: [
      "Fel mått avläses från ritningen.",
      "Bockarna tas i fel ordning.",
      "Bockmåttet tappas bort.",
      "Röret vrids mellan bockarna.",
    ],
    yrkestermer: ["byggmått", "centrumlinje", "bockpunkt", "mall", "måttsättning", "tolerans"],
    sakerhet: ["Handskar och skyddsglasögon.", "Spänn fast röret vid bockning."],
    reflektion: [
      "Varför är det bättre att bocka efter mall än att gissa?",
      "Vilket mått är viktigast att kontrollera först?",
      "Hur gör du om en bock blir fel mitt i serien?",
    ],
  },
  {
    id: "bock-tunnvaggig",
    titel: "Bocka tunnväggigt kopparrör utan veck",
    niva: "Mästare",
    tidMin: 60,
    sammanfattning:
      "Bocka ett tunnväggigt kopparrör med stor bockradie utan veck och med kontrollerad ovalitet.",
    mal: [
      "Välja rätt bockfjäder för tunnväggigt rör.",
      "Mjukglödga röret vid behov.",
      "Bocka med stor bockradie utan veck.",
      "Kontrollera ovalitet och sträckning.",
    ],
    material: [
      { component: "Tunnväggigt kopparrör", dimension: "15 mm", quantity: 1 },
      { component: "Propp", dimension: '1/2"', quantity: 2 },
    ],
    verktyg: ["Bockfjäder 15 mm", "Rörbock", "Vinkelhake", "Skjutmått", "Värmekälla för mjukglödgning"],
    moment: [
      "Kontrollera rörtyp och väggtjocklek.",
      "Välj rätt bockfjäder och kontrollera att den är hel.",
      "Mjukglödga röret om det behövs och låt det svalna kontrollerat.",
      "Bocka långsamt med stor bockradie.",
      "Kontrollera ovalitet, veck och sträckning.",
      "Skäva rörändarna.",
    ],
    kontroll: [
      "Ovaliteten är mindre än 10 %.",
      "Inga veck på insidan.",
      "Jämn bockradie.",
      "Inga sprickor eller sträckningar.",
      "Rätt bockvinkel.",
    ],
    vanligaFel: [
      "För snäv bock.",
      "För kort bockfjäder.",
      "Röret bockas för kallt.",
      "Röret är för hårt och spricker.",
    ],
    yrkestermer: ["tunnväggigt rör", "mjukglödgning", "bockradie", "ovalitet", "sträckning", "veckbildning"],
    sakerhet: [
      "Varmt rör efter glödgning – använd handskar.",
      "Skyddsglasögon.",
      "Brandrisk vid värmekälla.",
    ],
    reflektion: [
      "Varför är tunnväggigt rör känsligare för veck?",
      "När behöver röret mjukglödgas?",
      "Hur påverkar bockradien hållfastheten?",
    ],
  },
  {
    id: "bock-pex-16",
    titel: "Bocka PEX 16 mm med bockfjäder",
    niva: "Grund",
    tidMin: 30,
    sammanfattning:
      "Bocka PEX 16 mm med bockfjäder för PEX. Kontrollera minsta bockradie och att röret inte knäcks.",
    mal: [
      "Känna till PEX-bockfjäder och minsta bockradie.",
      "Bocka PEX utan att röret knäcks.",
      "Kontrollera att röret är runt efter bockning.",
      "Montera stödhylsa och presskoppling.",
    ],
    material: [
      { component: "PEX-rör", dimension: "16 mm", quantity: 1 },
      { component: "Presskoppling", dimension: "16 mm", quantity: 2 },
      { component: "Stödhylsa", dimension: "16 mm", quantity: 2 },
    ],
    verktyg: ["PEX-kap", "Bockfjäder för PEX", "Pressverktyg", "Tumstock", "Märkpenna"],
    moment: [
      "Mät upp och märk bockpunkten.",
      "För in bockfjädern för PEX i röret.",
      "Bocka långsamt och kontrollera bockradien.",
      "Dra ut bockfjädern och kontrollera att röret inte är knäckt.",
      "Montera stödhylsa och presskoppling enligt tillverkarens anvisning.",
    ],
    kontroll: [
      "Minsta bockradie enligt tillverkaren är uppfylld.",
      "Röret är inte knäckt eller tillplattat.",
      "Stödhylsan sitter rätt.",
      "Presskopplingen är pressad med rätt verktyg.",
    ],
    vanligaFel: [
      "För snäv bock utan bockfjäder.",
      "Fel bockfjäder för PEX.",
      "Stödhylsa saknas.",
      "Presskopplingen är inte pressad.",
    ],
    yrkestermer: ["PEX", "bockfjäder för PEX", "minsta bockradie", "stödhylsa", "presskoppling", "knäck"],
    sakerhet: ["Handskar och skyddsglasögon.", "Använd rätt pressverktyg."],
    reflektion: [
      "Varför får PEX inte bockas för snävt?",
      "Vad händer om stödhylsan saknas?",
      "Hur kontrollerar du att presskopplingen är klar?",
    ],
  },
  {
    id: "bock-anslut-tathet",
    titel: "Bocka och anslut – täthetsprovning",
    niva: "Fördjupning",
    tidMin: 60,
    sammanfattning:
      "Bocka 90°, anslut med klämringskopplingar och täthetsprova installationen. Koppla ihop bockning med egenkontroll och provtryck.",
    mal: [
      "Bocka ett 15 mm kopparrör 90°.",
      "Montera klämringskopplingar på rätt sätt.",
      "Täthetsprova installationen med vatten.",
      "Dokumentera provtryck och resultat.",
    ],
    material: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 1 },
      { component: "Klämringskoppling rak", dimension: "15 mm", quantity: 4 },
      { component: "Propp", dimension: '1/2"', quantity: 2 },
      { component: "Fiberpackning", dimension: '1/2"', quantity: 4 },
    ],
    verktyg: [
      "Bockfjäder 15 mm",
      "Rörkap",
      "Skäverktyg",
      "Gradverktyg",
      "Skiftnyckel",
      "Tryckprovningspump",
      "Manometer",
    ],
    moment: [
      "Bocka 90° enligt bockmåttet.",
      "Kapa och skäva rörändarna.",
      "Montera klämringskopplingarna och dra åt enligt anvisning.",
      "Fyll systemet med vatten och lufta.",
      "Höj trycket försiktigt till 0,6 MPa och kontrollera alla fogar.",
      "Dokumentera provtryck, tid och resultat i egenkontrollen.",
    ],
    kontroll: [
      "Bockvinkeln är 90° ±2°.",
      "Kopplingarna är åtdragna och tätar.",
      "Inga läckor vid 0,6 MPa.",
      "Provtrycket är dokumenterat.",
    ],
    vanligaFel: [
      "Kopplingen är inte åtdragen.",
      "Röret är inte skävt.",
      "För högt provtryck.",
      "Luftning är glömd.",
    ],
    yrkestermer: [
      "klämringskoppling",
      "åtdragningsmoment",
      "täthetsprovning",
      "provtryck",
      "manometer",
      "egenkontroll",
    ],
    sakerhet: [
      "Skyddsglasögon och handskar.",
      "Tryckprovning med vatten – inte luft.",
      "Överskrid inte komponenternas märktryck.",
    ],
    reflektion: [
      "Varför täthetsprovar man innan röret byggs in?",
      "Vad gör du om en fog läcker vid provtryck?",
      "Varför är det viktigt att dokumentera provtrycket?",
    ],
  },
  {
    id: "bock-serie-insida",
    titel: "Bocka i serie – L-, U- och Z-bock med insida som måttreferens",
    niva: "Mästare",
    tidMin: 75,
    sammanfattning:
      "Bocka två eller flera 90°-bockar i serie (L-, U- eller Z-bock) och mät från rörets insida i stället för centrum. Kompensera med halva ytterdiametern och kontrollera cc-måttet.",
    mal: [
      "Förstå skillnaden mellan att mäta från centrum och från rörets insida.",
      "Beräkna kompensationen: halva ytterdiametern (7,5 mm för 15 mm rör, 6 mm för 12 mm rör).",
      "Använda bockverktygets X-markering på rätt sätt.",
      "Bocka L-, U- eller Z-bock i serie med rätt cc-mått.",
      "Kontrollera cc-mått, bockvinklar, parallellitet och att bockarna ligger i samma plan.",
    ],
    material: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 2 },
      { component: "Propp", dimension: '1/2"', quantity: 2 },
      { component: "Ritning/mall", quantity: 1 },
    ],
    verktyg: [
      "Rörbock (bocknyckel)",
      "Bockfjäder 15 mm",
      "Vinkelhake",
      "Tumstock",
      "Skjutmått",
      "Märkpenna",
    ],
    moment: [
      "Mät cc-måttet mellan bockarna enligt ritning, till exempel 200 mm.",
      "Välj referens: mät från rörets insida i stället för från centrumlinjen.",
      "Beräkna kompensationen: halva ytterdiametern (7,5 mm för 15 mm rör, 6 mm för 12 mm rör).",
      "Märk röret på rätt plats och kontrollera markeringen mot bockverktygets X-markering.",
      "Bocka första 90°-bocken och kontrollera bockvinkeln.",
      "Bocka nästa bock i serien (L-, U- eller Z-bock) med samma referens och kompensation.",
      "Kontrollera cc-mått, bockvinklar, parallellitet och att bockarna ligger i samma plan.",
      "Dokumentera mått och resultat i egenkontrollen.",
    ],
    kontroll: [
      "Cc-måttet stämmer med ritningen ±2 mm.",
      "Båda bockvinklarna är 90° ±2°.",
      "Kompensationen är rätt: halva ytterdiametern.",
      "Bockarna ligger i samma plan.",
      "Inga veck eller ovalitet i bockarna.",
    ],
    vanligaFel: [
      "Mäter från centrum men använder bockverktygets X-markering – eller tvärtom.",
      "Glömmer kompensationen på halva ytterdiametern.",
      "Fel cc-mått mellan bockarna.",
      "Bockarna hamnar i olika plan.",
      "Markeringen hamnar på fel sida av röret.",
    ],
    yrkestermer: [
      "cc-mått",
      "centrumlinje",
      "insida",
      "ytterdiameter",
      "kompensation",
      "bocknyckel",
      "X-markering",
      "L-bock",
      "U-bock",
      "Z-bock",
      "seriebockning",
    ],
    sakerhet: [
      "Handskar vid vassa rörändar.",
      "Skyddsglasögon vid kapning och skävning.",
      "Spänn fast röret vid bockning.",
    ],
    reflektion: [
      "Varför blir det fel om du mäter från centrum men markerar enligt insidan?",
      "Hur påverkar rördiametern kompensationen?",
      "När är det bättre att mäta från centrum?",
      "Varför är det viktigt att bockarna ligger i samma plan?",
    ],
    kalla:
      "Tekniken är hämtad från RörmokarLäraren (Anders Pargell), ”En annan variant på nästa bock”. Kontrollera alltid mot din bockverktystillverkares anvisning – markeringarna kan skilja mellan fabrikat.",
  },
  {
    id: "bock-svanbock",
    titel: "Svanbock – dubbel motriktad bock i samma plan",
    niva: "Mästare",
    tidMin: 90,
    sammanfattning:
      "Bocka en svanbock med 60° och 30°. Bocka 60°-bocken först och 30°-bocken sedan – ordningen är viktig.",
    mal: [
      "Förstå vad en svanbock är och när den används.",
      "Bocka 60°-bocken först och 30°-bocken sedan.",
      "Förstå varför ordningen 60/30 är viktig.",
      "Kontrollera mått, bockvinklar och parallellitet.",
      "Undvika veck och ovalitet i båda bockarna.",
    ],
    material: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 2 },
      { component: "Propp", dimension: '1/2"', quantity: 2 },
      { component: "Ritning/mall", quantity: 1 },
    ],
    verktyg: [
      "Bockfjäder 15 mm",
      "Rörbock (bocknyckel)",
      "Vinkelhake",
      "Tumstock",
      "Skjutmått",
      "Märkpenna",
    ],
    moment: [
      "Läs ritningen och bestäm svanbockens mått.",
      "Märk ut båda bockpunkterna och kontrollera att de ligger i samma plan.",
      "Bocka 60°-bocken först.",
      "Vänd röret och bocka 30°-bocken sedan – 60° ska alltid komma först.",
      "Kontrollera mått, bockvinklar och att bockarna ligger i samma plan.",
      "Kontrollera ovalitet och veck i båda bockarna.",
      "Skäva rörändarna och dokumentera resultatet.",
    ],
    kontroll: [
      "Offset och höjd stämmer med ritningen ±2 mm.",
      "Båda bockvinklarna stämmer ±2°.",
      "Bockarna ligger i samma plan.",
      "Röret är parallellt och utan veck.",
      "Ovaliteten är mindre än 10 %.",
    ],
    vanligaFel: [
      "Bockarna hamnar i olika plan.",
      "Fel offset eller höjd.",
      "Man bockar 30° först – då blir måttet fel; 60° ska komma först.",
      "Andra bocken bockas åt fel håll.",
      "Röret vrids mellan bockarna.",
      "För snäv bock så att röret veckar sig.",
    ],
    yrkestermer: [
      "svanbock",
      "motriktad bock",
      "offset",
      "höjd",
      "cc-mått",
      "bockplan",
      "parallellitet",
      "bockvinkel",
      "ovalitet",
    ],
    sakerhet: [
      "Handskar vid vassa rörändar.",
      "Skyddsglasögon vid kapning och skävning.",
      "Spänn fast röret vid bockning.",
    ],
    reflektion: [
      "När används en svanbock i stället för två separata bockar?",
      "Varför måste bockarna ligga i samma plan?",
      "Hur påverkar offset och höjd varandra?",
      "Vad gör du om andra bocken blir felvänd?",
    ],
    kalla:
      "RörmokarLäraren, ”Svan och s bock” – traditionell svanbock: 60° först, sedan 30°.",
  },
  {
    id: "bock-s-bock",
    titel: "S-bock – två lika stora bockar med beräknat avstånd",
    niva: "Mästare",
    tidMin: 75,
    sammanfattning:
      "Bocka en S-bock med två lika stora bockar. Beräkna avståndet mellan markeringarna med faktor 2 vid 30°, 1,41 vid 45° och 3,7 vid 15°. Kontrollera S-mått och bockplan.",
    mal: [
      "Förstå vad en S-bock är och varför den inte får vara 90°.",
      "Beräkna avståndet mellan startstreck och bockstreck med rätt faktor.",
      "Bocka två lika stora bockar i samma plan.",
      "Kontrollera S-mått, bockvinklar och parallellitet.",
      "Dokumentera beräkning och resultat.",
    ],
    material: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 2 },
      { component: "Propp", dimension: '1/2"', quantity: 2 },
      { component: "Ritning/mall", quantity: 1 },
    ],
    verktyg: [
      "Rörbock (bocknyckel)",
      "Bockfjäder 15 mm",
      "Tumstock",
      "Vinkelhake",
      "Skjutmått",
      "Märkpenna",
    ],
    moment: [
      "Bestäm S-måttet, till exempel 60 mm, och bockvinkeln, till exempel 30°.",
      "Beräkna avståndet mellan markeringarna: S-mått × faktor. 30° → ×2, 45° → ×1,41, 15° → ×3,7.",
      "Sätt ett startstreck vid bockverktygets referens (0 på 0). Startstrecket kan ligga var som helst, men måste vara känt.",
      "Mät upp avståndet från startstrecket och gör ett bockstreck runt hela röret.",
      "Bocka första bocken till vald vinkel.",
      "Vänd röret, lägg bockstrecket mot referensen (0 på 0) och bocka andra bocken till samma vinkel.",
      "Kontrollera S-måttet, bockvinklarna och att bockarna ligger i samma plan.",
      "Dokumentera beräkning och resultat i egenkontrollen.",
    ],
    kontroll: [
      "S-måttet stämmer ±2 mm.",
      "Båda bockvinklarna är lika och stämmer ±2°.",
      "Bockarna ligger i samma plan.",
      "Inga veck eller ovalitet.",
      "Beräkningen är dokumenterad.",
    ],
    vanligaFel: [
      "Fel faktor används för vald bockvinkel.",
      "Bockstrecket görs inte runt hela röret.",
      "Startstreck och bockstreck blandas ihop.",
      "Bockarna får olika gradantal.",
      "Bockarna hamnar i olika plan.",
    ],
    yrkestermer: [
      "S-bock",
      "startstreck",
      "bockstreck",
      "faktor",
      "S-mått",
      "bockvinkel",
      "bockplan",
      "Z-bock",
    ],
    sakerhet: [
      "Handskar vid vassa rörändar.",
      "Skyddsglasögon vid kapning och skävning.",
      "Spänn fast röret vid bockning.",
    ],
    reflektion: [
      "Varför blir det en Z-bock om vinkeln är 90°?",
      "Varför fungerar faktorn på alla rördiametrar?",
      "Hur påverkar bockvinkeln S-måttet?",
      "Varför måste bockstrecket gå runt hela röret?",
    ],
    kalla:
      "RörmokarLäraren, ”Svan och s bock”. Faktorer: 15° × 3,7, 30° × 2, 45° × 1,41. Kontrollera mot din bockverktygstillverkares anvisning.",
  },
  {
    id: "bock-svanbock-alt",
    titel: "Svanbock – alternativ 30/30/60-teknik",
    niva: "Mästare",
    tidMin: 75,
    sammanfattning:
      "Bocka en svanbock med 30°, 30° och 60° enligt den alternativa tekniken. Kontrollera att avståndet blir kort och att bockarna ligger i samma plan.",
    forklaring:
      "Det här är den alternativa 30/30/60-tekniken. Den traditionella svanbocken är 60° först, sedan 30° – ordningen är viktig.",
    mal: [
      "Bocka en svanbock med 30/30/60-teknik.",
      "Få ett kort avstånd mellan bockarna.",
      "Kontrollera bockvinklar och bockplan.",
      "Jämföra tekniken med den traditionella svanbocken.",
    ],
    material: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 2 },
      { component: "Propp", dimension: '1/2"', quantity: 2 },
      { component: "Ritning/mall", quantity: 1 },
    ],
    verktyg: [
      "Rörbock (bocknyckel)",
      "Bockfjäder 15 mm",
      "Tumstock",
      "Vinkelhake",
      "Skjutmått",
      "Märkpenna",
    ],
    moment: [
      "Häng ut röret cirka 10 mm från bockverktygets knack/markering.",
      "Bocka första bocken till 30°.",
      "Vänd röret och ta nästa avlägg så nära som möjligt. Kontrollera att röret är rakt.",
      "Bocka andra bocken till 30°.",
      "Vänd röret och lägg första bocken i bockverktyget. Bocka till 60° (strecket efter 45°).",
      "Kontrollera svanbockens mått, vinklar och att bockarna ligger i samma plan.",
      "Dokumentera resultatet.",
    ],
    kontroll: [
      "Bockarna är 30°, 30° och 60° enligt tekniken.",
      "Avståndet mellan bockarna är kort och jämnt.",
      "Bockarna ligger i samma plan.",
      "Inga veck eller ovalitet.",
    ],
    vanligaFel: [
      "För långt avstånd mellan bockarna.",
      "Fel vinkel på första eller andra bocken.",
      "Röret vrids mellan bockarna.",
      "Bockarna hamnar i olika plan.",
    ],
    yrkestermer: [
      "svanbock",
      "30/30/60",
      "bocknyckel",
      "knack",
      "avlägg",
      "bockplan",
      "bockvinkel",
    ],
    sakerhet: [
      "Handskar vid vassa rörändar.",
      "Skyddsglasögon vid kapning och skävning.",
      "Spänn fast röret vid bockning.",
    ],
    reflektion: [
      "Varför blir avståndet kortare med 30/30/60-tekniken?",
      "Vad är skillnaden mot den traditionella svanbocken?",
      "Varför måste bockarna ligga i samma plan?",
    ],
    kalla:
      "RörmokarLäraren, ”Svan och s bock”. Tekniken är hämtad från ett engelskt klipp och används med Fromax bocknyckel nr 55 – kontrollera mot din egen bockverktygsanvisning.",
  },
  {
    id: "bock-tavlan",
    titel: "Bocktavlan – flera bockar efter ritning",
    niva: "Mästare",
    tidMin: 120,
    sammanfattning:
      "Montera en rörslinga med flera bockar på en bocktavla. Följ ritningen, håll cc-mått och bockplan och kontrollera hela slingan.",
    forklaring:
      "En bocktavla är en övningsplatta där du gör flera bockar efter en ritning. Du tränar bockordning, måttkedja och montage. Tänk igenom i vilken ordning bockarna ska göras – annars kan röret bli för kort eller hamna i fel plan.\n\n" +
      "Ritningen är 900 × 600 mm och visar båda rören. 15 mm-röret har bockpunkterna Start (100, 100), B1 (300, 100), B2 (300, 350), B3 (550, 350), B4 (550, 150), B5 (800, 150), B6 (800, 450). 12 mm-röret har samma X-värden men ligger 40 mm (4 cc) under – vid 6 cc drar du av 60 mm i stället. Klammer: K1–K6 för båda rören enligt tabellen; använd 4 eller 6 klammor per rör enligt skolans rutin.\n\n" +
      "Mäter du från insidan kompenserar du med 6 mm för 12 mm rör och 7,5 mm för 15 mm rör.",
    mal: [
      "Läsa en rörritning med flera bockar.",
      "Planera bockordningen innan du börjar.",
      "Hålla cc-mått och måttkedja genom hela slingan.",
      "Montera röret stabilt på bocktavlan.",
      "Kontrollera vinklar, parallellitet och bockplan.",
    ],
    material: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 5 },
      { component: "Klämringskoppling rak", dimension: "15 mm", quantity: 8 },
      { component: "Propp", dimension: '1/2"', quantity: 4 },
      { component: "Rörklammer", dimension: "15 mm", quantity: 10 },
      { component: "Bocktavla/plywood", quantity: 1 },
    ],
    verktyg: [
      "Bockfjäder 15 mm",
      "Rörbock",
      "Tumstock",
      "Vinkelhake",
      "Skjutmått",
      "Märkpenna",
      "Skruvdragare",
    ],
    moment: [
      "Läs ritningen och märk ut alla bockpunkter och cc-mått.",
      "Mät upp bockpunkterna enligt tabellen och kontrollera cc-måtten.",
      "Bestäm om 12 mm-röret ska ligga 4 cc (40 mm) eller 6 cc (60 mm) under 15 mm-röret.",
      "Bestäm bockordningen – börja med den bock som ligger närmast ena röränden.",
      "Bocka första bocken och kontrollera måttet.",
      "Fortsätt i samma ordning och kontrollera efter varje bock.",
      "Sätt klammorna K1–K6 för båda rören enligt tabellen.",
      "Montera rören på tavlan med rörklammer – 4 eller 6 klammor per rör.",
      "Kontrollera cc-mått, vinklar, parallellitet och att röret sitter stabilt.",
      "Dokumentera bockordning och resultat.",
    ],
    kontroll: [
      "Alla cc-mått stämmer ±2 mm.",
      "Bockvinklarna stämmer ±2°.",
      "Bockarna ligger i samma plan.",
      "Röret sitter stadigt i rörklamren.",
      "Båda rören sitter på rätt cc-mått och rätt avstånd (4 eller 6 cc).",
      "Klammorna deformera inte rören.",
      "Inga veck eller ovalitet.",
    ],
    vanligaFel: [
      "Fel bockordning så att måtten inte räcker.",
      "Måttkedjan räknas fel.",
      "Röret vrids mellan bockarna.",
      "För hårt åtdragna rörklammer som deformerar röret.",
      "Man glömmer att kontrollera efter varje bock.",
    ],
    yrkestermer: [
      "bocktavla",
      "bockordning",
      "cc-mått",
      "måttkedja",
      "bockplan",
      "rörklammer",
      "klammerposition",
      "bockpunkt",
      "cc-avstånd",
      "montage",
    ],
    sakerhet: [
      "Handskar och skyddsglasögon.",
      "Spänn fast tavlan.",
      "Var försiktig med skruvdragaren.",
    ],
    reflektion: [
      "Varför är bockordningen viktig?",
      "Hur undviker du att måttfel adderas?",
      "Varför ska röret sitta i samma plan?",
      "Vad skulle du göra annorlunda nästa gång?",
    ],
    kalla:
      "RörmokarLäraren, ”Tavlan”. Övningen är skriven som en standardövning för bocktavla.",
  },
];

export function bockning(id: string): BockOvning | undefined {
  return BOCKNINGAR.find((o) => o.id === id);
}

export function materialForBockning(o: BockOvning): BockMaterial[] {
  return o.material;
}
