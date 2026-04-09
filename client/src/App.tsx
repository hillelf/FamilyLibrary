import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBook,
  deleteBook,
  fetchBooks,
  updateBook,
} from "./api";
import { bookToPayload, emptyBookPayload } from "./bookPayload";
import { ScanBookModal } from "./ScanBookModal";
import type { Book, BookPayload } from "./types";
import "./App.css";

function BookForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: BookPayload;
  onSubmit: (p: BookPayload) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<BookPayload>(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const set =
    (key: keyof BookPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const v = e.target.value;
      if (key === "read_count") {
        setForm((f) => ({
          ...f,
          read_count: v === "" ? null : parseInt(v, 10) || null,
        }));
        return;
      }
      if (key === "owned") {
        setForm((f) => ({
          ...f,
          owned: v === "" ? null : v === "yes",
        }));
        return;
      }
      setForm((f) => ({ ...f, [key]: v === "" ? null : v }));
    };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="form-grid">
        <label className="full">
          Title *
          <input
            required
            value={form.title}
            onChange={set("title")}
            autoComplete="off"
          />
        </label>
        <label>
          Authors
          <input value={form.authors ?? ""} onChange={set("authors")} />
        </label>
        <label>
          ISBN / UID
          <input value={form.isbn_uid ?? ""} onChange={set("isbn_uid")} />
        </label>
        <label>
          Format
          <input value={form.format ?? ""} onChange={set("format")} />
        </label>
        <label>
          Read status
          <input
            value={form.read_status ?? ""}
            onChange={set("read_status")}
            placeholder="read, paused, …"
          />
        </label>
        <label>
          Date added
          <input type="date" value={form.date_added ?? ""} onChange={set("date_added")} />
        </label>
        <label>
          Last read
          <input
            type="date"
            value={form.last_date_read ?? ""}
            onChange={set("last_date_read")}
          />
        </label>
        <label>
          Read count
          <input
            type="number"
            min={0}
            value={form.read_count ?? ""}
            onChange={set("read_count")}
          />
        </label>
        <label>
          Star rating
          <input
            type="number"
            step="0.1"
            min={0}
            max={5}
            value={form.star_rating ?? ""}
            onChange={set("star_rating")}
          />
        </label>
        <label>
          Owned
          <select
            value={
              form.owned === null ? "" : form.owned ? "yes" : "no"
            }
            onChange={set("owned")}
          >
            <option value="">—</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="full">
          Tags
          <input value={form.tags ?? ""} onChange={set("tags")} />
        </label>
        <label className="full">
          Review
          <textarea value={form.review ?? ""} onChange={set("review")} />
        </label>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [createInitial, setCreateInitial] = useState<BookPayload>(() =>
    emptyBookPayload()
  );
  const [scanOpen, setScanOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await fetchBooks();
      setBooks(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load books");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => {
      const hay = [
        b.title,
        b.authors,
        b.isbn_uid,
        b.tags,
        b.read_status,
        b.format,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [books, query]);

  async function handleCreate(p: BookPayload) {
    await createBook(p);
    setCreateOpen(false);
    setCreateInitial(emptyBookPayload());
    await load();
  }

  function openCreateBlank() {
    setCreateInitial(emptyBookPayload());
    setCreateFormKey((k) => k + 1);
    setCreateOpen(true);
  }

  function openCreateFromScan(payload: BookPayload) {
    setCreateInitial(payload);
    setCreateFormKey((k) => k + 1);
    setCreateOpen(true);
    setScanOpen(false);
  }

  async function handleUpdate(p: BookPayload) {
    if (!editing) return;
    await updateBook(editing.id, p);
    setEditing(null);
    await load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this book from the library?")) return;
    try {
      await deleteBook(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Family Library</h1>
        <p>
          Browse, add, edit, and remove titles. Data is stored in PostgreSQL.
        </p>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="toolbar">
        <div className="search">
          <input
            type="search"
            placeholder="Search title, author, ISBN, tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search books"
          />
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className="btn"
            onClick={() => setScanOpen(true)}
          >
            Scan to add
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateBlank}
          >
            Add book
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="table-wrap">
          <p className="empty">
            {books.length === 0
              ? "No books yet. Add one or load your CSV on the server."
              : "No matches for your search."}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Owned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="cell-title">{b.title}</td>
                  <td className="cell-meta">{b.authors ?? "—"}</td>
                  <td>
                    {b.read_status ? (
                      <span className="status">{b.read_status}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{b.star_rating ?? "—"}</td>
                  <td>
                    {b.owned === true && (
                      <span className="badge-owned">Yes</span>
                    )}
                    {b.owned === false && (
                      <span className="badge-not-owned">No</span>
                    )}
                    {b.owned === null && "—"}
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setEditing(b)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => void handleDelete(b.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {scanOpen && (
        <ScanBookModal
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          onSuccess={openCreateFromScan}
        />
      )}

      {createOpen && (
        <div className="overlay" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
          >
            <h2 id="create-title">Add book</h2>
            <BookForm
              key={createFormKey}
              initial={createInitial}
              submitLabel="Create"
              onCancel={() => {
                setCreateOpen(false);
                setCreateInitial(emptyBookPayload());
              }}
              onSubmit={(p) => void handleCreate(p)}
            />
          </div>
        </div>
      )}

      {editing && (
        <div className="overlay" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
          >
            <h2 id="edit-title">Edit book</h2>
            <BookForm
              key={editing.id}
              initial={bookToPayload(editing)}
              submitLabel="Save"
              onCancel={() => setEditing(null)}
              onSubmit={(p) => void handleUpdate(p)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
