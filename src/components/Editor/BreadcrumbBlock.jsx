import React, { useMemo } from 'react';
import { ChevronRight, FileText, Home, Layers } from 'lucide-react';
import './BreadcrumbBlock.css';

export const BreadcrumbBlock = ({ currentPage, allPages = [], onNavigatePage }) => {
  // Compute hierarchical ancestor path
  const breadcrumbTrail = useMemo(() => {
    if (!currentPage) return [];

    const trail = [];
    let curr = currentPage;
    const visited = new Set();

    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      trail.unshift(curr);
      if (curr.parentId) {
        curr = allPages.find((p) => p.id === curr.parentId);
      } else {
        curr = null;
      }
    }

    return trail;
  }, [currentPage, allPages]);

  return (
    <div className="notion-breadcrumb-container">
      <div className="breadcrumb-nav-list" aria-label="Breadcrumb hierarchy">
        {/* Workspace Root Item */}
        <div className="breadcrumb-item breadcrumb-root">
          <Layers size={13} className="breadcrumb-root-icon" />
          <span className="breadcrumb-text">Workspace</span>
        </div>

        {breadcrumbTrail.map((page, index) => {
          const isCurrent = index === breadcrumbTrail.length - 1;
          return (
            <React.Fragment key={page.id}>
              <ChevronRight size={12} className="breadcrumb-separator" />
              <button
                type="button"
                className={`breadcrumb-item ${isCurrent ? 'is-current' : 'is-link'}`}
                onClick={() => {
                  if (!isCurrent && onNavigatePage) {
                    onNavigatePage(page.id);
                  }
                }}
                disabled={isCurrent}
                title={isCurrent ? 'Current page' : `Jump to ${page.title || 'Untitled'}`}
              >
                {page.icon ? (
                  <span className="breadcrumb-page-emoji">{page.icon}</span>
                ) : (
                  <FileText size={13} className="breadcrumb-page-icon" />
                )}
                <span className="breadcrumb-title">
                  {page.title || 'Untitled'}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
