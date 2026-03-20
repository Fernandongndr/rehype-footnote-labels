# rehype-footnote-labels

A [rehype](https://github.com/rehypejs/rehype) plugin that replaces numeric footnote markers with the **original label** from the markdown source — both in the inline superscript references and in the footnote definition list.

When you write `[^KPI]` in Markdown, `remark-gfm` renders the inline ref as `<sup><a>1</a></sup>` and the definition list as `<li>Key Performance Indicator</li>`. This plugin transforms both: the ref becomes `<sup><a>KPI</a></sup>` and the definition item is prefixed with `KPI: ` — preserving original casing throughout.

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
...
<section data-footnotes>
  <ol>
    <li id="fn-kpi"><p>Key Performance Indicator ...</p></li>
  </ol>
</section>
```

The visible `1` loses all meaning in context, and the definition list gives no indication of which label it corresponds to. This plugin changes both to:

```html
<p>Revenue grew<sup><a id="fnref-kpi" data-footnote-ref href="#fn-kpi">KPI</a></sup> last quarter.</p>
...
<section data-footnotes>
  <ol>
    <li id="fn-kpi"><p>KPI: Key Performance Indicator ...</p></li>
  </ol>
</section>
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
// Inline ref:  <sup><a ... data-footnote-ref ...>KPI</a></sup>
// Definition:  <li id="fn-kpi"><p>KPI: Key Performance Indicator ...</p></li>
```

---

## API

### `rehypeFootnoteLabels(options?)`

#### `options.source?: string`

The original Markdown source string. The plugin uses it to extract footnote labels and recover their original casing. Without this option the plugin performs no transformation and leaves numeric text in place.

#### `options.format?: (label: string) => string`

An optional function applied to the resolved label before it is written into the HTML. Applied to both the inline superscript reference and the definition list item prefix.

```ts
.use(rehypeFootnoteLabels, {
  source: markdown,
  format: (label) => `[${label}]`,
})
// Inline ref renders:    [KPI]
// Definition prefix:     [KPI]: Key Performance Indicator
```

---

## Before / After

| Location | Default HTML | With plugin |
|---|---|---|
| Inline ref `[^KPI]` | `<a ...>1</a>` | `<a ...>KPI</a>` |
| Inline ref `[^ROI]` | `<a ...>2</a>` | `<a ...>ROI</a>` |
| Definition `[^KPI]: ...` | `<li><p>Key Performance Indicator</p></li>` | `<li><p>KPI: Key Performance Indicator</p></li>` |

---

## How It Works

1. **Label extraction** — scans `source` with `/\[\^([^\]\n]+)\]/g` and builds a `Map<normalizedKey, originalLabel>` (e.g. `"kpi" → "KPI"`).
2. **Inline ref pass** — uses `unist-util-visit` to find `<a data-footnote-ref>` elements, extracts the normalized key from the `id` attribute (e.g. `fnref-kpi` → `"kpi"`, handles repeated refs like `fnref-kpi-2`), and replaces the element's children with a `Text` node containing the (optionally formatted) original label.
3. **Definition list pass** — visits `<li>` elements whose `id` matches the `fn-<key>` pattern, looks up the label in the same map, and prepends `"Label: "` as a text node to the first `<p>` child of each item.

---

## Limitations

- **Requires `source`** — because `remark-gfm` lowercases all identifiers internally, original casing cannot be recovered from the HAST alone. You must pass the original Markdown string.
- **Does not modify footnote IDs** — `href="#fn-kpi"` and `id="fnref-kpi"` are left unchanged. Only the visible text is affected.
- **Does not reimplement footnote parsing** — relies entirely on upstream `remark-gfm` + `remark-rehype` output.

---

## License

MIT
