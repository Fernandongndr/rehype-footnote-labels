/**
 * Extracts footnote labels from a markdown source string.
 *
 * Returns a map from normalized key (lowercase) → original label.
 * e.g. "[^KPI]" → { "kpi": "KPI" }
 */
export function extractLabelsFromSource(source: string): Map<string, string> {
  const map = new Map<string, string>();
  // Matches both references [^label] and definitions [^label]:
  const pattern = /\[\^([^\]\n]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    const label = match[1];
    const key = label.toLowerCase();
    if (!map.has(key)) {
      map.set(key, label);
    }
  }
  return map;
}
