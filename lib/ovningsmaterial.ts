import type { SakervattenOmrade, SakervattenRegel } from "./sakervatten";

// Förvalda materialrader till snabbvalda övningar. Det här är en startpunkt –
// läraren kan ändra, lägga till och ta bort rader innan uppdraget sparas.

export interface MaterialRad {
  component: string;
  dimension?: string;
  quantity?: number;
}

const PER_OMRADE: Record<SakervattenOmrade, MaterialRad[]> = {
  Tappvatten: [
    { component: "Tappvattenrör", dimension: "15", quantity: 1 },
    { component: "Koppling", dimension: "15", quantity: 4 },
    { component: "Avstängningsventil", dimension: "15", quantity: 1 },
    { component: "Rörklammer", dimension: "15", quantity: 8 },
    { component: "Isolering", dimension: "15", quantity: 1 },
  ],
  Utrustning: [
    { component: "Anslutningsrör", quantity: 1 },
    { component: "Avstängningsventil", quantity: 1 },
    { component: "Återströmningsskydd", quantity: 1 },
    { component: "Tätning", quantity: 2 },
  ],
  Kök: [
    { component: "Köksblandare", quantity: 1 },
    { component: "Diskmaskinsanslutning", quantity: 1 },
    { component: "Återströmningsskydd", quantity: 1 },
    { component: "Slang", quantity: 1 },
    { component: "Tätning", quantity: 2 },
  ],
  Spillvatten: [
    { component: "Spillvattenrör", dimension: "110", quantity: 1 },
    { component: "Böj", dimension: "110", quantity: 2 },
    { component: "Grenrör", dimension: "110", quantity: 1 },
    { component: "Rörklammer", dimension: "110", quantity: 6 },
  ],
  Värme: [
    { component: "Fördelarrör", quantity: 1 },
    { component: "Avstängningsventil", quantity: 2 },
    { component: "Manometer", quantity: 1 },
    { component: "Isolering", quantity: 1 },
  ],
  Tätskikt: [
    { component: "Tätskiktsmassa", quantity: 1 },
    { component: "Tätningsmanschett", quantity: 3 },
    { component: "Primer", quantity: 1 },
    { component: "Golvbrunn", quantity: 1 },
  ],
  Infästning: [
    { component: "Fäste", quantity: 4 },
    { component: "Skruv/plugg", quantity: 8 },
    { component: "Tätning", quantity: 2 },
  ],
  Personskydd: [
    { component: "Blandningsventil", quantity: 1 },
    { component: "Termometer", quantity: 1 },
    { component: "Återströmningsskydd", quantity: 1 },
    { component: "Tätning", quantity: 2 },
  ],
  Kontroller: [
    { component: "Provtryckspump", quantity: 1 },
    { component: "Manometer", quantity: 1 },
    { component: "Pluggar", quantity: 4 },
    { component: "Provprotokoll", quantity: 1 },
  ],
  Produkter: [
    { component: "Produktdatablad", quantity: 1 },
    { component: "Monteringsanvisning", quantity: 1 },
  ],
};

const PER_REGEL: Record<string, MaterialRad[]> = {
  "tappvatten-fogar": [
    { component: "Tappvattenrör", dimension: "15", quantity: 1 },
    { component: "Koppling", dimension: "15", quantity: 4 },
    { component: "Rörklammer", dimension: "15", quantity: 8 },
    { component: "Isolering", dimension: "15", quantity: 1 },
  ],
  "tappvatten-prefab": [
    { component: "Prefabricerad fördelare", quantity: 1 },
    { component: "Tappvattenrör", dimension: "15", quantity: 1 },
    { component: "Koppling", dimension: "15", quantity: 2 },
    { component: "Rörklammer", dimension: "15", quantity: 4 },
  ],
  "tappvatten-service": [
    { component: "Serviceöppning", quantity: 1 },
    { component: "Avstängningsventil", dimension: "15", quantity: 1 },
    { component: "Tappvattenrör", dimension: "15", quantity: 1 },
    { component: "Koppling", dimension: "15", quantity: 2 },
  ],
  "tappvatten-lackage": [
    { component: "Tappvattenrör", dimension: "15", quantity: 1 },
    { component: "Koppling", dimension: "15", quantity: 2 },
    { component: "Tätning", quantity: 2 },
  ],
  "tappvatten-avstangning": [
    { component: "Avstängningsventil", dimension: "15", quantity: 1 },
    { component: "Tappvattenrör", dimension: "15", quantity: 1 },
    { component: "Koppling", dimension: "15", quantity: 2 },
  ],
  "tappvatten-frys": [
    { component: "Isolering", dimension: "15", quantity: 2 },
    { component: "Rörklammer", dimension: "15", quantity: 4 },
  ],
  "utrustning-vattentatt-golv": [
    { component: "Tätskiktsmassa", quantity: 1 },
    { component: "Tätningsmanschett", quantity: 2 },
    { component: "Golvbrunn", quantity: 1 },
    { component: "Primer", quantity: 1 },
  ],
  tvattmaskin: [
    { component: "Tvättmaskinsanslutning", quantity: 1 },
    { component: "Avstängningsventil", quantity: 1 },
    { component: "Återströmningsskydd", quantity: 1 },
    { component: "Slang", quantity: 1 },
    { component: "Tätning", quantity: 2 },
  ],
  "wc-spolcistern": [
    { component: "WC-stol", quantity: 1 },
    { component: "Spolcistern", quantity: 1 },
    { component: "Anslutningsrör", quantity: 1 },
    { component: "Tätning", quantity: 2 },
  ],
  vattenmatare: [
    { component: "Vattenmätare", quantity: 1 },
    { component: "Avstängningsventil", quantity: 2 },
    { component: "Koppling", quantity: 2 },
    { component: "Tätning", quantity: 2 },
  ],
  "kok-diskmaskin": [
    { component: "Diskmaskinsanslutning", quantity: 1 },
    { component: "Återströmningsskydd", quantity: 1 },
    { component: "Slang", quantity: 1 },
    { component: "Tätning", quantity: 2 },
  ],
  "kok-blandare": [
    { component: "Köksblandare", quantity: 1 },
    { component: "Slang", quantity: 1 },
    { component: "Tätning", quantity: 2 },
    { component: "Avstängningsventil", quantity: 1 },
  ],
  "spill-montage": [
    { component: "Spillvattenrör", dimension: "110", quantity: 1 },
    { component: "Böj", dimension: "110", quantity: 2 },
    { component: "Grenrör", dimension: "110", quantity: 1 },
    { component: "Rörklammer", dimension: "110", quantity: 6 },
  ],
  "spill-riktning": [
    { component: "Spillvattenrör", dimension: "110", quantity: 1 },
    { component: "Böj", dimension: "110", quantity: 2 },
    { component: "Grenrör", dimension: "110", quantity: 1 },
  ],
  "spill-rens": [
    { component: "Rensrör", dimension: "110", quantity: 1 },
    { component: "Spillvattenrör", dimension: "110", quantity: 1 },
    { component: "Böj", dimension: "110", quantity: 1 },
  ],
  "spill-luftning": [
    { component: "Luftningsrör", dimension: "75", quantity: 1 },
    { component: "Spillvattenrör", dimension: "110", quantity: 1 },
    { component: "Grenrör", dimension: "110", quantity: 1 },
  ],
  golvbrunn: [
    { component: "Golvbrunn", quantity: 1 },
    { component: "Rörgenomföring", quantity: 3 },
    { component: "Tätskiktsmassa", quantity: 1 },
    { component: "Tätningsmanschett", quantity: 3 },
  ],
  "spill-diskmaskin": [
    { component: "Diskmaskinsanslutning", quantity: 1 },
    { component: "Spillvattenrör", dimension: "50", quantity: 1 },
    { component: "Vattenlås", quantity: 1 },
    { component: "Slang", quantity: 1 },
  ],
  "varme-fordelare": [
    { component: "Fördelarrör", quantity: 1 },
    { component: "Avstängningsventil", quantity: 2 },
    { component: "Koppling", quantity: 4 },
    { component: "Rörklammer", quantity: 6 },
    { component: "Isolering", quantity: 1 },
  ],
  "varme-service": [
    { component: "Avstängningsventil", quantity: 2 },
    { component: "Manometer", quantity: 1 },
    { component: "Säkerhetsventil", quantity: 1 },
    { component: "Isolering", quantity: 1 },
  ],
  "varme-frys": [
    { component: "Isolering", quantity: 2 },
    { component: "Rörklammer", quantity: 4 },
  ],
  "tatskikt-golv": [
    { component: "Golvbrunn", quantity: 1 },
    { component: "Rörgenomföring", quantity: 3 },
    { component: "Tätskiktsmassa", quantity: 1 },
    { component: "Tätningsmanschett", quantity: 3 },
    { component: "Fäste", quantity: 4 },
    { component: "Silikon", quantity: 1 },
  ],
  "tatskikt-vagg": [
    { component: "Tätskiktsmassa", quantity: 1 },
    { component: "Tätningsmanschett", quantity: 3 },
    { component: "Primer", quantity: 1 },
  ],
  "infastning-vagg": [
    { component: "Fäste", quantity: 4 },
    { component: "Skruv/plugg", quantity: 8 },
    { component: "Tätning", quantity: 2 },
  ],
  "infastning-golv": [
    { component: "Fäste", quantity: 4 },
    { component: "Skruv/plugg", quantity: 8 },
    { component: "Tätningsmanschett", quantity: 2 },
  ],
  "infastning-lim": [
    { component: "Våtrumslim", quantity: 1 },
    { component: "Tätningsmassa", quantity: 1 },
    { component: "Primer", quantity: 1 },
  ],
  "legionella-temp": [
    { component: "Varmvattenberedare", quantity: 1 },
    { component: "Blandningsventil", quantity: 1 },
    { component: "Termometer", quantity: 1 },
    { component: "Isolering", quantity: 1 },
  ],
  "legionella-utformning": [
    { component: "Varmvattenberedare", quantity: 1 },
    { component: "Blandningsventil", quantity: 1 },
    { component: "Säkerhetsventil", quantity: 1 },
    { component: "Isolering", quantity: 1 },
  ],
  brannskada: [
    { component: "Blandningsventil", quantity: 1 },
    { component: "Termometer", quantity: 1 },
    { component: "Tätning", quantity: 1 },
  ],
  aterstromning: [
    { component: "Återströmningsskydd", quantity: 1 },
    { component: "Avstängningsventil", quantity: 2 },
    { component: "Koppling", quantity: 2 },
    { component: "Tätning", quantity: 2 },
  ],
  "kontroll-tryck": [
    { component: "Provtryckspump", quantity: 1 },
    { component: "Manometer", quantity: 1 },
    { component: "Pluggar", quantity: 4 },
    { component: "Provprotokoll", quantity: 1 },
  ],
  "kontroll-temp": [
    { component: "Termometer", quantity: 1 },
    { component: "Provprotokoll", quantity: 1 },
  ],
  "kontroll-verktyg": [
    { component: "Manometer", quantity: 1 },
    { component: "Provtryckspump", quantity: 1 },
    { component: "Provprotokoll", quantity: 1 },
  ],
  "produkter-egenskaper": [
    { component: "Produktdatablad", quantity: 1 },
    { component: "Monteringsanvisning", quantity: 1 },
  ],
  "produkter-massing": [
    { component: "Mässingsdelar", quantity: 1 },
    { component: "Produktdatablad", quantity: 1 },
  ],
  "produkter-golvbrunn": [
    { component: "Golvbrunn", quantity: 1 },
    { component: "Produktdatablad", quantity: 1 },
  ],
  "produkter-tatskikt": [
    { component: "Tätskiktsmassa", quantity: 1 },
    { component: "Produktdatablad", quantity: 1 },
  ],
  monteringsanvisning: [{ component: "Monteringsanvisning", quantity: 1 }],
};

export function materialForRegel(regel: SakervattenRegel): MaterialRad[] {
  return PER_REGEL[regel.kod] ?? PER_OMRADE[regel.omrade] ?? [];
}

export function materialForRegler(regler: SakervattenRegel[]): MaterialRad[] {
  const perNyckel = new Map<string, MaterialRad>();
  for (const regel of regler) {
    for (const rad of materialForRegel(regel)) {
      const nyckel = `${rad.component}|${rad.dimension ?? ""}`;
      const befintlig = perNyckel.get(nyckel);
      if (befintlig) {
        // Flera regler kan peka på samma komponent. Ta största antalet i
        // stället för att summera, så en områdesövning inte får orimliga siffror.
        befintlig.quantity = Math.max(befintlig.quantity ?? 1, rad.quantity ?? 1);
      } else {
        perNyckel.set(nyckel, { ...rad });
      }
    }
  }
  return Array.from(perNyckel.values());
}
