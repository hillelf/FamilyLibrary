import { pool } from "./pool.js";

const DDL = `
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT,
  contributors TEXT,
  isbn_uid TEXT,
  format TEXT,
  read_status TEXT,
  date_added DATE,
  last_date_read DATE,
  dates_read TEXT,
  read_count INTEGER,
  moods TEXT,
  pace TEXT,
  character_or_plot_driven TEXT,
  strong_character_development TEXT,
  loveable_characters TEXT,
  diverse_characters TEXT,
  flawed_characters TEXT,
  star_rating NUMERIC(3,1),
  review TEXT,
  content_warnings TEXT,
  content_warning_description TEXT,
  tags TEXT,
  owned BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_title ON books (title);
CREATE INDEX IF NOT EXISTS idx_books_authors ON books (authors);
`;

async function main() {
  await pool.query(DDL);
  console.log("Schema ready.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
