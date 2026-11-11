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
  mal: string[];
  material: BockMaterial[];
  verktyg: string[];
  moment: string[];
  kontroll: string[];
  vanligaFel: string[];
  yrkestermer: string[];
  sakerhet: string[];
  reflektion: string[];
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
    titel: "Parallellförskjutning (offset) med två 45°-bockar",
    niva: "Fördjupning",
    tidMin: 60,
    sammanfattning:
      "Bocka en parallellförskjutning med två motriktade 45°-bockar. Kontrollera offsetmått, bockvinklar och parallellitet.",
    mal: [
      "Beräkna och mäta ut en parallellförskjutning.",
      "Bocka två motriktade 45°-bockar i samma plan.",
      "Kontrollera offsetmått och parallellitet.",
      "Skäva och kontrollera röret.",
    ],
    material: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 1 },
      { component: "Propp", dimension: '1/2"', quantity: 2 },
    ],
    verktyg: ["Bockfjäder 15 mm", "Vinkelhake", "Tumstock", "Märkpenna", "Skjutmått"],
    moment: [
      "Bestäm offsetmåttet och märk ut båda bockpunkterna.",
      "Bocka första 45°-bocken.",
      "Vänd röret och bocka andra 45°-bocken i samma plan.",
      "Kontrollera offsetmått, vinklar och parallellitet.",
      "Skäva rörändarna och kontrollera att röret är fritt från veck.",
    ],
    kontroll: [
      "Offsetmåttet stämmer med ritningen ±2 mm.",
      "Båda bockvinklarna är 45° ±2°.",
      "Bockarna ligger i samma plan.",
      "Röret är parallellt och utan veck.",
    ],
    vanligaFel: [
      "Fel offsetmått.",
      "Bockarna hamnar för nära varandra.",
      "Röret vrids så att bockarna inte ligger i samma plan.",
      "Andra bocken bockas åt fel håll.",
    ],
    yrkestermer: ["offset", "parallellförskjutning", "cc-mått", "bockmått", "bockvinkel", "parallellitet"],
    sakerhet: ["Spänn fast röret vid bockning.", "Handskar och skyddsglasögon."],
    reflektion: [
      "När används en offset i stället för en 90°-bock?",
      "Varför måste båda bockarna ligga i samma plan?",
      "Hur påverkar offsetmåttet rördragningen?",
    ],
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
];

export function bockning(id: string): BockOvning | undefined {
  return BOCKNINGAR.find((o) => o.id === id);
}

export function materialForBockning(o: BockOvning): BockMaterial[] {
  return o.material;
}
