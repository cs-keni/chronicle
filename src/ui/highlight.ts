// Minimal single-pass syntax highlighter for the code overlay.
//
// No external dependency (Prism/hljs would blow the bundle and trip the CSP).
// A char-walk tokenizer is small, correct, and good enough for the two langs we
// show: TypeScript and CSS. It handles line/block comments, strings (all three
// quote styles), numbers, hex colors, and a keyword set — then escapes every
// emitted chunk before wrapping it in a span. Output is safe innerHTML because
// the only source is our own repo files, and we HTML-escape regardless.

export type Lang = 'ts' | 'css';

const TS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'class', 'new', 'import',
  'export', 'from', 'as', 'type', 'interface', 'extends', 'implements',
  'private', 'public', 'protected', 'readonly', 'static', 'this', 'void',
  'async', 'await', 'of', 'in', 'typeof', 'instanceof', 'null', 'undefined',
  'true', 'false', 'number', 'string', 'boolean', 'any', 'never', 'enum',
]);

const ISW = (c: string) => /[A-Za-z0-9_$]/.test(c);
const ISDIGIT = (c: string) => c >= '0' && c <= '9';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function highlight(code: string, lang: Lang): string {
  let out = '';
  const n = code.length;
  let i = 0;

  const push = (cls: string, text: string) => {
    out += cls ? `<span class="hl-${cls}">${esc(text)}</span>` : esc(text);
  };

  while (i < n) {
    const c = code[i];
    const next = code[i + 1];

    // Line comment (TS only — CSS has no //)
    if (lang === 'ts' && c === '/' && next === '/') {
      let j = i + 2;
      while (j < n && code[j] !== '\n') j++;
      push('comment', code.slice(i, j));
      i = j;
      continue;
    }

    // Block comment (both langs)
    if (c === '/' && next === '*') {
      let j = i + 2;
      while (j < n && !(code[j] === '*' && code[j + 1] === '/')) j++;
      j = Math.min(j + 2, n);
      push('comment', code.slice(i, j));
      i = j;
      continue;
    }

    // Strings: ' " `
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < n) {
        if (code[j] === '\\') { j += 2; continue; }
        if (code[j] === c) { j++; break; }
        j++;
      }
      push('str', code.slice(i, j));
      i = j;
      continue;
    }

    // Hex color (#rgb / #rrggbb / #rrggbbaa) — this project lives and dies by color
    if (c === '#') {
      const m = /^#[0-9A-Fa-f]{3,8}\b/.exec(code.slice(i, i + 10));
      if (m) {
        push('color', m[0]);
        i += m[0].length;
        continue;
      }
    }

    // Numbers (incl. decimals and units like 20px / 0.65)
    if (ISDIGIT(c) || (c === '.' && ISDIGIT(next))) {
      let j = i;
      while (j < n && /[0-9.]/.test(code[j])) j++;
      // trailing unit / suffix (px, ms, vh, em, s…)
      while (j < n && /[a-z%]/.test(code[j])) j++;
      push('num', code.slice(i, j));
      i = j;
      continue;
    }

    // Identifiers / keywords
    if (ISW(c) && !ISDIGIT(c)) {
      let j = i;
      while (j < n && ISW(code[j])) j++;
      const word = code.slice(i, j);
      push(lang === 'ts' && TS_KEYWORDS.has(word) ? 'kw' : '', word);
      i = j;
      continue;
    }

    // CSS at-rules (@media, @supports…) and custom props (--foo)
    if (lang === 'css' && (c === '@' || (c === '-' && next === '-'))) {
      let j = i + 1;
      while (j < n && /[A-Za-z-]/.test(code[j])) j++;
      push('kw', code.slice(i, j));
      i = j;
      continue;
    }

    push('', c);
    i++;
  }

  return out;
}
