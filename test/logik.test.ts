// Prov för den rena logiken i lib/ (ingen databas, ingen app).
// Kör: bash test/kor-alla.sh
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDelimitedText } from "../lib/csv";
import { examInfo, examMeta } from "../lib/examMode";
import { modeFromFields, modeToFields } from "../lib/assignmentMode";
import { examTaskUrl, examWeekUrl, sessionJoinUrl, PROD_URL } from "../lib/links";

test("csv: väljer semikolon när grossistfilen använder det", () => {
  assert.deepEqual(parseDelimitedText("RSK;Benämning\n123;Rör 15 mm\n"), [
    ["RSK", "Benämning"],
    ["123", "Rör 15 mm"],
  ]);
});

test("csv: tab-separerat (inklistrat från Excel) och CRLF", () => {
  assert.deepEqual(parseDelimitedText("a\tb\r\n1\t2\r\n"), [["a", "b"], ["1", "2"]]);
});

test("csv: citattecken med avgränsare och dubbla citat inuti", () => {
  assert.deepEqual(parseDelimitedText('namn,text\nx,"rör, 15 mm ""Cu"""'), [
    ["namn", "text"],
    ["x", 'rör, 15 mm "Cu"'],
  ]);
});

test("csv: tomma rader tas bort", () => {
  assert.deepEqual(parseDelimitedText("a,b\n\n,\n1,2"), [["a", "b"], ["1", "2"]]);
});

test("examMode: skarpt läge sparar minuter och läses tillbaka", () => {
  const steg = [{ key: "a", label: "A", open: true }, examMeta("normtid", 360, "prov")];
  assert.deepEqual(examInfo(steg as any), { minutes: 360, lage: "prov" });
});

test("examMode: övningsläge utan klocka", () => {
  assert.deepEqual(examInfo([examMeta("x", 0, "ovning")] as any), { minutes: null, lage: "ovning" });
});

test("examMode: uppdrag utan examenssteg är inget prov", () => {
  assert.deepEqual(examInfo(null), { minutes: null, lage: null });
  assert.deepEqual(examInfo([{ key: "a", label: "A", open: true }] as any), { minutes: null, lage: null });
});

test("assignmentMode: växeln går fram och tillbaka", () => {
  assert.equal(modeFromFields(modeToFields("ovning").reveal_mode), "ovning");
  assert.equal(modeFromFields(modeToFields("prov").reveal_mode), "prov");
  assert.equal(modeToFields("prov").ai_mode, "off");
});

test("links: examensveckans QR går till den publika översikten, inte lärarfliken", () => {
  // /examensprov krockar med (larare)/(tabs)/examensprov och kräver inloggning.
  assert.equal(examWeekUrl(), `${PROD_URL}/examensprov/oversikt`);
  assert.equal(examTaskUrl("normtid"), `${PROD_URL}/examensprov/normtid`);
});

test("links: elevkoder kodas i adressen", () => {
  assert.equal(sessionJoinUrl("VVS 1/2"), `${PROD_URL}/elev/uppdrag/VVS%201%2F2`);
});
