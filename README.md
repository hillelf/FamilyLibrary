# Family Library

A small web app to browse and manage books stored in PostgreSQL, with a React client and Express API.

## Development

1. **Start PostgreSQL** (from the project root):

   ```bash
   npm run db:up
   ```

2. **Install dependencies** (root, client, and server):

   ```bash
   npm run setup
   ```

3. **Initialize the database schema**:

   ```bash
   npm run db:init
   ```

4. **Run the app** (API and Vite dev server together):

   ```bash
   npm run dev
   ```

   The client is served by Vite (default port **5173**) and proxies `/api` to the API on **3001**.

Optional: load a CSV into the database with `npm run db:load` (see `server/scripts` for expectations).

## Scanning barcodes and QR codes to add books

**Scan to add** opens a scanner that uses your device camera (via [html5-qrcode](https://github.com/mebjas/html5-qrcode)) to read:

- **Book barcodes** — typically ISBN-13/EAN (the barcode on the back of most books).
- **QR codes** — any QR that encodes an ISBN, plain text, or a URL that contains an ISBN (for example, a product link).

You can also:

- **Paste** an ISBN, URL, or scanned text into the field and choose **Look up**.
- **Upload a photo** of the barcode or QR if the camera is unavailable.

### What happens after a scan

1. The app sends the scanned text to the API (`GET /api/books/lookup?raw=…`).
2. The server parses an **ISBN** (ISBN-10 or ISBN-13) from the text or URL.
3. It fetches **title** and **authors** from the **[Open Library](https://openlibrary.org)** API (server-side, so the browser does not call Open Library directly).
4. The **Add book** form opens with fields prefilled (including ISBN, date added, and owned). You can edit and save as usual.

### If the book is not found in Open Library

If the ISBN is valid but Open Library has no match, you can use **Add with ISBN only (enter title yourself)** to create a row with the ISBN filled in and add the title manually.

### Requirements and limitations

- **Camera access** requires a **secure context**: use **HTTPS** in production, or **http://localhost** for local development. The browser must grant camera permission.
- **Coverage** depends on Open Library. Very new or obscure titles may not appear; you can still add them by hand.
- The API must be able to reach **openlibrary.org** for lookups to succeed.

## Git and GitHub

`server/.env` (local database URL) is **not** tracked; use `server/.env.example` as a template.

From the **FamilyLibrary** project root on your machine:

```bash
chmod +x scripts/git-init.sh
./scripts/git-init.sh
```

Or manually:

```bash
git init --initial-branch=main
git add -A
git commit -m "Initial commit: Family Library app"
```

Then create a **new empty** repository on GitHub (no README, no license), and push:

```bash
git remote add origin git@github.com:hillelf/FamilyLibrary.git
git push -u origin main
```

Replace `hillelf/FamilyLibrary` with your GitHub user/org and repo name. Use **HTTPS** instead of SSH if you do not use SSH keys:

```bash
git remote add origin https://github.com/hillelf/FamilyLibrary.git
```
