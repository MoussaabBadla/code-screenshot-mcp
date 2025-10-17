/**
 * HTML/CSS templates for code screenshot generation
 */

export interface Theme {
  name: string;
  background: string;
  foreground: string;
  selection: string;
  comment: string;
  keyword: string;
  string: string;
  function: string;
  variable: string;
  number: string;
}

export const themes: Record<string, Theme> = {
  dracula: {
    name: "Dracula",
    background: "#282a36",
    foreground: "#f8f8f2",
    selection: "#44475a",
    comment: "#6272a4",
    keyword: "#ff79c6",
    string: "#f1fa8c",
    function: "#50fa7b",
    variable: "#8be9fd",
    number: "#bd93f9",
  },
  nord: {
    name: "Nord",
    background: "#2e3440",
    foreground: "#d8dee9",
    selection: "#434c5e",
    comment: "#616e88",
    keyword: "#81a1c1",
    string: "#a3be8c",
    function: "#88c0d0",
    variable: "#d8dee9",
    number: "#b48ead",
  },
  monokai: {
    name: "Monokai",
    background: "#272822",
    foreground: "#f8f8f2",
    selection: "#49483e",
    comment: "#75715e",
    keyword: "#f92672",
    string: "#e6db74",
    function: "#a6e22e",
    variable: "#66d9ef",
    number: "#ae81ff",
  },
  "github-light": {
    name: "GitHub Light",
    background: "#ffffff",
    foreground: "#24292f",
    selection: "#f6f8fa",
    comment: "#57606a",
    keyword: "#cf222e",
    string: "#0a3069",
    function: "#6639ba",
    variable: "#953800",
    number: "#0550ae",
  },
  "github-dark": {
    name: "GitHub Dark",
    background: "#0d1117",
    foreground: "#c9d1d9",
    selection: "#1f6feb",
    comment: "#8b949e",
    keyword: "#ff7b72",
    string: "#a5d6ff",
    function: "#d2a8ff",
    variable: "#ffa657",
    number: "#79c0ff",
  },
};

export interface ScreenshotOptions {
  code: string;
  language: string;
  theme?: string;
  fontSize?: number;
  padding?: number;
  lineNumbers?: boolean;
  windowControls?: boolean;
  borderRadius?: number;
  boxShadow?: boolean;
  fontFamily?: string;
}

export function generateHTML(options: ScreenshotOptions): string {
  const theme = themes[options.theme || "dracula"] || themes.dracula;
  const fontSize = options.fontSize || 14;
  const padding = options.padding || 64;
  const lineNumbers = options.lineNumbers !== false;
  const windowControls = options.windowControls !== false;
  const borderRadius = options.borderRadius || 6;
  const boxShadow = options.boxShadow !== false;
  const fontFamily = options.fontFamily || "Fira Code, Monaco, Consolas, monospace";

  // Escape HTML
  const escapedCode = options.code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Generate line numbers
  const lines = escapedCode.split("\n");
  const lineNumbersHTML = lineNumbers
    ? `<div class="line-numbers">${lines.map((_, i) => `<div>${i + 1}</div>`).join("")}</div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Screenshot</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: transparent;
      padding: ${padding}px;
      font-family: ${fontFamily};
    }

    .container {
      background: ${theme.background};
      color: ${theme.foreground};
      border-radius: ${borderRadius}px;
      overflow: hidden;
      ${boxShadow ? `box-shadow: 0 20px 68px rgba(0, 0, 0, 0.55);` : ""}
      display: inline-block;
      min-width: 600px;
    }

    .window-controls {
      display: flex;
      gap: 8px;
      padding: 16px 20px;
      background: ${theme.background};
      border-top-left-radius: inherit;
      border-top-right-radius: inherit;
    }

    .window-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .window-dot:nth-child(1) { background: #ff5f56; }
    .window-dot:nth-child(2) { background: #ffbd2e; }
    .window-dot:nth-child(3) { background: #27c93f; }

    .code-container {
      display: flex;
      padding: 20px 0;
    }

    .line-numbers {
      padding: 0 20px;
      text-align: right;
      color: ${theme.comment};
      user-select: none;
      font-size: ${fontSize}px;
      line-height: 1.6;
      opacity: 0.5;
    }

    .code-content {
      flex: 1;
      padding: 0 20px 0 ${lineNumbers ? "0" : "20px"};
      overflow-x: auto;
    }

    pre {
      margin: 0;
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      line-height: 1.6;
      white-space: pre;
      color: ${theme.foreground};
    }

    code {
      font-family: inherit;
      font-size: inherit;
      color: inherit;
    }

    /* Syntax highlighting - comprehensive */
    .hljs-keyword,
    .hljs-selector-tag,
    .hljs-literal,
    .hljs-section,
    .hljs-link { color: ${theme.keyword}; font-weight: bold; }

    .hljs-string,
    .hljs-meta-string { color: ${theme.string}; }

    .hljs-function,
    .hljs-title,
    .hljs-class .hljs-title,
    .hljs-title.class_,
    .hljs-title.function_ { color: ${theme.function}; }

    .hljs-variable,
    .hljs-template-variable,
    .hljs-name,
    .hljs-attr,
    .hljs-attribute { color: ${theme.variable}; }

    .hljs-number,
    .hljs-symbol,
    .hljs-bullet,
    .hljs-meta { color: ${theme.number}; }

    .hljs-comment,
    .hljs-quote { color: ${theme.comment}; font-style: italic; }

    .hljs-type,
    .hljs-built_in,
    .hljs-builtin-name,
    .hljs-params { color: ${theme.variable}; }

    .hljs-tag,
    .hljs-selector-id,
    .hljs-selector-class,
    .hljs-regexp,
    .hljs-deletion { color: ${theme.keyword}; }

    .hljs-operator,
    .hljs-punctuation { color: ${theme.foreground}; }

    /* Reset background for all code elements */
    .hljs,
    pre code.hljs { background: transparent !important; }
  </style>
</head>
<body>
  <div class="container">
    ${
      windowControls
        ? `<div class="window-controls">
      <div class="window-dot"></div>
      <div class="window-dot"></div>
      <div class="window-dot"></div>
    </div>`
        : ""
    }
    <div class="code-container">
      ${lineNumbersHTML}
      <div class="code-content">
        <pre><code class="language-${options.language}">${escapedCode}</code></pre>
      </div>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/languages/dart.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/languages/go.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/languages/rust.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/languages/kotlin.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/languages/swift.min.js"></script>
  <script>
    hljs.highlightAll();
  </script>
</body>
</html>
  `.trim();
}
