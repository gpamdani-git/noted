// Markdown converter for noted pages

export const pageToMarkdown = (page) => {
  if (!page) return '';
  const lines = [];

  // Title
  lines.push(`# ${page.icon ? page.icon + ' ' : ''}${page.title || 'Untitled'}`);
  lines.push('');

  page.blocks.forEach((block) => {
    switch (block.type) {
      case 'heading_1':
        lines.push(`# ${block.text}`);
        lines.push('');
        break;
      case 'heading_2':
        lines.push(`## ${block.text}`);
        lines.push('');
        break;
      case 'heading_3':
        lines.push(`### ${block.text}`);
        lines.push('');
        break;
      case 'to_do':
        lines.push(`- [${block.checked ? 'x' : ' '}] ${block.text || ''}`);
        break;
      case 'bulleted_list_item':
        lines.push(`- ${block.text || ''}`);
        break;
      case 'numbered_list_item':
        lines.push(`1. ${block.text || ''}`);
        break;
      case 'column_list':
      case 'column_list_2':
      case 'column_list_3':
        if (block.columns && block.columns.length) {
          block.columns.forEach((col, cIdx) => {
            lines.push(`### ${col.title || `Column ${cIdx + 1}`}`);
            lines.push('');
            (col.blocks || []).forEach((cb) => {
              if (cb.type === 'heading_1') lines.push(`# ${cb.text || ''}\n`);
              else if (cb.type === 'heading_2') lines.push(`## ${cb.text || ''}\n`);
              else if (cb.type === 'heading_3') lines.push(`### ${cb.text || ''}\n`);
              else if (cb.type === 'to_do') lines.push(`- [${cb.checked ? 'x' : ' '}] ${cb.text || ''}`);
              else if (cb.type === 'bulleted_list_item') lines.push(`- ${cb.text || ''}`);
              else if (cb.type === 'numbered_list_item') lines.push(`1. ${cb.text || ''}`);
              else if (cb.type === 'quote') lines.push(`> ${cb.text || ''}\n`);
              else lines.push(`${cb.text || ''}\n`);
            });
          });
        }
        break;
      case 'board':
      case 'gallery':
        if (block.headers && block.headers.length) {
          lines.push(`| ${block.headers.join(' | ')} |`);
          lines.push(`| ${block.headers.map(() => '---').join(' | ')} |`);
          if (block.rows) {
            block.rows.forEach(row => {
              lines.push(`| ${row.join(' | ')} |`);
            });
          }
          lines.push('');
        }
        break;
      case 'table_of_contents':
        lines.push('*Table of Contents*');
        lines.push('');
        break;
      case 'toggle':
        lines.push(`<details><summary>${block.text || ''}</summary>`);
        if (block.subtext) lines.push(block.subtext);
        lines.push(`</details>`);
        lines.push('');
        break;
      case 'quote':
        lines.push(`> ${block.text || ''}`);
        lines.push('');
        break;
      case 'callout':
        lines.push(`> [!NOTE] ${block.icon || '💡'}`);
        lines.push(`> ${block.text || ''}`);
        lines.push('');
        break;
      case 'code':
        lines.push(`\`\`\`${block.language || 'text'}`);
        lines.push(block.code || block.text || '');
        lines.push('```');
        lines.push('');
        break;
      case 'image':
        lines.push(`![${block.caption || ''}](${block.url || ''})`);
        lines.push('');
        break;
      case 'link_to_page':
        lines.push(`[[page:${block.targetPageId || ''}|${block.targetTitle || block.text || 'Page'}]]`);
        lines.push('');
        break;
      case 'bookmark':
        lines.push(`[${block.title || block.url || 'Bookmark'}](${block.url || ''})`);
        if (block.caption) lines.push(`*${block.caption}*`);
        lines.push('');
        break;
      case 'video':
        lines.push(`[Video: ${block.caption || block.url || 'Video'}](${block.url || ''})`);
        lines.push('');
        break;
      case 'math':
        lines.push('$$');
        lines.push(block.content || '');
        lines.push('$$');
        lines.push('');
        break;
      case 'breadcrumb':
        lines.push('*Navigation Breadcrumb*');
        lines.push('');
        break;
      case 'divider':
        lines.push('---');
        lines.push('');
        break;
      case 'table':
        if (block.headers && block.headers.length) {
          lines.push(`| ${block.headers.join(' | ')} |`);
          lines.push(`| ${block.headers.map(() => '---').join(' | ')} |`);
          if (block.rows) {
            block.rows.forEach(row => {
              lines.push(`| ${row.join(' | ')} |`);
            });
          }
          lines.push('');
        }
        break;
      case 'paragraph':
      default:
        lines.push(block.text || '');
        lines.push('');
        break;
    }
  });

  return lines.join('\n');
};

export const downloadMarkdownFile = (page) => {
  const md = pageToMarkdown(page);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (page.title || 'untitled').toLowerCase().replace(/[^a-z0-9]/g, '-');
  a.download = `${safeTitle}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
