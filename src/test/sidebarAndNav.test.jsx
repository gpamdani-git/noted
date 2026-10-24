import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { TabBar } from '../components/Navigation/TabBar';
import { TopNav } from '../components/TopNav/TopNav';

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

    it('renders resizer handle and enforces min width of 260px on drag', () => {
      localStorage.clear();
      render(
        <Sidebar
          pages={samplePages}
          activePageId="p1"
          onSelectPage={vi.fn()}
          onCreatePage={vi.fn()}
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

      const resizer = screen.getByRole('separator');
      expect(resizer).toBeInTheDocument();
      expect(resizer).toHaveClass('sidebar-resizer');

      // Default width is 260px
      expect(document.documentElement.style.getPropertyValue('--sidebar-width')).toBe('260px');

      // Start drag
      fireEvent.mouseDown(resizer, { clientX: 260 });

      // Attempt to drag smaller than min width (e.g. 150px)
      fireEvent.mouseMove(window, { clientX: 150 });
      expect(document.documentElement.style.getPropertyValue('--sidebar-width')).toBe('260px');

      // Drag wider (e.g. 340px)
      fireEvent.mouseMove(window, { clientX: 340 });
      expect(document.documentElement.style.getPropertyValue('--sidebar-width')).toBe('340px');

      // Finish drag
      fireEvent.mouseUp(window, { clientX: 340 });
      expect(localStorage.getItem('noted_sidebar_width')).toBe('340');

      // Double-click resets back to 260px
      fireEvent.doubleClick(resizer);
      expect(document.documentElement.style.getPropertyValue('--sidebar-width')).toBe('260px');
      expect(localStorage.getItem('noted_sidebar_width')).toBe('260');
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

    it('aligns section headers and items with collapsible carets', () => {
      render(
        <Sidebar
          pages={samplePages}
          activePageId="p1"
          onSelectPage={vi.fn()}
          onCreatePage={vi.fn()}
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

      // Section titles exist
      const favTitle = screen.getByText('Favorites');
      const privTitle = screen.getByText('Private');
      expect(favTitle).toBeInTheDocument();
      expect(privTitle).toBeInTheDocument();

      // Check section caret buttons
      const favCaret = screen.getByTitle(/Collapse Favorites/i);
      const privCaret = screen.getByTitle(/Collapse Private/i);
      expect(favCaret).toBeInTheDocument();
      expect(privCaret).toBeInTheDocument();

      // Verify Favorite item has matching 8px paddingLeft
      const favItem = document.querySelector('.sidebar-page-item.favorite-item');
      expect(favItem).toHaveStyle({ paddingLeft: '8px' });

      // Toggle Favorites section collapse
      fireEvent.click(favCaret);
      expect(screen.getByTitle(/Expand Favorites/i)).toBeInTheDocument();
    });
  });

  describe('TopNav Component & Breadcrumb Parity', () => {
    const hierarchicalPages = [
      { id: 'parent-1', title: 'Engineering Workspace', icon: '💻', parentId: null },
      { id: 'sub-1', title: 'Architecture Docs', icon: '📐', parentId: 'parent-1' },
      { id: 'sub-2', title: 'Database Schema v2', icon: '🗄️', parentId: 'sub-1' }
    ];

    it('renders full ancestor breadcrumb chain with clickable parent links', () => {
      const handleSelectPage = vi.fn();
      const activePage = hierarchicalPages[2]; // 'Database Schema v2'

      render(
        <TopNav
          page={activePage}
          pages={hierarchicalPages}
          onSelectPage={handleSelectPage}
          currentUser={{ id: 'u1', name: 'Tester' }}
        />
      );

      // Verify ancestor breadcrumbs are rendered
      expect(screen.getByText('Engineering Workspace')).toBeInTheDocument();
      expect(screen.getByText('Architecture Docs')).toBeInTheDocument();
      expect(screen.getByText('Database Schema v2')).toBeInTheDocument();

      // Click on immediate parent 'Architecture Docs'
      fireEvent.click(screen.getByText('Architecture Docs'));
      expect(handleSelectPage).toHaveBeenCalledWith('sub-1');

      // Click on root ancestor 'Engineering Workspace'
      fireEvent.click(screen.getByText('Engineering Workspace'));
      expect(handleSelectPage).toHaveBeenCalledWith('parent-1');
    });
  });
});

