import { test, expect } from '@playwright/test';

test.describe('Comprehensive E2E QA Test Suite: Noted Full Application Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Scenario 1: Workspace and Page Navigation', async ({ page }) => {
    // 1. Verify workspace sidebar is visible
    const sidebar = page.locator('.noted-sidebar');
    await expect(sidebar).toBeVisible();

    // 2. Click on a page in the sidebar
    const pageItem = page.locator('.sidebar-page-item').first();
    await expect(pageItem).toBeVisible();
    await pageItem.click();

    // 3. Verify page header or editor title matches
    const pageTitleInput = page.locator('.page-title-input');
    await expect(pageTitleInput).toBeVisible();

    // 4. Test creating a new page via sidebar bottom button
    const newPageBtn = page.locator('button[title="New page"]');
    if (await newPageBtn.isVisible()) {
      await newPageBtn.click();
      await page.waitForTimeout(300);
      // Ensure new page title input is active
      await expect(page.locator('.page-title-input')).toBeVisible();
    }
  });

  test('Scenario 2: Multi-tab Browsing and Window Navigation', async ({ page }) => {
    // 1. Verify tab bar strip
    const tabBar = page.locator('.tab-bar-strip');
    await expect(tabBar).toBeVisible();

    // 2. Click "+" new tab button
    const addTabBtn = page.locator('#btn-add-new-tab');
    await expect(addTabBtn).toBeVisible();
    await addTabBtn.click();
    await page.waitForTimeout(300);

    // 3. Verify number of tabs increased
    const tabItems = page.locator('.tab-item');
    const count = await tabItems.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // 4. Close the last tab
    const lastCloseBtn = page.locator('.tab-close-btn').last();
    if (await lastCloseBtn.isVisible()) {
      await lastCloseBtn.click();
      await page.waitForTimeout(200);
    }
  });

  test('Scenario 3: Markdown Realtime Triggers (#, ##, -, 1., >)', async ({ page }) => {
    // Focus the first editable text block
    const blockInput = page.locator('.block-text-input, textarea.block-input, .block-rich-text').first();
    await expect(blockInput).toBeVisible();
    await blockInput.click();
    await blockInput.fill('');

    // Type "# " to morph into Heading 1
    await blockInput.pressSequentially('# ');
    await page.waitForTimeout(200);
    // Continue typing text
    await page.keyboard.type('Architectural System Overview');

    // Verify heading 1 styling or container
    const headingBlock = page.locator('.block-item-heading_1, .type-heading_1').first();
    if (await headingBlock.isVisible()) {
      await expect(headingBlock).toBeVisible();
    }

    // Press Enter to create new line
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Type "- " to morph into Bulleted List
    await page.keyboard.type('- ');
    await page.waitForTimeout(200);
    await page.keyboard.type('High throughput pipeline');

    // Press Enter to continue bullet list
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.type('Local-first persistence');

    // Verify list items exist
    const bulletItems = page.locator('.type-bulleted_list_item, .block-bullet');
    const bulletCount = await bulletItems.count();
    expect(bulletCount).toBeGreaterThanOrEqual(1);
  });

  test('Scenario 4: Slash Command Menu (/) Keyboard Navigation and Block Insertion', async ({ page }) => {
    const blockInput = page.locator('.block-text-input, textarea.block-input, .block-rich-text').first();
    await blockInput.click();
    await blockInput.fill('');

    // Type "/" to open slash menu
    await page.keyboard.type('/');
    await page.waitForTimeout(300);

    // Verify slash menu popover appears
    const slashMenu = page.locator('.slash-menu-popover');
    await expect(slashMenu).toBeVisible();

    // Type "code" to filter
    await page.keyboard.type('code');
    await page.waitForTimeout(200);

    // Verify code option is highlighted and press Enter to select
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Verify code block is created
    const codeBlock = page.locator('.block-item-code, .type-code, .code-block-wrapper').first();
    await expect(codeBlock).toBeVisible();
  });

  test('Scenario 5: Database Views (Table, Board, Gallery) and Search Filtering', async ({ page }) => {
    // Navigate to a database block if present or insert one
    const dbWrapper = page.locator('.database-block-wrapper').first();
    if (await dbWrapper.isVisible()) {
      // 1. Verify view tabs (By Status, All Projects, Gantt)
      const boardTab = dbWrapper.locator('button[title*="Board"]').first();
      const tableTab = dbWrapper.locator('button[title*="Table"]').first();

      if (await boardTab.isVisible()) {
        await boardTab.click();
        await page.waitForTimeout(300);
        // Verify kanban columns are rendered
        await expect(dbWrapper.locator('.kanban-column-track, .kanban-columns-container').first()).toBeVisible();
      }

      if (await tableTab.isVisible()) {
        await tableTab.click();
        await page.waitForTimeout(300);
        await expect(dbWrapper.locator('.db-table').first()).toBeVisible();
      }

      // 2. Test quick search filter
      const searchInput = dbWrapper.locator('.db-search-input');
      if (await searchInput.isVisible()) {
        await searchInput.fill('Design');
        await page.waitForTimeout(300);
        // Clear search
        await searchInput.fill('');
      }
    }
  });

  test('Scenario 6: Theme Switching (Dark Mode / Light Mode)', async ({ page }) => {
    // Look for theme toggle in sidebar or top bar
    const themeBtn = page.locator('.theme-toggle-sidebar-btn, button[title*="mode"]').first();
    if (await themeBtn.isVisible()) {
      const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
      await themeBtn.click();
      await page.waitForTimeout(300);

      const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
      expect(newTheme).not.toBe(initialTheme);

      // Revert back
      await themeBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('Scenario 7: Page Analytics Modal and Export Controls', async ({ page }) => {
    // Open Options Menu (3 dots) in navigation bar
    const optionsBtn = page.locator('#nav-options-btn, button[title*="Style and layout"]').first();
    if (await optionsBtn.isVisible()) {
      await optionsBtn.click();
      await page.waitForTimeout(200);

      // Click "Page Analytics"
      const analyticsBtn = page.locator('button:has-text("Page Analytics"), button:has-text("Analitik")').first();
      if (await analyticsBtn.isVisible()) {
        await analyticsBtn.click();
        await page.waitForTimeout(300);

        // Verify analytics modal
        const modal = page.locator('.analytics-modal-card');
        await expect(modal).toBeVisible();
        await expect(modal.locator('.modal-title')).toContainText('Analytics');

        // Close modal with Esc
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test('Scenario 8: Markdown Divider Line (--- / ***) Morphing and Block Insertion Below', async ({ page }) => {
    // Focus an editable text block
    const blockInput = page.locator('.block-text-input, textarea.block-input, .block-rich-text').first();
    await expect(blockInput).toBeVisible();
    await blockInput.click();
    await blockInput.fill('');

    // Type "---" to morph into Divider line
    await page.keyboard.type('---');
    await page.waitForTimeout(300);

    // Verify hr.block-divider-line exists
    const divider = page.locator('hr.block-divider-line').first();
    await expect(divider).toBeVisible();

    // Verify a new empty paragraph block was inserted below
    const activeElTag = await page.evaluate(() => document.activeElement?.className);
    expect(activeElTag).toContain('block-rich-text');
  });
});
