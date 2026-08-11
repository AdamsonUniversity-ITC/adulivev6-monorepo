import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "span", "div",
  "strong", "b", "em", "i", "u", "s", "del", "mark",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col",
  "img",
  "a",
  "blockquote", "pre", "code",
  "sub", "sup",
];

const ALLOWED_ATTR = [
  "style", "class", "href", "target", "rel",
  "src", "alt", "title", "width", "height",
  "colspan", "rowspan",
  "data-color", "data-text-align",
];

export function sanitizeRichTextHtml(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
  });
}
