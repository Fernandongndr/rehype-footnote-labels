# rehype-footnote-labels

A [rehype](https://github.com/rehypejs/rehype) plugin that replaces the numeric text inside footnote reference anchors with the **original label** from the markdown source.

When you write `[^KPI]` in Markdown, `remark-gfm` renders it as `<sup><a>1</a></sup>`. This plugin transforms that into `<sup><a>KPI</a></sup>` — preserving original casing.

---

## Problem

Given this Markdown:

```md
Revenue grew[^KPI] last quarter.

[^KPI]: Key Performance Indicator
```

The default HTML output from `remark-gfm` + `remark-rehype` is:

```html
<p>Revenue grew<sup><a id="fnref-kpi" data-footnote-ref href="#fn-kpi">1</a></sup> last quarter.</p>
```

The visible `1` loses all meaning in context. This plugin changes it to:

```html
<p>Revenue grew<sup><a id="fnref-kpi" data-footnote-ref href="#fn-kpi">KPI</a></sup> last quarter.</p>
```

---

## Installation

```sh
npm install rehype-footnote-labels
```

---

## Usage

```ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeFootnoteLabels from 'rehype-footnote-labels';

const markdown = `
Revenue grew[^KPI] last quarter.

[^KPI]: Key Performance Indicator
`;

const result = await unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeFootnoteLabels, { source: markdown })
  .use(rehypeStringify)
  .process(markdown);

console.log(String(result));
// <p>Revenue grew<sup><a ... data-footnote-ref ...>KPI</a></sup> last quarter.</p>
```

---

## API

### `rehypeFootnoteLabels(options?)`

#### `options.source?: string`

The original Markdown source string. The plugin uses it to extract footnote labels and recover their original casing. Without this option the plugin performs no transformation and leaves numeric text in place.

#### `options.format?: (label: string) => string`

An optional function applied to the resolved label before it is written into the HTML. Useful for wrapping or styling the label.

```ts
.use(rehypeFootnoteLabels, {
  source: markdown,
  format: (label) => `[${label}]`,
})
// Renders: [KPI] instead of: KPI
```

---

## Before / After

| Input Markdown | Default HTML | With plugin |
|---|---|---|
| `[^KPI]` | `<a ...>1</a>` | `<a ...>KPI</a>` |
| `[^ROI]` | `<a ...>2</a>` | `<a ...>ROI</a>` |
| `[^MyLabel]` | `<a ...>1</a>` | `<a ...>MyLabel</a>` |

---

## How It Works

1. **Label extraction** — scans `source` with `/\[\^([^\]\n]+)\]/g` and builds a `Map<normalizedKey, originalLabel>` (e.g. `"kpi" → "KPI"`).
2. **AST traversal** — uses `unist-util-visit` to find `<a data-footnote-ref>` elements in the HAST.
3. **ID parsing** — extracts the normalized key from the element's `id` attribute (e.g. `fnref-kpi` → `"kpi"`, handles repeated refs like `fnref-kpi-2`).
4. **Replacement** — swaps the element's children with a single `Text` node containing the (optionally formatted) original label.

---

## Limitations

- **Requires `source`** — because `remark-gfm` lowercases all identifiers internally, original casing cannot be recovered from the HAST alone. You must pass the original Markdown string.
- **Does not modify footnote IDs** — `href="#fn-kpi"` and `id="fnref-kpi"` are left unchanged. Only the visible text is affected.
- **Does not modify footnote definitions** — the `<section data-footnotes>` block is untouched.
- **Does not reimplement footnote parsing** — relies entirely on upstream `remark-gfm` + `remark-rehype` output.

---

## License

MIT
