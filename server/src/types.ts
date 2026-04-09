export type BookRow = {
  id: number;
  title: string;
  authors: string | null;
  contributors: string | null;
  isbn_uid: string | null;
  format: string | null;
  read_status: string | null;
  date_added: string | null;
  last_date_read: string | null;
  dates_read: string | null;
  read_count: number | null;
  moods: string | null;
  pace: string | null;
  character_or_plot_driven: string | null;
  strong_character_development: string | null;
  loveable_characters: string | null;
  diverse_characters: string | null;
  flawed_characters: string | null;
  star_rating: string | null;
  review: string | null;
  content_warnings: string | null;
  content_warning_description: string | null;
  tags: string | null;
  owned: boolean | null;
  created_at: string;
  updated_at: string;
};

export type BookInput = Omit<
  BookRow,
  "id" | "created_at" | "updated_at"
> & { id?: number };
