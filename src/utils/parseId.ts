/**
 * Extracts the normalized footnote identifier from an element's id attribute.
 *
 * remark-gfm produces ids like:
 *   - "fnref-kpi"       (first reference)
 *   - "fnref-kpi-2"     (second reference to same footnote)
 *
 * Returns the lowercased label key, e.g. "kpi".
 * Returns null if the id does not match the expected pattern.
 */
export function parseFootnoteRefId(id: unknown): string | null {
  if (typeof id !== 'string') return null;
  const match = /^(?:user-content-)?fnref-(.+?)(?:-\d+)?$/.exec(id);
  return match ? match[1].toLowerCase() : null;
}
