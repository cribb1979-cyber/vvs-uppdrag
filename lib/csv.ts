// Enkel CSV/TSV-parser för att klistra in en exporterad lista direkt från
// grossistens Excel/CSV-fil -- ingen filuppladdning krävs (fungerar
// likadant på webb, iPad och i simulator utan extra beroenden).
export function parseDelimitedText(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [",", ";", "\t"] as const;
  const delimiter = candidates.reduce((best, d) => (count(firstLine, d) > count(firstLine, best) ? d : best), candidates[0]);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field.trim());
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field.trim());
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell !== ""));
}

function count(line: string, delimiter: string) {
  return line.split(delimiter).length - 1;
}
