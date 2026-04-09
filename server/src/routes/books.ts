import { Router } from "express";
import { pool } from "../db/pool.js";
import { normalizeIsbnFromRaw } from "../isbn.js";
import { lookupOpenLibraryByIsbn } from "../openLibrary.js";
import type { BookInput } from "../types.js";

export const booksRouter = Router();

const selectCols = `
  id, title, authors, contributors, isbn_uid, format, read_status,
  date_added, last_date_read, dates_read, read_count, moods, pace,
  character_or_plot_driven, strong_character_development, loveable_characters,
  diverse_characters, flawed_characters, star_rating, review, content_warnings,
  content_warning_description, tags, owned, created_at, updated_at
`;

booksRouter.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${selectCols} FROM books ORDER BY title ASC`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/** Resolve scanned text to ISBN and fetch metadata from Open Library. */
booksRouter.get("/lookup", async (req, res, next) => {
  try {
    const raw = String(req.query.raw ?? "").trim().slice(0, 2000);
    if (!raw) {
      res.status(400).json({ error: "Query parameter raw is required" });
      return;
    }
    const isbn = normalizeIsbnFromRaw(raw);
    if (!isbn) {
      res.status(422).json({
        error:
          "Could not parse an ISBN from the scan. Try a book barcode or a QR code that contains an ISBN.",
      });
      return;
    }
    const book = await lookupOpenLibraryByIsbn(isbn);
    if (!book) {
      res.status(404).json({
        error:
          "No book found for this ISBN in Open Library. You can still add it manually.",
        isbn,
      });
      return;
    }
    res.json(book);
  } catch (e) {
    next(e);
  }
});

booksRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const { rows } = await pool.query(
      `SELECT ${selectCols} FROM books WHERE id = $1`,
      [id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

function normalizeBody(body: Record<string, unknown>): BookInput {
  const str = (v: unknown) =>
    v === undefined || v === null ? null : String(v);
  const num = (v: unknown) => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const int = (v: unknown) => {
    if (v === undefined || v === null || v === "") return null;
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : null;
  };
  const bool = (v: unknown) => {
    if (v === undefined || v === null || v === "") return null;
    if (typeof v === "boolean") return v;
    const s = String(v).toLowerCase();
    if (s === "yes" || s === "true") return true;
    if (s === "no" || s === "false") return false;
    return null;
  };

  return {
    title: str(body.title) ?? "",
    authors: str(body.authors),
    contributors: str(body.contributors),
    isbn_uid: str(body.isbn_uid),
    format: str(body.format),
    read_status: str(body.read_status),
    date_added: str(body.date_added),
    last_date_read: str(body.last_date_read),
    dates_read: str(body.dates_read),
    read_count: int(body.read_count),
    moods: str(body.moods),
    pace: str(body.pace),
    character_or_plot_driven: str(body.character_or_plot_driven),
    strong_character_development: str(body.strong_character_development),
    loveable_characters: str(body.loveable_characters),
    diverse_characters: str(body.diverse_characters),
    flawed_characters: str(body.flawed_characters),
    star_rating: num(body.star_rating) != null ? String(num(body.star_rating)) : null,
    review: str(body.review),
    content_warnings: str(body.content_warnings),
    content_warning_description: str(body.content_warning_description),
    tags: str(body.tags),
    owned: bool(body.owned),
  };
}

booksRouter.post("/", async (req, res, next) => {
  try {
    const b = normalizeBody(req.body);
    if (!b.title.trim()) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const { rows } = await pool.query(
      `INSERT INTO books (
        title, authors, contributors, isbn_uid, format, read_status,
        date_added, last_date_read, dates_read, read_count, moods, pace,
        character_or_plot_driven, strong_character_development, loveable_characters,
        diverse_characters, flawed_characters, star_rating, review, content_warnings,
        content_warning_description, tags, owned
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
      ) RETURNING ${selectCols}`,
      [
        b.title,
        b.authors,
        b.contributors,
        b.isbn_uid,
        b.format,
        b.read_status,
        b.date_added,
        b.last_date_read,
        b.dates_read,
        b.read_count,
        b.moods,
        b.pace,
        b.character_or_plot_driven,
        b.strong_character_development,
        b.loveable_characters,
        b.diverse_characters,
        b.flawed_characters,
        b.star_rating,
        b.review,
        b.content_warnings,
        b.content_warning_description,
        b.tags,
        b.owned,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

booksRouter.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const b = normalizeBody(req.body);
    if (!b.title.trim()) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const { rows } = await pool.query(
      `UPDATE books SET
        title = $1, authors = $2, contributors = $3, isbn_uid = $4, format = $5,
        read_status = $6, date_added = $7, last_date_read = $8, dates_read = $9,
        read_count = $10, moods = $11, pace = $12, character_or_plot_driven = $13,
        strong_character_development = $14, loveable_characters = $15,
        diverse_characters = $16, flawed_characters = $17, star_rating = $18,
        review = $19, content_warnings = $20, content_warning_description = $21,
        tags = $22, owned = $23, updated_at = NOW()
      WHERE id = $24
      RETURNING ${selectCols}`,
      [
        b.title,
        b.authors,
        b.contributors,
        b.isbn_uid,
        b.format,
        b.read_status,
        b.date_added,
        b.last_date_read,
        b.dates_read,
        b.read_count,
        b.moods,
        b.pace,
        b.character_or_plot_driven,
        b.strong_character_development,
        b.loveable_characters,
        b.diverse_characters,
        b.flawed_characters,
        b.star_rating,
        b.review,
        b.content_warnings,
        b.content_warning_description,
        b.tags,
        b.owned,
        id,
      ]
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

booksRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const { rowCount } = await pool.query(`DELETE FROM books WHERE id = $1`, [
      id,
    ]);
    if (!rowCount) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
