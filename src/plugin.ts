import { visit } from 'unist-util-visit';
import type { Root, Element, Text } from 'hast';
import type { Plugin } from 'unified';
import { extractLabelsFromSource } from './utils/extractLabels.js';
import { parseFootnoteRefId } from './utils/parseId.js';

export interface Options {
  /**
   * The original markdown source string. Used as a fallback to extract
   * footnote labels when they cannot be read from the HAST directly.
   */
  source?: string;

  /**
   * Optional formatter applied to the resolved label before it is rendered.
   *
   * @example
   * // Wrap label in square brackets
   * format: (label) => `[${label}]`
   */
  format?: (label: string) => string;
}

/**
 * Builds a label map from the HAST by scanning footnote definition sections.
 *
 * remark-rehype emits a <section data-footnotes> containing an <ol> where
 * each <li id="fn-<key>"> holds the original definition text. Scanning these
 * gives us the normalized key → but NOT the original casing. We still need
 * the source fallback for casing. This function is kept for potential future
 * use when upstream tools expose original labels in the AST.
 */
function buildLabelMapFromAst(_tree: Root): Map<string, string> {
  // remark-gfm currently lowercases all identifiers before writing them into
  // the HAST, so we cannot recover original casing from the AST alone.
  // Return an empty map; the caller falls back to source extraction.
  return new Map<string, string>();
}

const rehypeFootnoteLabels: Plugin<[Options?], Root> = (options = {}) => {
  const { source, format } = options;

  return (tree: Root) => {
    // 1. Try to read labels from the AST (currently always empty — future-proof).
    const astMap = buildLabelMapFromAst(tree);

    // 2. Supplement with labels extracted from the markdown source string.
    const sourceMap: Map<string, string> =
      source ? extractLabelsFromSource(source) : new Map();

    // Merged map: AST wins over source (when AST eventually exposes labels).
    const labelMap = new Map<string, string>([...sourceMap, ...astMap]);

    // 3. Walk the HAST and replace children of matching anchor elements.
    visit(tree, 'element', (node: Element) => {
      if (
        node.tagName !== 'a' ||
        node.properties?.dataFootnoteRef !== true
      ) {
        return;
      }

      const key = parseFootnoteRefId(node.properties?.id);
      if (key === null) return;

      const originalLabel = labelMap.get(key);
      if (originalLabel === undefined) {
        // No label found — leave numeric fallback intact.
        return;
      }

      const displayLabel = format ? format(originalLabel) : originalLabel;

      const textNode: Text = { type: 'text', value: displayLabel };
      node.children = [textNode];
    });
  };
};

export default rehypeFootnoteLabels;
