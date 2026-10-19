/**
 * formattingUtils.js
 * Comprehensive rich formatting utilities for Noted
 * Ensures 100% clean formatting without double spans or exposed code tags,
 * matching Notion Desktop 7.39.0 REA standards.
 */

/**
 * Flattens and removes any nested or redundant <span style="color:..."> tags.
 * Ensures that applying colors repeatedly never creates nested/double spans.
 */
export const flattenDoubleSpans = (text) => {
  if (!text || typeof text !== 'string') return text || '';
  if (!text.includes('<span') && !text.includes('</span>')) return text;

  let str = text;

  // 1. Remove empty spans: <span ...></span>
  str = str.replace(/<span[^>]*>\s*<\/span>/gi, '');

  // 2. Linear pattern for immediately adjacent nested spans:
  // e.g. <span style="color: #448361"><span style="color: #d44c47">Hello</span></span>
  str = str.replace(
    /<span\s+style=["']color:\s*([^"';]+);?["']>\s*<span\s+style=["']color:\s*([^"';]+);?["']>([\s\S]*?)<\/span>\s*<\/span>/gi,
    '<span style="color: $2">$3</span>'
  );

  // 3. Nested spans with markdown asterisks in between:
  // e.g. *<span style="...">**<span style="...">Hello</span>**</span>*
  str = str.replace(
    /(\*+)<span\s+style=["']color:\s*[^"';]+;?["']>(\*+)<span\s+style=["']color:\s*([^"';]+);?["']>([\s\S]*?)<\/span>(\*+)<\/span>(\*+)/gi,
    (match, p1, p2, col, innerText, s1, s2) => {
      const totalStars = Math.max(p1.length + p2.length, s1.length + s2.length);
      const stars = totalStars >= 3 ? '***' : totalStars === 2 ? '**' : '*';
      return `${stars}<span style="color: ${col}">${innerText}</span>${stars}`;
    }
  );

  // 4. Inverted nested spans: <span style="...">**<span style="...">...</span>**</span>
  str = str.replace(
    /<span\s+style=["']color:\s*[^"';]+;?["']>(\s*\*+\s*)<span\s+style=["']color:\s*([^"';]+);?["']>([\s\S]*?)<\/span>(\s*\*+\s*)<\/span>/gi,
    '$1<span style="color: $2">$3</span>$4'
  );

  // 5. Clean orphan closing spans: </span> that have no preceding <span
  // Only if mismatched
  return str;
};

/**
 * Clean and normalize text from any malformed formatting
 */
export const cleanFormattedText = (text) => {
  if (!text || typeof text !== 'string') return text || '';
  let cleaned = flattenDoubleSpans(text);

  // Clean orphan open spans that have no corresponding </span>
  const openSpanMatches = cleaned.match(/<span[^>]*>/gi);
  const closeSpanMatches = cleaned.match(/<\/span>/gi);
  const openCount = openSpanMatches ? openSpanMatches.length : 0;
  const closeCount = closeSpanMatches ? closeSpanMatches.length : 0;
  if (openCount > closeCount) {
    // Strip unclosed or malformed span tags
    cleaned = cleaned.replace(/<span(?![^>]*<\/span>)[^>]*>/gi, '');
  }
  if (closeCount > openCount) {
    cleaned = cleaned.replace(/<\/span>/gi, '');
  }

  // Clean double asterisks surrounding already bold text: ****word**** -> **word**
  cleaned = cleaned.replace(/\*{4,}([^*]+)\*{4,}/g, '**$1**');

  return cleaned;
};

/**
 * Apply or toggle a text color cleanly on a chunk within text
 */
export const applyColorToText = (fullText, targetChunk, colorVal) => {
  if (!fullText) return '';
  if (!targetChunk) return fullText;

  // Clean chunk of any existing span tags
  const rawChunk = targetChunk.replace(/<span style="color:[^"]*">([\s\S]*?)<\/span>/gi, '$1').trim();
  if (!rawChunk) return fullText;

  let result = fullText;

  // Check if target is already inside an existing color span:
  // e.g. <span style="color: #123456">...targetChunk...</span>
  const spanRegex = new RegExp(`<span\\s+style=["']color:\\s*([^"';]+);?["']>([\\s\\S]*?${escapeRegex(targetChunk)}[\\s\\S]*?)<\\/span>`, 'gi');

  if (spanRegex.test(result)) {
    if (!colorVal || colorVal === 'default') {
      // Remove color: unwrap the span
      result = result.replace(spanRegex, '$2');
    } else {
      // Replace existing color with the new color
      result = result.replace(spanRegex, (match, oldColor, inner) => {
        return `<span style="color: ${colorVal}">${inner}</span>`;
      });
    }
  } else {
    // Target is not yet wrapped in a span
    if (!colorVal || colorVal === 'default') {
      // Strip any inner spans
      result = result.replace(targetChunk, rawChunk);
    } else {
      result = result.replace(targetChunk, `<span style="color: ${colorVal}">${rawChunk}</span>`);
    }
  }

  return cleanFormattedText(result);
};

/**
 * Apply or toggle standard markdown formatting (bold, italic, strikethrough, code)
 */
export const applyMarkdownFormat = (fullText, targetChunk, formatType) => {
  if (!fullText || !targetChunk) return fullText || '';

  const cleanChunk = targetChunk.trim();
  if (!cleanChunk) return fullText;

  let result = fullText;

  if (formatType === 'bold') {
    // 1. If inside ***word***: toggle bold OFF -> *word*
    if (result.includes(`***${cleanChunk}***`)) {
      result = result.replace(`***${cleanChunk}***`, `*${cleanChunk}*`);
      return cleanFormattedText(result);
    }
    // 2. If inside **word**: toggle bold OFF -> word
    if (result.includes(`**${cleanChunk}**`)) {
      result = result.replace(`**${cleanChunk}**`, cleanChunk);
      return cleanFormattedText(result);
    }
    // 3. If inside *word*: toggle bold ON -> ***word***
    if (result.includes(`*${cleanChunk}*`)) {
      result = result.replace(`*${cleanChunk}*`, `***${cleanChunk}***`);
      return cleanFormattedText(result);
    }
    // 4. Otherwise: toggle bold ON -> **word**
    result = result.replace(cleanChunk, `**${cleanChunk}**`);
    return cleanFormattedText(result);
  }

  if (formatType === 'italic') {
    // 1. If inside ***word***: toggle italic OFF -> **word**
    if (result.includes(`***${cleanChunk}***`)) {
      result = result.replace(`***${cleanChunk}***`, `**${cleanChunk}**`);
      return cleanFormattedText(result);
    }
    // 2. If inside **word**: toggle italic ON -> ***word***
    if (result.includes(`**${cleanChunk}**`)) {
      result = result.replace(`**${cleanChunk}**`, `***${cleanChunk}***`);
      return cleanFormattedText(result);
    }
    // 3. If strictly inside single *word* (not **word**): toggle italic OFF -> word
    const singleItalicRegex = new RegExp(`(?<!\\*)\\*${escapeRegex(cleanChunk)}\\*(?!\\*)`, 'g');
    if (singleItalicRegex.test(result)) {
      result = result.replace(singleItalicRegex, cleanChunk);
      return cleanFormattedText(result);
    }
    // 4. Otherwise: toggle italic ON -> *word*
    result = result.replace(cleanChunk, `*${cleanChunk}*`);
    return cleanFormattedText(result);
  }

  if (formatType === 'strikethrough') {
    if (result.includes(`~~${cleanChunk}~~`)) {
      result = result.replace(`~~${cleanChunk}~~`, cleanChunk);
    } else {
      result = result.replace(cleanChunk, `~~${cleanChunk}~~`);
    }
    return cleanFormattedText(result);
  }

  if (formatType === 'code') {
    if (result.includes(`\`${cleanChunk}\``)) {
      result = result.replace(`\`${cleanChunk}\``, cleanChunk);
    } else {
      result = result.replace(cleanChunk, `\`${cleanChunk}\``);
    }
    return cleanFormattedText(result);
  }

  return cleanFormattedText(result);
};

// Helper for regex escaping
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert markdown string to clean HTML for display in contenteditable block
 */
export const markdownToRichHtml = (md, { allPages = [] } = {}) => {
  if (!md || typeof md !== 'string') return '';
  let str = cleanFormattedText(md);

  // Strip leading heading hashes if present
  str = str.replace(/^#{1,6}\s+/, '');

  // Links: [label](url)
  str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="notion-inline-link">$1</a>');

  // Mentions / Wiki links: [[Title]] or [[page:id|title]]
  str = str.replace(/\[\[(?:page:([^|]+)\|)?([^\]]+)\]\]/g, (match, pageId, title) => {
    return `<span class="notion-inline-mention" data-mention-id="${pageId || ''}"><span class="mention-emoji">📄</span><span class="mention-text">${title}</span></span>`;
  });

  // Bold-Italic: ***text***
  str = str.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  str = str.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');

  // Bold: **text**
  str = str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  str = str.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Strikethrough: ~~text~~
  str = str.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Highlight: ==text==
  str = str.replace(/==(.+?)==/g, '<mark class="notion-inline-highlight">$1</mark>');

  // Inline code: `code`
  str = str.replace(/`([^`]+)`/g, '<code class="notion-inline-code">$1</code>');

  // Italic: *text* (avoiding matching tags)
  str = str.replace(/(?<!\*)\*([^*<>\n]+)\*(?!\*)/g, '<em>$1</em>');
  str = str.replace(/(?<!_)_([^_<>\n]+)_(?!_)/g, '<em>$1</em>');

  // Clean any remaining double spans
  str = flattenDoubleSpans(str);

  return str;
};

/**
 * Convert contenteditable HTML back to clean Markdown
 */
export const richHtmlToMarkdown = (html) => {
  if (!html || typeof html !== 'string') return '';
  let str = flattenDoubleSpans(html);

  // Mentions
  str = str.replace(/<span[^>]*class=["'][^"']*notion-inline-mention[^"']*["'][^>]*>(?:<span[^>]*>[^<]*<\/span>)*<span[^>]*class=["']mention-text["']>([^<]+)<\/span><\/span>/gi, '[[$1]]');

  // Links: <a href="url"...>label</a>
  str = str.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // <strong><em>...</em></strong> -> ***...***
  str = str.replace(/<(?:strong|b)><(?:em|i)>([\s\S]*?)<\/(?:em|i)><\/(?:strong|b)>/gi, '***$1***');
  str = str.replace(/<(?:em|i)><(?:strong|b)>([\s\S]*?)<\/(?:strong|b)><\/(?:em|i)>/gi, '***$1***');

  // <strong>...</strong> or <b>...</b> -> **...**
  str = str.replace(/<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');

  // <em>...</em> or <i>...</i> -> *...*
  str = str.replace(/<(?:em|i)>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');

  // <del>...</del> or <strike>... -> ~~...~~
  str = str.replace(/<(?:del|strike|s)>([\s\S]*?)<\/(?:del|strike|s)>/gi, '~~$1~~');

  // <code>...</code> -> `...`
  str = str.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

  // <mark>... -> ==...==
  str = str.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '==$1==');

  // Clean double spans
  str = flattenDoubleSpans(str);

  // Clean remaining div/p tags from Enter keypresses if any:
  str = str.replace(/<div><br><\/div>/gi, '\n');
  str = str.replace(/<div>([\s\S]*?)<\/div>/gi, '\n$1');
  str = str.replace(/<p>([\s\S]*?)<\/p>/gi, '\n$1');
  str = str.replace(/<br\s*\/?>/gi, '\n');

  // Clean &nbsp;
  str = str.replace(/&nbsp;/g, ' ');

  // Clean double asterisks if any
  str = cleanFormattedText(str);

  return str;
};

/**
 * Set caret position in a contentEditable element or textarea/input
 */
export const setCaretPosition = (el, offset = 0) => {
  if (!el) return;
  try {
    el.focus();
    if (typeof el.setSelectionRange === 'function') {
      el.setSelectionRange(offset, offset);
      return;
    }

    const sel = window.getSelection();
    if (!sel) return;

    const range = document.createRange();
    let currentOffset = 0;
    let found = false;

    const traverse = (node) => {
      if (found) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const textLen = node.textContent.length;
        if (currentOffset + textLen >= offset) {
          const targetNodeOffset = Math.min(Math.max(0, offset - currentOffset), textLen);
          range.setStart(node, targetNodeOffset);
          range.collapse(true);
          found = true;
          return;
        }
        currentOffset += textLen;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          traverse(node.childNodes[i]);
          if (found) return;
        }
      }
    };

    traverse(el);

    if (!found) {
      range.selectNodeContents(el);
      range.collapse(offset === 0);
    }

    sel.removeAllRanges();
    sel.addRange(range);
  } catch (err) {
    el.focus();
  }
};

/**
 * Get current caret offset from contentEditable or textarea
 */
export const getCaretOffset = (el) => {
  if (!el) return 0;
  if (typeof el.selectionStart === 'number') {
    return el.selectionStart;
  }
  try {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const preRange = range.cloneRange();
      preRange.selectNodeContents(el);
      preRange.setEnd(range.endContainer, range.endOffset);
      return preRange.toString().length;
    }
  } catch (e) {
    // ignore
  }
  return 0;
};

/**
 * Get start and end character selection offsets within an element
 */
export const getSelectionOffsets = (el) => {
  if (!el) return { start: 0, end: 0 };
  if (typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number') {
    return { start: el.selectionStart, end: el.selectionEnd };
  }
  try {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (el.contains(range.startContainer) || el === range.startContainer) {
        const preStartRange = range.cloneRange();
        preStartRange.selectNodeContents(el);
        preStartRange.setEnd(range.startContainer, range.startOffset);
        const start = preStartRange.toString().length;

        const preEndRange = range.cloneRange();
        preEndRange.selectNodeContents(el);
        preEndRange.setEnd(range.endContainer, range.endOffset);
        const end = preEndRange.toString().length;

        return { start, end };
      }
    }
  } catch (e) {
    // ignore
  }
  return { start: 0, end: 0 };
};

/**
 * Restore selection range [start, end] within an element (supports multi-node contentEditable)
 */
export const setSelectionOffsets = (el, start = 0, end = 0) => {
  if (!el) return;
  try {
    el.focus();
    if (typeof el.setSelectionRange === 'function') {
      el.setSelectionRange(start, end);
      return;
    }

    const sel = window.getSelection();
    if (!sel) return;

    const range = document.createRange();
    let currentOffset = 0;
    let startNode = null;
    let startNodeOffset = 0;
    let endNode = null;
    let endNodeOffset = 0;

    const traverse = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLen = node.textContent.length;
        if (!startNode && currentOffset + textLen >= start) {
          startNode = node;
          startNodeOffset = Math.min(Math.max(0, start - currentOffset), textLen);
        }
        if (!endNode && currentOffset + textLen >= end) {
          endNode = node;
          endNodeOffset = Math.min(Math.max(0, end - currentOffset), textLen);
        }
        currentOffset += textLen;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          traverse(node.childNodes[i]);
          if (startNode && endNode) return;
        }
      }
    };

    traverse(el);

    if (startNode && endNode) {
      range.setStart(startNode, startNodeOffset);
      range.setEnd(endNode, endNodeOffset);
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (startNode) {
      range.setStart(startNode, startNodeOffset);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      setCaretPosition(el, end);
    }
  } catch (err) {
    el.focus();
  }
};

