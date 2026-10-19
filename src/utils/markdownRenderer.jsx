import React from 'react';
import { cleanFormattedText } from './formattingUtils';

/**
 * Tokenizer for inline markdown formatting
 * Supports:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Inline Code: `code`
 * - Strikethrough: ~~text~~
 * - Markdown Link: [label](url)
 * - Wiki Link: [[Page Title]] or [[page:id|title]]
 * - Combined/Nested: e.g. **`code`** or **[link](url)**
 */
export const renderInlineMarkdown = (text, { allPages = [], onNavigatePage = null } = {}) => {
  if (!text) return null;

  // Clean and flatten any corrupted/double spans or malformed asterisks
  let cleanText = cleanFormattedText(text);

  // If text starts with leading heading hashes (e.g. #### Title), clean it for display
  if (/^#{1,6}\s+/.test(cleanText)) {
    cleanText = cleanText.replace(/^#{1,6}\s+/, '');
  }

  // Split and tokenize recursively
  const tokenize = (input, keyPrefix = 'tok') => {
    if (!input) return [];
    const elements = [];

    // Unified regex matching:
    // 1. Markdown link: \[([^\]]+)\]\(([^)]+)\)
    // 2. Wiki link: \[\[(?:page:([^|]+)\|)?([^\]]+)\]\]
    // 3. Bold-Italic: \*\*\*(.+?)\*\*\*|___(.+?)___
    // 4. Bold: \*\*(.+?)\*\*|__(.+?)__
    // 5. Strikethrough: ~~(.+?)~~
    // 6. Highlight: ==(.+?)==
    // 7. Inline code: `([^`]+)`
    // 8. Wavy spellcheck: ~wavy:([^~]+)~
    // 9. Color span: <span style="color:\s*([^"]+)">([\s\S]*?)<\/span>
    const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\[\[(?:page:([^|]+)\|)?([^\]]+)\]\]|\*\*\*(.+?)\*\*\*|___(.+?)___|\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|==(.+?)==|`([^`]+)`|~wavy:([^~]+)~|<span style=["']color:\s*([^"';]+);?["']>([\s\S]*?)<\/span>|(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)|(?<!_)_(?!_)([^_]+)(?<!_)_(?!_)|(?<!href=")(https?:\/\/[^\s<)\]]+))/g;

    let lastIndex = 0;
    let match;
    let counter = 0;

    while ((match = pattern.exec(input)) !== null) {
      const matchIndex = match.index;
      const fullMatch = match[0];

      // Push preceding plain text if any
      if (matchIndex > lastIndex) {
        elements.push(input.substring(lastIndex, matchIndex));
      }

      const key = `${keyPrefix}-${counter++}`;

      if (match[2] !== undefined && match[3] !== undefined) {
        // [label](url) -> Markdown link
        const label = match[2];
        const href = match[3];
        elements.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="notion-inline-link"
            onClick={(e) => e.stopPropagation()}
            title={href}
          >
            {tokenize(label, `${key}-lbl`)}
          </a>
        );
      } else if (match[4] !== undefined || match[5] !== undefined) {
        // [[Page Title]] or [[page:id|title]] -> Wiki Link / Page Mention
        const pageId = match[4];
        const pageTitle = match[5];
        const matchedPage = allPages.find(
          (p) =>
            (pageId && p.id === pageId) ||
            (p.title && p.title.toLowerCase() === pageTitle?.toLowerCase()) ||
            p.id === pageTitle
        );
        const displayTitle = matchedPage ? matchedPage.title : pageTitle;
        const displayIcon = matchedPage ? matchedPage.icon : '📄';

        elements.push(
          <span
            key={key}
            className="notion-inline-mention"
            onClick={(e) => {
              e.stopPropagation();
              if (matchedPage && onNavigatePage) {
                onNavigatePage(matchedPage.id);
              }
            }}
            title={matchedPage ? `Buka halaman: ${displayTitle}` : displayTitle}
          >
            <span className="mention-emoji">{displayIcon}</span>
            <span className="mention-text">{displayTitle}</span>
          </span>
        );
      } else if (match[6] !== undefined || match[7] !== undefined) {
        // ***bold italic***
        const biText = match[6] !== undefined ? match[6] : match[7];
        elements.push(
          <strong key={key} className="notion-inline-bold">
            <em className="notion-inline-italic">
              {tokenize(biText, `${key}-bi`)}
            </em>
          </strong>
        );
      } else if (match[8] !== undefined || match[9] !== undefined) {
        // **bold** or __bold__
        const boldText = match[8] !== undefined ? match[8] : match[9];
        elements.push(
          <strong key={key} className="notion-inline-bold">
            {tokenize(boldText, `${key}-b`)}
          </strong>
        );
      } else if (match[10] !== undefined) {
        // ~~strikethrough~~
        const strikeText = match[10];
        elements.push(
          <del key={key} className="notion-inline-strike">
            {tokenize(strikeText, `${key}-del`)}
          </del>
        );
      } else if (match[11] !== undefined) {
        // ==highlight==
        const hlText = match[11];
        elements.push(
          <mark key={key} className="notion-inline-highlight">
            {tokenize(hlText, `${key}-hl`)}
          </mark>
        );
      } else if (match[12] !== undefined) {
        // `code` -> Inline Code
        const codeText = match[12];
        elements.push(
          <code key={key} className="notion-inline-code">
            {codeText}
          </code>
        );
      } else if (match[13] !== undefined) {
        // ~wavy:word~ -> Spellcheck wavy underline
        const wavyText = match[13];
        elements.push(
          <span key={key} className="notion-spellcheck-wavy">
            {wavyText}
          </span>
        );
      } else if (match[14] !== undefined && match[15] !== undefined) {
        // <span style="color: ...">...</span>
        const color = match[14];
        const spanText = match[15];
        elements.push(
          <span key={key} style={{ color }} className="notion-inline-colored">
            {tokenize(spanText, `${key}-col`)}
          </span>
        );
      } else if (match[16] !== undefined || match[17] !== undefined) {
        // *italic* or _italic_
        const italicText = match[16] !== undefined ? match[16] : match[17];
        elements.push(
          <em key={key} className="notion-inline-italic">
            {tokenize(italicText, `${key}-em`)}
          </em>
        );
      } else if (match[18] !== undefined) {
        // Plain URL
        const plainUrl = match[18];
        elements.push(
          <a
            key={key}
            href={plainUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="notion-inline-link"
            onClick={(e) => e.stopPropagation()}
            title={plainUrl}
          >
            {plainUrl}
          </a>
        );
      }

      lastIndex = matchIndex + fullMatch.length;
    }

    // Push remaining text
    if (lastIndex < input.length) {
      elements.push(input.substring(lastIndex));
    }

    return elements;
  };

  return tokenize(cleanText);
};
