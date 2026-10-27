/**
 * "Did you mean …?" for mistyped email domains. Local only, nothing is sent.
 * The email cannot be changed after registration (docs/handoff.md §4), so a
 * typo caught here saves an account.
 */
const KNOWN_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "mail.com",
  "gmx.com",
  "proton.me",
  "protonmail.com",
  "yandex.com",
];

const known = new Set(KNOWN_DOMAINS);

/**
 * Edit distance where a swap of two neighbouring letters counts as one edit,
 * the way typos happen ("gmial"). Small strings only.
 */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/**
 * The corrected address when the domain is one edit from a common one (two for
 * long domains), else null. Real domains such as "acme.com" are left alone.
 */
export function suggestEmail(input: string): string | null {
  const value = input.trim();
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1 || value.indexOf("@") !== at) return null;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1).toLowerCase();
  if (known.has(domain)) return null;

  const allowed = domain.length >= 12 ? 2 : 1;
  let best: string | null = null;
  let bestDistance = allowed + 1;
  for (const candidate of KNOWN_DOMAINS) {
    const d = editDistance(domain, candidate);
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best ? `${local}@${best}` : null;
}
