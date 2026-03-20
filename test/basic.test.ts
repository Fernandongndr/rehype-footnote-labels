import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeFootnoteLabels from '../src/index.js';

async function process(markdown: string, format?: (l: string) => string) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeFootnoteLabels, { source: markdown, format })
    .use(rehypeStringify)
    .process(markdown);
  return String(result);
}

describe('rehype-footnote-labels', () => {
  it('replaces a single footnote reference with its original label', async () => {
    const md = 'See[^KPI] for details.\n\n[^KPI]: Key Performance Indicator';
    const html = await process(md);
    // The anchor text should be "KPI" not "1"
    expect(html).toContain('>KPI<');
    expect(html).not.toMatch(/>1</);
  });

  it('preserves original casing (uppercase)', async () => {
    const md = 'Topic[^API].\n\n[^API]: Application Programming Interface';
    const html = await process(md);
    expect(html).toContain('>API<');
  });

  it('preserves mixed casing', async () => {
    const md = 'See[^MyLabel].\n\n[^MyLabel]: Some label';
    const html = await process(md);
    expect(html).toContain('>MyLabel<');
  });

  it('handles repeated references to the same footnote', async () => {
    const md =
      'First[^KPI] and second[^KPI] mention.\n\n[^KPI]: Key Performance Indicator';
    const html = await process(md);
    const matches = [...html.matchAll(/>KPI</g)];
    // Both references should use the label
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('handles multiple distinct footnotes', async () => {
    const md =
      'A[^KPI] and B[^ROI].\n\n[^KPI]: Key Performance Indicator\n\n[^ROI]: Return on Investment';
    const html = await process(md);
    expect(html).toContain('>KPI<');
    expect(html).toContain('>ROI<');
  });

  it('does not crash when no source is provided (numeric fallback)', async () => {
    // Without source we cannot resolve labels; numeric text should remain.
    const md = 'See[^KPI].\n\n[^KPI]: Key Performance Indicator';
    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeFootnoteLabels) // no options
      .use(rehypeStringify)
      .process(md);
    const html = String(result);
    // Should still produce valid HTML without throwing
    expect(html).toContain('data-footnote-ref');
    // Numeric reference remains because no source was given
    expect(html).toMatch(/>\d+</);
  });

  it('applies the format option', async () => {
    const md = 'See[^KPI].\n\n[^KPI]: Key Performance Indicator';
    const html = await process(md, (label) => `[${label}]`);
    expect(html).toContain('>[KPI]<');
  });

  it('does not affect non-footnote anchors', async () => {
    const md =
      '[link](https://example.com) and[^KPI].\n\n[^KPI]: Key Performance Indicator';
    const html = await process(md);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('>KPI<');
  });

  // Footnote definition list item labeling
  it('prefixes footnote definition list item with label', async () => {
    const md = 'See[^KPI].\n\n[^KPI]: Key Performance Indicator';
    const html = await process(md);
    expect(html).toContain('KPI: Key Performance Indicator');
  });

  it('prefixes multiple footnote definitions each with their own label', async () => {
    const md =
      'A[^KPI] and B[^ROI].\n\n[^KPI]: Key Performance Indicator\n\n[^ROI]: Return on Investment';
    const html = await process(md);
    expect(html).toContain('KPI: Key Performance Indicator');
    expect(html).toContain('ROI: Return on Investment');
  });

  it('applies format option to footnote definition list item prefix', async () => {
    const md = 'See[^KPI].\n\n[^KPI]: Key Performance Indicator';
    const html = await process(md, (label) => `[${label}]`);
    expect(html).toContain('[KPI]: Key Performance Indicator');
  });

  it('does not prefix footnote definitions when no source is provided', async () => {
    const md = 'See[^KPI].\n\n[^KPI]: Key Performance Indicator';
    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeFootnoteLabels) // no options
      .use(rehypeStringify)
      .process(md);
    const html = String(result);
    // Without source, no label prefix is added
    expect(html).not.toContain('KPI: Key Performance Indicator');
  });
});
