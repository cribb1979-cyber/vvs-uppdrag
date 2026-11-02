// Säkervatten 2026:1 – struktur och korta, egna sammanfattningar.
//
// VIKTIGT: Det här är inte den officiella regeltexten. Sammanfattningarna är
// skrivna för appen och varje regel länkar till sakervatten.se. Vill man visa
// hela regeltexten i appen krävs tillstånd från Säker Vatten.
//
// Reglerna är statiska och versioneras här i koden i stället för i databasen.
// Ett uppdrag sparar bara regelkoderna i assignments.rule_refs.

export const SAKERVATTEN_VERSION = "2026:1";
export const SAKERVATTEN_GILTIG_FRAN = "2026-01-01";
export const SAKERVATTEN_URL = "https://sakervatten.se/branschregler2026/";

export type SakervattenOmrade =
  | "Tappvatten"
  | "Utrustning"
  | "Kök"
  | "Spillvatten"
  | "Värme"
  | "Tätskikt"
  | "Infästning"
  | "Personskydd"
  | "Kontroller"
  | "Produkter";

export interface SakervattenRegel {
  /** Stabil kod som sparas i assignments.rule_refs. Ändra aldrig i efterhand. */
  kod: string;
  rubrik: string;
  omrade: SakervattenOmrade;
  /** Kort egen sammanfattning – inte ett citat ur regeltexten. */
  sammanfattning: string;
  /** Punkter som kan bli egenkontroll i ett uppdrag. */
  kontrollpunkter: string[];
}

export const OMRADEN: { omrade: SakervattenOmrade; emoji: string }[] = [
  { omrade: "Tappvatten", emoji: "🚰" },
  { omrade: "Utrustning", emoji: "🧺" },
  { omrade: "Kök", emoji: "🍽️" },
  { omrade: "Spillvatten", emoji: "🚿" },
  { omrade: "Värme", emoji: "♨️" },
  { omrade: "Tätskikt", emoji: "🛡️" },
  { omrade: "Infästning", emoji: "🔩" },
  { omrade: "Personskydd", emoji: "🌡️" },
  { omrade: "Kontroller", emoji: "✅" },
  { omrade: "Produkter", emoji: "📦" },
];

export const REGLER: SakervattenRegel[] = [
  // ---------------------------------------------------------------- Tappvatten
  {
    kod: "tappvatten-fogar",
    rubrik: "Fogar på tappvattenledningar",
    omrade: "Tappvatten",
    sammanfattning:
      "Dolda tappvattenledningar ska i första hand vara foglösa. Där fogar behövs ska de vara utbytbara och sitta så att ett läckage snabbt upptäcks.",
    kontrollpunkter: [
      "Dolda ledningar är foglösa där det är möjligt",
      "Fogar är åtkomliga för byte",
      "Fogar sitter i rum med vattentätt golv eller i godkänd prefabricerad konstruktion",
    ],
  },
  {
    kod: "tappvatten-prefab",
    rubrik: "Prefabricerad konstruktion",
    omrade: "Tappvatten",
    sammanfattning:
      "En prefabricerad lösning får användas om konstruktionen är provad och dokumenterad för ändamålet.",
    kontrollpunkter: [
      "Konstruktionen är avsedd för tappvatten",
      "Provning och dokumentation finns",
      "Lösningen är monterad enligt tillverkarens anvisning",
    ],
  },
  {
    kod: "tappvatten-service",
    rubrik: "Serviceöppning",
    omrade: "Tappvatten",
    sammanfattning:
      "Där fogar eller utrustning är dolda ska det finnas en serviceöppning så att arbetet kan inspekteras och repareras.",
    kontrollpunkter: [
      "Serviceöppningen är åtkomlig utan att byggnadsdel förstörs",
      "Öppningen är tillräckligt stor för arbete och kontroll",
    ],
  },
  {
    kod: "tappvatten-lackage",
    rubrik: "Läckageindikering",
    omrade: "Tappvatten",
    sammanfattning:
      "Där risken för dolda läckage är förhöjd ska installationen utformas så att läckage upptäcks i tid.",
    kontrollpunkter: [
      "Läckage kan upptäckas innan det ger omfattande skador",
      "Indikering eller uppsamling finns där det behövs",
    ],
  },
  {
    kod: "tappvatten-avstangning",
    rubrik: "Avstängningsventiler",
    omrade: "Tappvatten",
    sammanfattning:
      "Varje lägenhet eller lokal ska kunna stängas av på ett säkert och åtkomligt sätt.",
    kontrollpunkter: [
      "Avstängningsventil finns för lägenheten/lokalen",
      "Ventilen är åtkomlig och märkt",
    ],
  },
  {
    kod: "tappvatten-frys",
    rubrik: "Frysskadesäker förläggning",
    omrade: "Tappvatten",
    sammanfattning:
      "Tappvattenledningar ska förläggas så att de inte fryser och skadas i ouppvärmda utrymmen.",
    kontrollpunkter: [
      "Ledningar i ouppvärmda utrymmen är frostskyddade",
      "Isolering och värmekabel är rätt monterad",
      "Avtappning är möjlig där det behövs",
    ],
  },

  // ---------------------------------------------------------------- Utrustning
  {
    kod: "utrustning-vattentatt-golv",
    rubrik: "Vattenansluten utrustning utan vattentätt golv",
    omrade: "Utrustning",
    sammanfattning:
      "Utrustning som ansluts till vatten i rum utan vattentätt golv ska ha skydd som hindrar läckage från att sprida sig.",
    kontrollpunkter: [
      "Utrustningen är godkänd för placeringen",
      "Skydd mot läckage finns",
      "Anslutningen är utförd enligt monteringsanvisningen",
    ],
  },
  {
    kod: "tvattmaskin",
    rubrik: "Tvättmaskin",
    omrade: "Utrustning",
    sammanfattning:
      "Tvättmaskin ska anslutas med godkända delar och skydd mot återströmning och läckage.",
    kontrollpunkter: [
      "Anslutningen har rätt dimension och tätning",
      "Skydd mot återströmning finns",
      "Läckage kan upptäckas",
    ],
  },
  {
    kod: "wc-spolcistern",
    rubrik: "WC med inbyggd spolcistern",
    omrade: "Utrustning",
    sammanfattning:
      "WC med inbyggd cistern ska vara åtkomlig för service och ansluten så att läckage inte blir dolt.",
    kontrollpunkter: [
      "Serviceöppning finns",
      "Anslutningen är tät och kontrollerbar",
    ],
  },
  {
    kod: "vattenmatare",
    rubrik: "Vattenmätare",
    omrade: "Utrustning",
    sammanfattning:
      "Vattenmätaren ska placeras åtkomligt, frostskyddat och så att den kan bytas utan ingrepp i byggnaden.",
    kontrollpunkter: [
      "Mätaren är åtkomlig",
      "Placeringen är frostskyddad",
      "Byte kan göras utan att riva tätskikt",
    ],
  },

  // ---------------------------------------------------------------------- Kök
  {
    kod: "kok-diskmaskin",
    rubrik: "Diskmaskin",
    omrade: "Kök",
    sammanfattning:
      "Diskmaskin ska anslutas med skydd mot återströmning och med en anslutning som går att kontrollera.",
    kontrollpunkter: [
      "Skydd mot återströmning finns",
      "Anslutningen är tät",
      "Läckage kan upptäckas",
    ],
  },
  {
    kod: "kok-blandare",
    rubrik: "Köksblandare",
    omrade: "Kök",
    sammanfattning:
      "Köksblandare ska monteras med rätt anslutning och så att eventuellt läckage inte blir dolt.",
    kontrollpunkter: [
      "Blandaren är godkänd för användningen",
      "Anslutningarna är täta",
      "Monteringen följer tillverkarens anvisning",
    ],
  },

  // --------------------------------------------------------------- Spillvatten
  {
    kod: "spill-montage",
    rubrik: "Montering av spillvattenledning",
    omrade: "Spillvatten",
    sammanfattning:
      "Spillvattenledningar ska monteras med rätt fall, infästning och skarvar så att avloppet fungerar och inte läcker.",
    kontrollpunkter: [
      "Fallet är rätt och jämnt",
      "Infästningen bär ledningen",
      "Skarvar och anslutningar är täta",
    ],
  },
  {
    kod: "spill-riktning",
    rubrik: "Riktningsändring",
    omrade: "Spillvatten",
    sammanfattning:
      "Riktningsändringar ska göras med godkända delar och med ett fall som inte gör att avloppet sätter igen.",
    kontrollpunkter: [
      "Godkända böjar och grenrör används",
      "Fallet bibehålls genom ändringen",
    ],
  },
  {
    kod: "spill-rens",
    rubrik: "Rensanordningar",
    omrade: "Spillvatten",
    sammanfattning:
      "Spillvatteninstallationen ska ha rensanordningar på rätt ställen och de ska vara åtkomliga.",
    kontrollpunkter: [
      "Rensanordningar finns där de behövs",
      "De är åtkomliga utan att byggnadsdel öppnas",
    ],
  },
  {
    kod: "spill-luftning",
    rubrik: "Luftning av spillvatten",
    omrade: "Spillvatten",
    sammanfattning:
      "Spillvatteninstallationen ska luftas så att vattenlåsen fungerar och avloppet inte suger tomt.",
    kontrollpunkter: [
      "Luftning finns och är rätt dimensionerad",
      "Luftningen mynnar på godkänt sätt",
    ],
  },
  {
    kod: "golvbrunn",
    rubrik: "Golvbrunn",
    omrade: "Spillvatten",
    sammanfattning:
      "Golvbrunn ska vara godkänd för ändamålet och anslutas till tätskiktet enligt anvisningen.",
    kontrollpunkter: [
      "Golvbrunnen är godkänd och rätt placerad",
      "Anslutningen mot tätskikt är tät",
      "Vattenlåset är åtkomligt",
    ],
  },
  {
    kod: "spill-diskmaskin",
    rubrik: "Spillvatten från diskmaskin eller tvättmaskin",
    omrade: "Spillvatten",
    sammanfattning:
      "Spillvatten från maskiner ska anslutas med rätt höjd och skydd så att avloppsvatten inte kan tränga tillbaka.",
    kontrollpunkter: [
      "Anslutningen har rätt höjd",
      "Skydd mot återströmning finns",
      "Slangen är säkrad",
    ],
  },

  // --------------------------------------------------------------------- Värme
  {
    kod: "varme-fordelare",
    rubrik: "Fördelarrör med utrustning",
    omrade: "Värme",
    sammanfattning:
      "Fördelarrör ska monteras med serviceöppning, läckageindikering och åtkomliga ventiler.",
    kontrollpunkter: [
      "Serviceöppning finns",
      "Läckageindikering finns",
      "Ventiler är åtkomliga och märkta",
    ],
  },
  {
    kod: "varme-service",
    rubrik: "Serviceöppning i värmeinstallation",
    omrade: "Värme",
    sammanfattning:
      "Dolda delar i värmeinstallationen ska kunna inspekteras och repareras via serviceöppning.",
    kontrollpunkter: [
      "Serviceöppningen är åtkomlig",
      "Den är stor nog för kontroll och reparation",
    ],
  },
  {
    kod: "varme-frys",
    rubrik: "Frysskadesäker värmeinstallation",
    omrade: "Värme",
    sammanfattning:
      "Värmeinstallationer ska skyddas mot frysning i ouppvärmda utrymmen.",
    kontrollpunkter: [
      "Ledningar i kalla utrymmen är frostskyddade",
      "Isolering och värmekabel är rätt monterad",
    ],
  },

  // ----------------------------------------------------------------- Tätskikt
  {
    kod: "tatskikt-golv",
    rubrik: "Rörgenomföring i golv med tätskikt",
    omrade: "Tätskikt",
    sammanfattning:
      "Rörgenomföringar i golv med tätskikt ska tätas med en lösning som är avsedd för ändamålet.",
    kontrollpunkter: [
      "Genomföringen är godkänd för tätskikt",
      "Tätningen är utförd enligt anvisningen",
      "Tätskiktet är obrutet runt genomföringen",
    ],
  },
  {
    kod: "tatskikt-vagg",
    rubrik: "Rörgenomföring i vägg med tätskikt",
    omrade: "Tätskikt",
    sammanfattning:
      "Rörgenomföringar i våtrumsväggar ska tätas så att vatten inte kan tränga in i konstruktionen.",
    kontrollpunkter: [
      "Genomföringen har godkänd tätning",
      "Tätskiktet är korrekt anslutet",
    ],
  },

  // ---------------------------------------------------------------- Infästning
  {
    kod: "infastning-vagg",
    rubrik: "Skruvinfästning i vägg",
    omrade: "Infästning",
    sammanfattning:
      "Produkter i bad- och duschrum ska fästas i ett underlag som klarar belastningen utan att tätskiktet skadas.",
    kontrollpunkter: [
      "Infästningen går i bärande underlag",
      "Tätskiktet är tätat runt fästet",
      "Produkten sitter stabilt",
    ],
  },
  {
    kod: "infastning-golv",
    rubrik: "Skruvinfästning i golv",
    omrade: "Infästning",
    sammanfattning:
      "Infästning i golv ska göras så att tätskiktet inte punkteras eller skadas.",
    kontrollpunkter: [
      "Tätskiktet är skyddat",
      "Fästet sitter i rätt underlag",
    ],
  },
  {
    kod: "infastning-lim",
    rubrik: "Infästning med lim",
    omrade: "Infästning",
    sammanfattning:
      "Limfästa produkter ska använda lim och underlag som är avsedda för våtrum.",
    kontrollpunkter: [
      "Limmet är godkänt för våtrum",
      "Underlaget är förberett enligt anvisningen",
    ],
  },

  // --------------------------------------------------------------- Personskydd
  {
    kod: "legionella-temp",
    rubrik: "Temperaturer mot legionella",
    omrade: "Personskydd",
    sammanfattning:
      "Tappvarmvattnet ska hålla temperaturer och omsättning som motverkar tillväxt av legionella.",
    kontrollpunkter: [
      "Varmvattnet håller rätt temperatur",
      "Vattnet omsätts i ledningarna",
      "Temperaturen är kontrollerad och dokumenterad",
    ],
  },
  {
    kod: "legionella-utformning",
    rubrik: "Utformning av tappvatteninstallation",
    omrade: "Personskydd",
    sammanfattning:
      "Installationen ska utformas utan onödiga döda ändar och stillastående vatten.",
    kontrollpunkter: [
      "Inga onödiga döda ändar",
      "Stillastående vatten undviks",
    ],
  },
  {
    kod: "brannskada",
    rubrik: "Skydd mot brännskador",
    omrade: "Personskydd",
    sammanfattning:
      "Tappställen ska utformas så att risken för brännskador begränsas, särskilt där små barn kan nå dem.",
    kontrollpunkter: [
      "Blandaren har skydd mot för varmt vatten",
      "Temperaturen är kontrollerad",
    ],
  },
  {
    kod: "aterstromning",
    rubrik: "Skydd mot återströmning",
    omrade: "Personskydd",
    sammanfattning:
      "Tappställen och fasta anslutningar ska skyddas mot återströmning så att förorenat vatten inte kan gå baklänges i systemet.",
    kontrollpunkter: [
      "Rätt typ av återströmningsskydd finns",
      "Skyddet är monterat i rätt riktning",
      "Slangar och anslutningar är säkrade",
    ],
  },

  // ----------------------------------------------------------------- Kontroller
  {
    kod: "kontroll-tryck",
    rubrik: "Tryck- och täthetskontroll",
    omrade: "Kontroller",
    sammanfattning:
      "Tappvatten- och värmeinstallationer ska tryck- och täthetskontrolleras innan de tas i drift, och resultatet ska dokumenteras.",
    kontrollpunkter: [
      "Kontrollen är utförd före idrifttagning",
      "Rätt provtryck och tid används",
      "Resultatet är dokumenterat",
    ],
  },
  {
    kod: "kontroll-temp",
    rubrik: "Temperaturkontroll",
    omrade: "Kontroller",
    sammanfattning:
      "Tappvattnets temperatur ska kontrolleras och dokumenteras så att både legionella- och brännskaderisk hanteras.",
    kontrollpunkter: [
      "Varmvattentemperaturen är mätt",
      "Kallvattentemperaturen är mätt",
      "Mätningen är dokumenterad",
    ],
  },
  {
    kod: "kontroll-verktyg",
    rubrik: "Kontroll av verktyg och mätinstrument",
    omrade: "Kontroller",
    sammanfattning:
      "Monteringsverktyg och mätinstrument ska vara kontrollerade och kalibrerade så att resultatet blir tillförlitligt.",
    kontrollpunkter: [
      "Verktyget är rätt inställt",
      "Mätinstrumentet är kalibrerat",
    ],
  },

  // ------------------------------------------------------------------ Produkter
  {
    kod: "produkter-egenskaper",
    rubrik: "VVS-produkters egenskaper",
    omrade: "Produkter",
    sammanfattning:
      "Produkter som används ska uppfylla branschkraven och vara avsedda för den aktuella installationen.",
    kontrollpunkter: [
      "Produkten uppfyller branschkrav",
      "Produkten är avsedd för ändamålet",
      "Monteringsanvisning finns",
    ],
  },
  {
    kod: "produkter-massing",
    rubrik: "Mässingskomponenter",
    omrade: "Produkter",
    sammanfattning:
      "Mässingskomponenter ska ha rätt materialkvalitet så att de inte spricker eller korroderar.",
    kontrollpunkter: [
      "Komponenten är godkänd",
      "Materialet passar vattnet och installationen",
    ],
  },
  {
    kod: "produkter-golvbrunn",
    rubrik: "Väggnära golvbrunnar",
    omrade: "Produkter",
    sammanfattning:
      "Väggnära golvbrunnar ska vara godkända och monteras enligt sin anvisning.",
    kontrollpunkter: [
      "Golvbrunnen är godkänd",
      "Monteringen följer anvisningen",
    ],
  },
  {
    kod: "produkter-tatskikt",
    rubrik: "Produkter mot tätskikt",
    omrade: "Produkter",
    sammanfattning:
      "Produkter som ska anslutas mot tätskikt ska vara avsedda för det och följa tätskiktssystemets anvisning.",
    kontrollpunkter: [
      "Produkten är kompatibel med tätskiktet",
      "Anslutningen följer systemets anvisning",
    ],
  },
  {
    kod: "monteringsanvisning",
    rubrik: "Monteringsanvisning",
    omrade: "Produkter",
    sammanfattning:
      "Monteringsanvisningar ska följas. Anvisningar märkta med Säker Vatten-installations logotyp är granskade för ändamålet.",
    kontrollpunkter: [
      "Rätt monteringsanvisning används",
      "Anvisningen följs i alla steg",
    ],
  },
];

const PER_KOD = new Map(REGLER.map((r) => [r.kod, r]));

export function regel(kod: string): SakervattenRegel | undefined {
  return PER_KOD.get(kod);
}

export function reglerFor(koder: string[] | null | undefined): SakervattenRegel[] {
  return (koder ?? []).map(regel).filter((r): r is SakervattenRegel => Boolean(r));
}

export function reglerPerOmrade(): { omrade: SakervattenOmrade; emoji: string; regler: SakervattenRegel[] }[] {
  return OMRADEN.map(({ omrade, emoji }) => ({
    omrade,
    emoji,
    regler: REGLER.filter((r) => r.omrade === omrade),
  })).filter((g) => g.regler.length > 0);
}
