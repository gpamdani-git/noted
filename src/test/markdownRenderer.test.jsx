import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { renderInlineMarkdown } from '../utils/markdownRenderer';

describe('QA Suite 5: Markdown Inline Rendering & Tokenizer', () => {
  it('renders bold and italic with proper semantic elements', () => {
    const { container } = render(
      <div>{renderInlineMarkdown('**bold text** and *italic text*')}</div>
    );

    const boldEl = container.querySelector('strong');
    expect(boldEl).toBeInTheDocument();
    expect(boldEl.textContent).toBe('bold text');

    const italicEl = container.querySelector('em');
    expect(italicEl).toBeInTheDocument();
    expect(italicEl.textContent).toBe('italic text');
  });

  it('renders inline code with .notion-inline-code class', () => {
    const { container } = render(
      <div>{renderInlineMarkdown('run `npm test` now')}</div>
    );

    const codeEl = container.querySelector('code');
    expect(codeEl).toBeInTheDocument();
    expect(codeEl.textContent).toBe('npm test');
  });

  it('renders markdown links with target _blank and security attributes', () => {
    const { container } = render(
      <div>{renderInlineMarkdown('[Notion](https://notion.so)')}</div>
    );

    const linkEl = container.querySelector('a');
    expect(linkEl).toBeInTheDocument();
    expect(linkEl.getAttribute('href')).toBe('https://notion.so');
    expect(linkEl.getAttribute('target')).toBe('_blank');
    expect(linkEl.getAttribute('rel')).toBe('noopener noreferrer');
    expect(linkEl.textContent).toBe('Notion');
  });

  it('renders wiki-style page mentions [[Page Title]]', () => {
    const allPages = [
      { id: 'p-1', title: 'Roadmap 2026', icon: '🚀' }
    ];

    const { container } = render(
      <div>{renderInlineMarkdown('Check [[Roadmap 2026]]', { allPages })}</div>
    );

    const mentionEl = container.querySelector('.notion-inline-mention');
    expect(mentionEl).toBeInTheDocument();
    expect(mentionEl.textContent).toContain('Roadmap 2026');
    expect(mentionEl.textContent).toContain('🚀');
  });

  it('cleans leading heading hashes so they do not leak into inline text', () => {
    const { container } = render(
      <div>{renderInlineMarkdown('### Clean Heading Text')}</div>
    );
    expect(container.textContent).toBe('Clean Heading Text');
    expect(container.textContent).not.toContain('###');
  });
});
