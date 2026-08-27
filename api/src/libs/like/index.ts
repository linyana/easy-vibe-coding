// Escape SQL LIKE wildcard metacharacters in user input before wrapping it
// into a pattern (`%${escapeLikePattern(input)}%`). Without this, a `%`, `_`,
// or `\` typed by the user acts as a wildcard and widens the match.
//
// PostgreSQL's default ESCAPE character is the backslash for parameterized
// queries, so no explicit ESCAPE clause is needed alongside this.
export const escapeLikePattern = (input: string): string =>
	input.replace(/[\\%_]/g, (c) => `\\${c}`);
