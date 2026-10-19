import React from 'react';
import { ListOrdered, ChevronRight, Hash } from 'lucide-react';
import './TableOfContentsBlock.css';

export const TableOfContentsBlock = ({ allBlocks = [] }) => {
  // Extract all headings from page blocks
  const headings = allBlocks
    .filter((b) => b && (b.type === 'heading_1' || b.type === 'heading_2' || b.type === 'heading_3'))
    .map((b) => {
      let level = 1;
      if (b.type === 'heading_2') level = 2;
      if (b.type === 'heading_3') level = 3;
      return {
        id: b.id,
        level,
        text: (b.text || '').replace(/^#{1,6}\s*/, '').trim() || `Heading ${level}`
      };
    });

  const handleScrollToHeading = (headingId) => {
    const targetEl = document.querySelector(`[data-block-id="${headingId}"]`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      targetEl.classList.add('heading-scroll-flash');
      setTimeout(() => {
        targetEl.classList.remove('heading-scroll-flash');
      }, 1500);
    }
  };

  return (
    <div className="notion-toc-container">
      <div className="notion-toc-header">
        <ListOrdered size={14} className="toc-header-icon" />
        <span className="toc-header-title">Table of Contents</span>
      </div>

      {headings.length > 0 ? (
        <nav className="notion-toc-list" aria-label="Table of Contents">
          {headings.map((h, i) => (
            <button
              key={`${h.id}-${i}`}
              className={`toc-item level-${h.level}`}
              onClick={() => handleScrollToHeading(h.id)}
              title={`Lompat ke: ${h.text}`}
            >
              <span className="toc-bullet" />
              <span className="toc-text">{h.text}</span>
            </button>
          ))}
        </nav>
      ) : (
        <div className="toc-empty-hint">
          <Hash size={13} />
          <span>Tambahkan Heading (H1, H2, H3) di halaman ini untuk menghasilkan Daftar Isi otomatis.</span>
        </div>
      )}
    </div>
  );
};
