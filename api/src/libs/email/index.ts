// Email identity is case-insensitive (citext column) — this normalization keeps
// STORED data uniform (display/search consistency). Correctness never depends on
// it: citext comparisons and the unique constraint are case-insensitive on their
// own, so forgetting to normalize is cosmetic, not a bug.
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
