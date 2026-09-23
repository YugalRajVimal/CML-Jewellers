/**
 * Escapes regex special characters in a raw string so it can be embedded safely
 * inside a MongoDB `$regex` filter. Without this, a search string like `a(b`
 * throws a regex compile error, and a crafted string can be used for a ReDoS
 * or to widen the match unexpectedly (e.g. `.*`).
 */
export function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }