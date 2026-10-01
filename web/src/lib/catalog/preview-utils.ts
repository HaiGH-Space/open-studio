/**
 * Utilities for formatting and assembling design system preview fixtures.
 */

export function buildPreviewHtml(
  componentsHtml: string,
  tokensCss?: string
): string {
  const isFullDoc = /<!doctype\s+html|<\s*html/i.test(componentsHtml)

  if (isFullDoc) {
    if (tokensCss && !componentsHtml.includes(tokensCss.slice(0, 30))) {
      if (componentsHtml.includes("</head>")) {
        return componentsHtml.replace(
          "</head>",
          `<style id="injected-tokens">\n${tokensCss}\n</style></head>`
        )
      }
    }
    return componentsHtml
  }

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      ${tokensCss ?? ""}
      *, *::before, *::after {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 24px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background-color: var(--bg, var(--background, #09090b));
        color: var(--fg, var(--foreground, #f4f4f5));
      }
    </style>
  </head>
  <body>
    ${componentsHtml}
  </body>
</html>`
}
