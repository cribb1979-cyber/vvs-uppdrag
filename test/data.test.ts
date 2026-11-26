// Prov för innehållet i lib/: att koder är unika och att hänvisningar
// mellan filerna pekar på något som finns.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EXAM_TASKS, examTask } from "../lib/examVvs";
import { OMRADEN, REGLER, regel, reglerPerOmrade } from "../lib/sakervatten";
import { materialForRegler } from "../lib/ovningsmaterial";
import { BOCKNINGAR } from "../lib/bockVvs";
import { BOCK_SKISS_IDS, bockSkissProportion, bockSkissSvg } from "../lib/bockSkisser";
import { referensForSkiss, skissId } from "../lib/skisser";
import { BOCK_TEORI } from "../lib/bockTeori";

function dubbletter(lista: string[]): string[] {
  return lista.filter((x, i) => lista.indexOf(x) !== i);
}

test("examensprov: id:n är unika och hittas", () => {
  const ids = EXAM_TASKS.map((t) => t.id);
  assert.deepEqual(dubbletter(ids), []);
  for (const id of ids) assert.ok(examTask(id), id);
});

test("examensprov: id:n får inte krocka med översiktssidan", () => {
  assert.ok(!EXAM_TASKS.some((t) => t.id === "oversikt"));
});

test("examensprov: varje moment har tid och något att göra", () => {
  for (const t of EXAM_TASKS) {
    assert.ok(t.minut > 0, `${t.id}: minut`);
    assert.ok(t.checklista.length + t.fragor.length > 0, `${t.id}: tomt moment`);
  }
});

test("examensprov: regelhänvisningar finns i Säkervatten-biblioteket", () => {
  for (const t of EXAM_TASKS) {
    for (const kod of t.regelRefs ?? []) assert.ok(regel(kod), `${t.id} → ${kod}`);
  }
});

test("säkervatten: koderna är unika", () => {
  assert.deepEqual(dubbletter(REGLER.map((r) => r.kod)), []);
});

test("säkervatten: varje regel hör till ett känt område", () => {
  const omraden = new Set(OMRADEN.map((o) => o.omrade));
  for (const r of REGLER) assert.ok(omraden.has(r.omrade), `${r.kod}: ${r.omrade}`);
  const antal = reglerPerOmrade().reduce((s, g) => s + g.regler.length, 0);
  assert.equal(antal, REGLER.length);
});

test("övningsmaterial: samma komponent från två regler räknas inte dubbelt", () => {
  const rader = materialForRegler(REGLER);
  const nycklar = rader.map((r) => `${r.component}|${r.dimension ?? ""}`);
  assert.deepEqual(dubbletter(nycklar), []);
});

test("bockövningar: id:n unika, skisserna finns och ritas utan fel", () => {
  assert.deepEqual(dubbletter(BOCKNINGAR.map((o) => o.id)), []);
  for (const o of BOCKNINGAR) {
    if (!o.skiss) continue;
    // Markören som sparas i uppdraget ska gå att läsa tillbaka.
    assert.equal(skissId(referensForSkiss(o.skiss)), o.skiss, o.id);
  }
  for (const id of BOCK_SKISS_IDS) {
    const svg = bockSkissSvg(id);
    assert.ok(svg.startsWith("<svg") && svg.endsWith("</svg>"), id);
    assert.ok(!/NaN|undefined|Infinity/.test(svg), `${id}: trasigt tal i skissen`);
    assert.ok(bockSkissProportion(id) > 1, id);
  }
});

test("bockteori: 15°-faktorn är 1/sin 15° = 3,86", () => {
  for (const sektion of BOCK_TEORI) {
    for (const b of sektion.block) {
      if (b.type !== "formula") continue;
      for (const r of b.rows) {
        const v = Number(r.vinkel.replace("°", ""));
        const forvantat = 1 / Math.sin((v * Math.PI) / 180);
        assert.ok(Math.abs(Number(r.faktor.replace(",", ".")) - forvantat) < 0.01, `${r.vinkel}: ${r.faktor}`);
      }
    }
  }
});
