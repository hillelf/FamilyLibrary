/** Extract ISBN-10 or ISBN-13 from a barcode/QR scan or pasted text. */
export function normalizeIsbnFromRaw(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  try {
    const u = new URL(s);
    const blob = u.pathname + u.search;
    const m = blob.match(
      /(?:^|\/)(97[89]\d{10}|\d{9}[\dXx])(?:\/|$|[?&#])/i
    );
    if (m) {
      const inner = m[1].replace(/-/g, "").toUpperCase();
      return normalizeDigits(inner);
    }
  } catch {
    // not a URL
  }

  const compact = s.replace(/-/g, "").replace(/\s/g, "");
  if (/^\d{9}[\dXx]$/.test(compact)) {
    return compact.toUpperCase();
  }

  const digits = s.replace(/\D/g, "");
  if (
    digits.length === 13 &&
    (digits.startsWith("978") || digits.startsWith("979"))
  ) {
    return digits;
  }
  if (digits.length === 10 && /^\d{10}$/.test(digits)) {
    return digits;
  }
  if (digits.length > 13) {
    const tail = digits.slice(-13);
    if (tail.startsWith("978") || tail.startsWith("979")) return tail;
    const tail10 = digits.slice(-10);
    if (/^\d{10}$/.test(tail10)) return tail10;
  }
  return null;
}

function normalizeDigits(inner: string): string | null {
  if (
    /^\d{13}$/.test(inner) &&
    (inner.startsWith("978") || inner.startsWith("979"))
  ) {
    return inner;
  }
  if (/^\d{9}[\dX]$/.test(inner)) return inner.toUpperCase();
  return null;
}
