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

   The client is served by Vite at **https://localhost:5173/** (port **5173**). See **[HTTPS → Local development (Vite)](#local-development-vite)** for how TLS, the self-signed cert, and the `/api` proxy work.

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

- **Camera access** requires a **secure context**. Local dev uses **https://localhost:5173/** so the scanner works without extra setup. The browser must grant camera permission.
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

Replace `hillelf/FamilyLibrary` with your GitHub user/org and repo name.

## HTTPS

HTTPS shows up in two ways: **Git** (push/pull with GitHub) and **local development** (the Vite app in your browser).

### Git remotes (GitHub)

Both **HTTPS** and **SSH** talk to GitHub over an **encrypted** connection:

| | **HTTPS** | **SSH** |
|---|-----------|---------|
| **Remote URL** | `https://github.com/USER/REPO.git` | `git@github.com:USER/REPO.git` |
| **Auth** | Username + [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) (GitHub no longer accepts account passwords for Git) | SSH private key on your machine, [public key added to GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account) |
| **Tip** | On macOS, Git can save the token in **Keychain** so you are not prompted every time | Run `ssh -T git@github.com` to verify; first connect may ask to trust GitHub’s host key—confirm the fingerprint matches [GitHub’s published SSH fingerprints](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints) |

Switch an existing remote:

```bash
# HTTPS
git remote set-url origin https://github.com/hillelf/FamilyLibrary.git

# SSH
git remote set-url origin git@github.com:hillelf/FamilyLibrary.git
```

Use whichever fits your workflow; many people use **HTTPS** for simplicity, or **SSH** so the remote URL never embeds tokens.

### Local development (Vite)

The dev client is served over **HTTPS** at **https://localhost:5173/** (see `client/vite.config.ts`). Vite uses [**@vitejs/plugin-basic-ssl**](https://github.com/vitejs/vite-plugin-basic-ssl) to generate a **self-signed** certificate for local TLS. Your browser may show a security warning the first time—that is expected; use “Advanced” / “Proceed to localhost” (wording varies) to continue.

The API process still listens on **http://localhost:3001**. The browser only loads the app from **https://localhost:5173**; requests to **`/api`** are **proxied by Vite** to the API, so the page keeps a **secure (HTTPS) origin** and you avoid **mixed-content** problems (the frontend does not call `http://` URLs directly from an HTTPS page).
