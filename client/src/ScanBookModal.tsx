import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { lookupBookFromScan, type LookupError } from "./api";
import {
  bookPayloadFromIsbnOnly,
  bookPayloadFromLookup,
} from "./bookPayload";
import type { BookPayload } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (payload: BookPayload) => void;
};

const BOOK_SCAN_FORMATS: Html5QrcodeSupportedFormats[] = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
];

async function getCameraConfig(): Promise<string | MediaTrackConstraints> {
  try {
    const devices = await Html5Qrcode.getCameras();
    if (devices.length === 0) {
      return { facingMode: "environment" };
    }
    const preferBack = devices.find((d) =>
      /back|rear|environment|wide/i.test(d.label)
    );
    if (preferBack) {
      return { deviceId: { exact: preferBack.id } };
    }
    return { deviceId: { exact: devices[0].id } };
  } catch {
    return { facingMode: "environment" };
  }
}

export function ScanBookModal({ open, onClose, onSuccess }: Props) {
  const readerId = useRef(`qr-${Math.random().toString(36).slice(2)}`).current;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  /** Ignore duplicate decode callbacks before stop() finishes or while a lookup is in flight. */
  const decodeBusyRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);
  onSuccessRef.current = onSuccess;
  onCloseRef.current = onClose;

  const [scanKey, setScanKey] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingIsbn, setPendingIsbn] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");

  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setScanKey(0);
      setHint(null);
      setPendingIsbn(null);
      setPasteText("");
    }
    prevOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    decodeBusyRef.current = false;
    const scanner = new Html5Qrcode(readerId, {
      formatsToSupport: BOOK_SCAN_FORMATS,
      verbose: false,
    });
    scannerRef.current = scanner;
    let cancelled = false;

    const onDecoded = (text: string) => {
      if (decodeBusyRef.current || cancelled) return;
      decodeBusyRef.current = true;

      void (async () => {
        try {
          await scanner.stop();
          scanner.clear();
        } catch {
          // ignore
        }
        if (cancelled) {
          decodeBusyRef.current = false;
          return;
        }
        setBusy(true);
        setHint(null);
        setPendingIsbn(null);
        try {
          const lookup = await lookupBookFromScan(text);
          onSuccessRef.current(bookPayloadFromLookup(lookup));
          onCloseRef.current();
        } catch (e) {
          const err = e as LookupError;
          if (err.isbn) {
            setPendingIsbn(err.isbn);
            setHint(err.message);
          } else {
            setHint(err.message || "Lookup failed");
          }
          setScanKey((k) => k + 1);
        } finally {
          decodeBusyRef.current = false;
          setBusy(false);
        }
      })();
    };

    void (async () => {
      const cameraConfig = await getCameraConfig();
      if (cancelled) return;
      try {
        await scanner.start(
          cameraConfig,
          {
            fps: 10,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.777778,
          },
          onDecoded,
          () => {}
        );
      } catch (err) {
        if (cancelled) return;
        try {
          await scanner.start(
            { facingMode: "user" },
            {
              fps: 10,
              qrbox: { width: 280, height: 280 },
            },
            onDecoded,
            () => {}
          );
        } catch (err2) {
          setHint(
            err2 instanceof Error
              ? `Camera: ${err2.message}`
              : err instanceof Error
                ? `Camera: ${err.message}`
                : "Could not access the camera."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      decodeBusyRef.current = false;
      scannerRef.current = null;
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, [open, readerId, scanKey]);

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = pasteText.trim();
    if (!text) return;
    setBusy(true);
    setHint(null);
    setPendingIsbn(null);
    try {
      const lookup = await lookupBookFromScan(text);
      onSuccess(bookPayloadFromLookup(lookup));
      onClose();
    } catch (err) {
      const e = err as LookupError;
      if (e.isbn) {
        setPendingIsbn(e.isbn);
        setHint(e.message);
      } else {
        setHint(e.message || "Lookup failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const running = scannerRef.current;
    if (running) {
      try {
        await running.stop();
        running.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }

    const s = new Html5Qrcode(readerId, {
      formatsToSupport: BOOK_SCAN_FORMATS,
      verbose: false,
    });
    setBusy(true);
    setHint(null);
    setPendingIsbn(null);
    try {
      const text = await s.scanFile(file, true);
      s.clear();
      try {
        const lookup = await lookupBookFromScan(text);
        onSuccess(bookPayloadFromLookup(lookup));
        onClose();
      } catch (err) {
        const e = err as LookupError;
        if (e.isbn) {
          setPendingIsbn(e.isbn);
          setHint(e.message);
        } else {
          setHint(e.message || "Lookup failed");
        }
        setScanKey((k) => k + 1);
      }
    } catch (err) {
      setHint(
        err instanceof Error
          ? err.message
          : "Could not read a barcode or QR code from this image."
      );
      setScanKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="overlay" role="presentation">
      <div
        className="modal modal-scan"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-title"
      >
        <h2 id="scan-title">Scan barcode or QR</h2>
        <p className="scan-intro">
          Use the camera on a book barcode (ISBN) or a QR code that contains an
          ISBN or product link. Metadata comes from{" "}
          <a
            href="https://openlibrary.org"
            target="_blank"
            rel="noreferrer"
          >
            Open Library
          </a>
          .
        </p>

        {hint && (
          <div className="scan-hint" role="status">
            {hint}
          </div>
        )}

        {pendingIsbn && (
          <div className="scan-actions-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onSuccess(bookPayloadFromIsbnOnly(pendingIsbn));
                onClose();
              }}
            >
              Add with ISBN only (enter title yourself)
            </button>
          </div>
        )}

        <div
          id={readerId}
          className={`qr-reader-host ${busy ? "qr-reader-host--dim" : ""}`}
        />

        <form className="scan-paste" onSubmit={handlePasteSubmit}>
          <label>
            Or paste ISBN / URL / scan text
            <input
              type="text"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="978… or https://…"
              disabled={busy}
              autoComplete="off"
            />
          </label>
          <button type="submit" className="btn" disabled={busy || !pasteText.trim()}>
            Look up
          </button>
        </form>

        <div className="scan-file">
          <label className="btn">
            Upload photo
            <input
              type="file"
              accept="image/*"
              className="visually-hidden"
              disabled={busy}
              onChange={(e) => void handleFileChange(e)}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
