import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import dotenv from "dotenv";
import { pool } from "../src/db/pool.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath =
  process.env.CSV_PATH ||
  resolve(__dirname, "../../b59bf809-571c-4c1c-ab37-1c51b34440cf.csv");

function emptyToNull(s: string | undefined): string | null {
  if (s === undefined || s === null) return null;
  const t = s.trim();
  return t === "" ? null : t;
}

function parseDate(s: string | undefined): string | null {
  const v = emptyToNull(s);
  if (!v) return null;
  const m = v.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function parseOwned(s: string | undefined): boolean | null {
  const v = emptyToNull(s);
  if (!v) return null;
  const l = v.toLowerCase();
  if (l === "yes") return true;
  if (l === "no") return false;
  return null;
}

function parseIntSafe(s: string | undefined): number | null {
  const v = emptyToNull(s);
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function parseRating(s: string | undefined): string | null {
  const v = emptyToNull(s);
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? String(n) : null;
}

type CsvRow = Record<string, string>;

function rowToValues(r: CsvRow) {
  return [
    emptyToNull(r.Title),
    emptyToNull(r.Authors),
    emptyToNull(r.Contributors),
    emptyToNull(r["ISBN/UID"]),
    emptyToNull(r.Format),
    emptyToNull(r["Read Status"]),
    parseDate(r["Date Added"]),
    parseDate(r["Last Date Read"]),
    emptyToNull(r["Dates Read"]),
    parseIntSafe(r["Read Count"]),
    emptyToNull(r.Moods),
    emptyToNull(r.Pace),
    emptyToNull(r["Character- or Plot-Driven?"]),
    emptyToNull(r["Strong Character Development?"]),
    emptyToNull(r["Loveable Characters?"]),
    emptyToNull(r["Diverse Characters?"]),
    emptyToNull(r["Flawed Characters?"]),
    parseRating(r["Star Rating"]),
    emptyToNull(r.Review),
    emptyToNull(r["Content Warnings"]),
    emptyToNull(r["Content Warning Description"]),
    emptyToNull(r.Tags),
    parseOwned(r["Owned?"]),
  ];
}

async function main() {
  const raw = readFileSync(csvPath, "utf-8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as CsvRow[];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("TRUNCATE books RESTART IDENTITY CASCADE");

    const insertSql = `
      INSERT INTO books (
        title, authors, contributors, isbn_uid, format, read_status,
        date_added, last_date_read, dates_read, read_count, moods, pace,
        character_or_plot_driven, strong_character_development, loveable_characters,
        diverse_characters, flawed_characters, star_rating, review, content_warnings,
        content_warning_description, tags, owned
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
      )
    `;

    let n = 0;
    for (const r of records) {
      const title = emptyToNull(r.Title);
      if (!title) continue;
      const vals = rowToValues(r);
      await client.query(insertSql, vals);
      n++;
    }

    await client.query("COMMIT");
    console.log(`Loaded ${n} books from ${csvPath}`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
