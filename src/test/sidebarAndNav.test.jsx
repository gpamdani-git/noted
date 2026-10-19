import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { TabBar } from '../components/Navigation/TabBar';

describe('Sidebar and Navigation Test Suite', () => {
  const samplePages = [
    { id: 'p1', title: 'Getting Started', icon: '👋', isFavorite: true, parentId: null },
    { id: 'p2', title: 'Roadmap & Sprints', icon: '🎯', isFavorite: false, parentId: null },
    { id: 'p3', title: 'Tech Architecture', icon: '🏛️', isFavorite: false, parentId: null }
  ];

  describe('Sidebar Component', () => {
    it('renders page items and triggers onSelectPage when clicked', () => {
      const handleSelectPage = vi.fn();
      const handleCreatePage = vi.fn();

      render(
        <Sidebar
          pages={samplePages}
          activePageId="p1"
          onSelectPage={handleSelectPage}
          onCreatePage={handleCreatePage}
          onDeletePage={vi.fn()}
          onDuplicatePage={vi.fn()}
          onToggleFavorite={vi.fn()}
          onOpenSearch={vi.fn()}
          onOpenSettings={vi.fn()}
          onOpenTrash={vi.fn()}
          trashCount={0}
          theme="light"
          onToggleTheme={vi.fn()}
          isCollapsed={false}
          onToggleCollapse={vi.fn()}
        />
      );

      // Getting Started appears in Favorites and workspace
      expect(screen.getAllByText('Getting Started').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Roadmap & Sprints')).toBeInTheDocument();
      expect(screen.getByText('Tech Architecture')).toBeInTheDocument();

      // Click on Roadmap & Sprints
      fireEvent.click(screen.getByText('Roadmap & Sprints'));
      expect(handleSelectPage).toHaveBeenCalledWith('p2');
    });

    it('triggers action modals: search, settings, trash, and create page', () => {
      const handleSearch = vi.fn();
      const handleSettings = vi.fn();
      const handleTrash = vi.fn();
      const handleCreatePage = vi.fn();
      const handleToggleTheme = vi.fn();

      render(
        <Sidebar
          pages={samplePages}
          activePageId="p1"
          onSelectPage={vi.fn()}
          onCreatePage={handleCreatePage}
          onDeletePage={vi.fn()}
          onDuplicatePage={vi.fn()}
          onToggleFavorite={vi.fn()}
          onOpenSearch={handleSearch}
          onOpenSettings={handleSettings}
          onOpenTrash={handleTrash}
          trashCount={2}
          theme="light"
          onToggleTheme={handleToggleTheme}
          isCollapsed={false}
          onToggleCollapse={vi.fn()}
        />
      );

      // Search button
      const searchBtn = screen.getByTitle(/Search/i);
      fireEvent.click(searchBtn);
      expect(handleSearch).toHaveBeenCalledTimes(1);

      // Settings button
      const settingsBtn = screen.getByTitle(/Settings & Workspace/i);
      fireEvent.click(settingsBtn);
      expect(handleSettings).toHaveBeenCalledTimes(1);

      // Trash button
      const trashBtn = screen.getByText(/Trash/i);
      fireEvent.click(trashBtn);
      expect(handleTrash).toHaveBeenCalledTimes(1);

      // Add page button
      const newPageBtn = screen.getByTitle('New page');
      fireEvent.click(newPageBtn);
      expect(handleCreatePage).toHaveBeenCalledTimes(1);

      // Theme toggle button
      const themeBtn = screen.getByTitle(/Switch to Dark mode/i);
      fireEvent.click(themeBtn);
      expect(handleToggleTheme).toHaveBeenCalledTimes(1);

      // Verify << collapse icon button is removed from sidebar header
      expect(document.querySelector('.sidebar-collapse-btn')).toBeNull();
    });
  });

  describe('TabBar Component', () => {
    const tabs = ['p1', 'p2'];

    it('renders tabs and allows switching and creating new tabs', () => {
      const handleSelectTab = vi.fn();
      const handleNewTab = vi.fn();
      const handleCloseTab = vi.fn();

      render(
        <TabBar
          tabs={tabs}
          pages={samplePages}
          activeTabId="p1"
          activePage={samplePages[0]}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
          onReorderTabs={vi.fn()}
          onCloseOtherTabs={vi.fn()}
          onCloseTabsToRight={vi.fn()}
          onDuplicateTab={vi.fn()}
          isSidebarCollapsed={false}
          onToggleSidebar={vi.fn()}
          theme="light"
          onToggleTheme={vi.fn()}
        />
      );

      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Roadmap & Sprints')).toBeInTheDocument();

      // Click second tab
      fireEvent.click(screen.getByText('Roadmap & Sprints'));
      expect(handleSelectTab).toHaveBeenCalledWith('p2');

      // Click "+" new tab button
      const newTabBtn = screen.getByTitle(/Buka tab baru/i);
      fireEvent.click(newTabBtn);
      expect(handleNewTab).toHaveBeenCalledTimes(1);
    });
  });
});
