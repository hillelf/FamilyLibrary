import type { Book, BookPayload, LookupResult } from "./types";

const base = "/api";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchBooks(): Promise<Book[]> {
  const res = await fetch(`${base}/books`);
  return handle<Book[]>(res);
}

export async function fetchBook(id: number): Promise<Book> {
  const res = await fetch(`${base}/books/${id}`);
  return handle<Book>(res);
}

export async function createBook(body: BookPayload): Promise<Book> {
  const res = await fetch(`${base}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handle<Book>(res);
}

export async function updateBook(id: number, body: BookPayload): Promise<Book> {
  const res = await fetch(`${base}/books/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handle<Book>(res);
}

export async function deleteBook(id: number): Promise<void> {
  const res = await fetch(`${base}/books/${id}`, { method: "DELETE" });
  await handle<void>(res);
}

export type LookupError = Error & {
  status?: number;
  /** Present when Open Library had no match but an ISBN was parsed. */
  isbn?: string;
};

export async function lookupBookFromScan(raw: string): Promise<LookupResult> {
  const res = await fetch(
    `${base}/books/lookup?raw=${encodeURIComponent(raw)}`
  );
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    isbn?: string;
  };
  if (!res.ok) {
    const err = new Error(body.error || res.statusText) as LookupError;
    err.status = res.status;
    if (typeof body.isbn === "string") err.isbn = body.isbn;
    throw err;
  }
  return body as LookupResult;
}
