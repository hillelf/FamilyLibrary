import type { BookPayload, Book, LookupResult } from "./types";

export function emptyBookPayload(): BookPayload {
  return {
    title: "",
    authors: null,
    contributors: null,
    isbn_uid: null,
    format: null,
    read_status: null,
    date_added: null,
    last_date_read: null,
    dates_read: null,
    read_count: null,
    moods: null,
    pace: null,
    character_or_plot_driven: null,
    strong_character_development: null,
    loveable_characters: null,
    diverse_characters: null,
    flawed_characters: null,
    star_rating: null,
    review: null,
    content_warnings: null,
    content_warning_description: null,
    tags: null,
    owned: null,
  };
}

export function bookPayloadFromLookup(lookup: LookupResult): BookPayload {
  const p = emptyBookPayload();
  p.title = lookup.title;
  p.authors = lookup.authors;
  p.isbn_uid = lookup.isbn;
  p.date_added = new Date().toISOString().slice(0, 10);
  p.owned = true;
  return p;
}

export function bookPayloadFromIsbnOnly(isbn: string): BookPayload {
  const p = emptyBookPayload();
  p.isbn_uid = isbn;
  p.date_added = new Date().toISOString().slice(0, 10);
  p.owned = true;
  return p;
}

export function bookToPayload(b: Book): BookPayload {
  return {
    title: b.title,
    authors: b.authors,
    contributors: b.contributors,
    isbn_uid: b.isbn_uid,
    format: b.format,
    read_status: b.read_status,
    date_added: b.date_added,
    last_date_read: b.last_date_read,
    dates_read: b.dates_read,
    read_count: b.read_count,
    moods: b.moods,
    pace: b.pace,
    character_or_plot_driven: b.character_or_plot_driven,
    strong_character_development: b.strong_character_development,
    loveable_characters: b.loveable_characters,
    diverse_characters: b.diverse_characters,
    flawed_characters: b.flawed_characters,
    star_rating: b.star_rating,
    review: b.review,
    content_warnings: b.content_warnings,
    content_warning_description: b.content_warning_description,
    tags: b.tags,
    owned: b.owned,
  };
}
