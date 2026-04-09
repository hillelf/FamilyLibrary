export type OpenLibraryLookupResult = {
  isbn: string;
  title: string;
  authors: string | null;
  publish_date: string | null;
};

function isbn10ToIsbn13(isbn10: string): string {
  const core = "978" + isbn10.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(core[i], 10);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return core + check;
}

export async function lookupOpenLibraryByIsbn(
  isbn: string
): Promise<OpenLibraryLookupResult | null> {
  const variants: string[] = [isbn];
  if (isbn.length === 10 && /^\d{9}[\dX]$/.test(isbn)) {
    variants.push(isbn10ToIsbn13(isbn));
  }

  for (const v of variants) {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(v)}&format=json&jscmd=data`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) continue;

    const data = (await res.json()) as Record<string, unknown>;
    const key = `ISBN:${v}`;
    const entry = data[key] as
      | {
          title?: string;
          authors?: Array<{ name?: string }>;
          publish_date?: string;
        }
      | undefined;

    if (!entry || typeof entry.title !== "string") continue;

    const authors =
      entry.authors
        ?.map((a) => a.name)
        .filter((n): n is string => Boolean(n))
        .join(", ") || null;

    return {
      isbn: v.length === 13 ? v : isbn10ToIsbn13(v),
      title: entry.title,
      authors,
      publish_date:
        typeof entry.publish_date === "string" ? entry.publish_date : null,
    };
  }

  return null;
}
