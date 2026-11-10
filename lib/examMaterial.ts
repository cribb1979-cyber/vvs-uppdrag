// Fysiskt material per examensmoment i VVS-montörsprovet.
// Mängderna är per elev. Inventeringen räknar behov = per elev × antal elever.

export type ExamMaterialItem = {
  component: string;
  dimension?: string;
  quantity: number;
  category?: string;
  note?: string;
};

export type ExamMaterialGroup = {
  id: string;
  titel: string;
  items: ExamMaterialItem[];
};

export const EXAM_MATERIAL: ExamMaterialGroup[] = [
  {
    id: "klamringskopplingar",
    titel: "Monteringsanvisningar – klämringskopplingar",
    items: [
      { component: "Kopparrör", dimension: "15 mm", quantity: 2, category: "Rör" },
      { component: "Klämringskoppling rak", dimension: "15 mm", quantity: 4, category: "Kopplingar" },
      { component: "Klämringskoppling vinkel 90°", dimension: "15 mm", quantity: 4, category: "Kopplingar" },
      { component: "Klämringskoppling T-kors", dimension: "15 mm", quantity: 2, category: "Kopplingar" },
      { component: "Skäverktyg", quantity: 1, category: "Verktyg" },
      { component: "Gradverktyg", quantity: 1, category: "Verktyg" },
    ],
  },
  {
    id: "tryck-och-tathet",
    titel: "Tryck- och täthetskontroll",
    items: [
      { component: "Tryckprovningspump", quantity: 1, category: "Verktyg" },
      { component: "Manometer", dimension: "0–1,0 MPa", quantity: 1, category: "Mätning" },
      { component: "Provtryckningsadapter", dimension: '1/2"', quantity: 2, category: "Verktyg" },
      { component: "Propp", dimension: '1/2"', quantity: 4, category: "Kopplingar" },
      { component: "Fiberpackning", dimension: '1/2"', quantity: 4, category: "Tätning" },
    ],
  },
  {
    id: "expansionskarl",
    titel: "Installation – slutet expansionskärl",
    items: [
      { component: "Expansionskärl", dimension: "2–8 l", quantity: 1, category: "Tryckkärl" },
      { component: "Säkerhetsventil", dimension: '1/2"', quantity: 1, category: "Ventiler" },
      { component: "Backventil", dimension: "15 mm", quantity: 1, category: "Ventiler" },
      { component: "Avstängningsventil", dimension: "15 mm", quantity: 2, category: "Ventiler" },
      { component: "Manometer", dimension: "0–1,0 MPa", quantity: 1, category: "Mätning" },
      { component: "Kopparrör", dimension: "15 mm", quantity: 4, category: "Rör" },
      { component: "Presskoppling vinkel 90°", dimension: "15 mm", quantity: 6, category: "Kopplingar" },
      { component: "Presskoppling T-kors", dimension: "15 mm", quantity: 2, category: "Kopplingar" },
      { component: "Presskoppling rak", dimension: "15 mm", quantity: 2, category: "Kopplingar" },
      { component: "Fiberpackning", dimension: '1/2"', quantity: 4, category: "Tätning" },
      { component: "Gängtejp", quantity: 1, category: "Tätning" },
    ],
  },
  {
    id: "varmvattenberedare",
    titel: "Installation – varmvattenberedare",
    items: [
      { component: "Varmvattenberedare", quantity: 1, category: "Värme" },
      { component: "Blandningsventil", quantity: 1, category: "Ventiler" },
      { component: "Säkerhetsventil", dimension: '1/2"', quantity: 1, category: "Ventiler" },
      { component: "Backventil", dimension: "15 mm", quantity: 1, category: "Ventiler" },
      { component: "Avstängningsventil", dimension: "15 mm", quantity: 2, category: "Ventiler" },
      { component: "Expansionskärl", dimension: "2–8 l", quantity: 1, category: "Tryckkärl" },
      { component: "Manometer", dimension: "0–1,0 MPa", quantity: 1, category: "Mätning" },
      { component: "Kopparrör", dimension: "15 mm", quantity: 4, category: "Rör" },
      { component: "Presskoppling vinkel 90°", dimension: "15 mm", quantity: 6, category: "Kopplingar" },
      { component: "Presskoppling T-kors", dimension: "15 mm", quantity: 2, category: "Kopplingar" },
      { component: "Fiberpackning", dimension: '1/2"', quantity: 4, category: "Tätning" },
      { component: "Gängtejp", quantity: 1, category: "Tätning" },
    ],
  },
  {
    id: "komplettering-badrum",
    titel: "Installation – komplettering av badrum",
    items: [
      { component: "Tvättställsblandare", quantity: 1, category: "Blandare" },
      { component: "Duschblandare", quantity: 1, category: "Blandare" },
      { component: "Duschset", quantity: 1, category: "Blandare" },
      { component: "Vattenlås", quantity: 1, category: "Avlopp" },
      { component: "Golvbrunn", quantity: 1, category: "Avlopp" },
      { component: "Avloppsrör", dimension: "50 mm", quantity: 4, category: "Avlopp" },
      { component: "Avloppsböj 90°", dimension: "50 mm", quantity: 6, category: "Avlopp" },
      { component: "Avloppsmuff", dimension: "50 mm", quantity: 4, category: "Avlopp" },
      { component: "Kopparrör", dimension: "15 mm", quantity: 6, category: "Rör" },
      { component: "Presskoppling vinkel 90°", dimension: "15 mm", quantity: 8, category: "Kopplingar" },
      { component: "Presskoppling T-kors", dimension: "15 mm", quantity: 2, category: "Kopplingar" },
      { component: "Klämringskoppling rak", dimension: "15 mm", quantity: 4, category: "Kopplingar" },
      { component: "Fiberpackning", dimension: '1/2"', quantity: 6, category: "Tätning" },
      { component: "Gängtejp", quantity: 1, category: "Tätning" },
    ],
  },
];
