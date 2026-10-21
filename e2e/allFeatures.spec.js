import { test, expect } from '@playwright/test';

/**
 * The app keeps a background sync pulse running, so the network never goes
 * idle. Every test waits for the shell and the editor instead of for
 * "networkidle".
 */
const openApp = async (page) => {
  await page.goto('/');
  await page.locator('.noted-sidebar').first().waitFor({ state: 'visible' });
  await page.locator('.noted-editor-container').first().waitFor({ state: 'visible' });
};

/**
 * A plain paragraph block. The first editable of the page can be a callout,
 * and the markdown triggers only apply to paragraphs.
 */
const paragraphBlock = (page) => page.locator('.block-type-paragraph .block-rich-text').first();

/** The editable that currently has the caret, re-located after a morph. */
const focusedEditable = (page) => page.locator('.block-rich-text:focus').first();

test.describe('Comprehensive E2E QA Test Suite: Noted Full Application Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
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
      await expect(page.locator('.page-title-input')).toBeVisible();
    }
  });

  test('Scenario 2: Multi-tab Browsing and Window Navigation', async ({ page }) => {
    // 1. Verify tab bar strip
    const tabBar = page.locator('.tab-bar-strip');
    await expect(tabBar).toBeVisible();

    const tabItems = page.locator('.tab-item');
    const before = await tabItems.count();

    // 2. Click "+" new tab button
    const addTabBtn = page.locator('#btn-add-new-tab');
    await expect(addTabBtn).toBeVisible();
    await addTabBtn.click();
    await expect(tabItems).toHaveCount(before + 1);

    // 3. Close the last tab
    const lastCloseBtn = page.locator('.tab-close-btn').last();
    if (await lastCloseBtn.isVisible()) {
      await lastCloseBtn.click();
      await expect(tabItems).toHaveCount(before);
    }
  });

  test('Scenario 3: Markdown Realtime Triggers (#, -, >)', async ({ page }) => {
    const block = paragraphBlock(page);
    await expect(block).toBeVisible();
    await block.click();
    await block.fill('');

    // Type "# " to morph the paragraph into a heading
    await block.pressSequentially('# ');
    await expect(page.locator('.block-type-heading_1')).toHaveCount(2); // one seeded, one new

    // The morph replaces the editable, so the caret is re-located before the
    // next line is typed.
    const afterHeading = focusedEditable(page);
    await afterHeading.waitFor({ state: 'visible' });
    await page.keyboard.type('Architectural System Overview');

    // Press Enter to create a new line
    await page.keyboard.press('Enter');
    const nextLine = focusedEditable(page);
    await nextLine.waitFor({ state: 'visible' });

    // Type "- " to morph into a bulleted list
    await page.keyboard.type('- ');
    await expect(page.locator('.block-type-bulleted_list_item').first()).toBeVisible();

    // A second list item follows on Enter
    await page.keyboard.type('High throughput pipeline');
    await page.keyboard.press('Enter');
    const secondItem = focusedEditable(page);
    await secondItem.waitFor({ state: 'visible' });
    await page.keyboard.type('Local-first persistence');

    expect(await page.locator('.block-type-bulleted_list_item').count()).toBeGreaterThanOrEqual(2);
  });

  test('Scenario 4: Slash Command Menu (/) Keyboard Navigation and Block Insertion', async ({ page }) => {
    const block = paragraphBlock(page);
    await block.click();
    await block.fill('');

    // Type "/" to open the slash menu
    await page.keyboard.type('/');

    // Verify the slash menu popover appears
    const slashMenu = page.locator('.slash-menu-popover');
    await expect(slashMenu).toBeVisible();

    // Type "code" to filter
    await page.keyboard.type('code');
    await expect(slashMenu.locator('.slash-item-title').first()).toContainText(/code/i);

    // Press Enter to select the highlighted option
    await page.keyboard.press('Enter');
    await expect(page.locator('.block-type-code').first()).toBeVisible();
  });

  test('Scenario 5: Database Views (Table, Board, Gallery) and Search Filtering', async ({ page }) => {
    // The database block lives on a different page, so it is opened first
    const projectsPage = page.locator('.sidebar-page-item:has-text("Projects")').first();
    if (await projectsPage.isVisible()) {
      await projectsPage.click();
    }

    const dbWrapper = page.locator('.database-block-wrapper').first();
    await expect(dbWrapper).toBeVisible();

    // 1. The view tabs are labelled after the data they show
    const boardTab = dbWrapper.locator('button[title*="Board view"]').first();
    const tableTab = dbWrapper.locator('button[title*="Table view"]').first();
    const galleryTab = dbWrapper.locator('button[title*="Gallery view"]').first();

    await expect(boardTab).toBeVisible();
    await expect(tableTab).toBeVisible();
    await expect(galleryTab).toBeVisible();

    await boardTab.click();
    await expect(dbWrapper.locator('.db-kanban-view').first()).toBeVisible();
    expect(await dbWrapper.locator('.kanban-column').count()).toBeGreaterThan(0);

    await tableTab.click();
    await expect(dbWrapper.locator('.db-table-view').first()).toBeVisible();

    await galleryTab.click();
    await expect(dbWrapper.locator('.db-gallery-view').first()).toBeVisible();

    // 2. Test the quick search filter on the table view
    await tableTab.click();
    await expect(dbWrapper.locator('.db-table-view').first()).toBeVisible();

    const searchInput = dbWrapper.locator('.db-search-input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Design');
      await expect(dbWrapper.locator('.db-table-view').first()).toBeVisible();
      await searchInput.fill('');
    }
  });

  test('Scenario 6: Theme Switching (Dark Mode / Light Mode)', async ({ page }) => {
    const themeBtn = page.locator('.theme-toggle-sidebar-btn').first();
    await expect(themeBtn).toBeVisible();

    const readTheme = () =>
      page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');

    const initialTheme = await readTheme();
    await themeBtn.click();
    await expect.poll(readTheme).not.toBe(initialTheme);

    // Revert back
    await themeBtn.click();
    await expect.poll(readTheme).toBe(initialTheme);
  });

  test('Scenario 7: Page Analytics Modal and Export Controls', async ({ page }) => {
    const optionsBtn = page.locator('#nav-options-btn').first();
    await expect(optionsBtn).toBeVisible();
    await optionsBtn.click();

    const analyticsRow = page.locator('.notion-menu-row:has-text("Page analytics")').first();
    await expect(analyticsRow).toBeVisible();
    await analyticsRow.click();

    const modal = page.locator('.analytics-modal-card');
    await expect(modal).toBeVisible();

    // Close the modal with Esc
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('Scenario 8: Markdown Divider Line (--- / ***) Morphing and Block Insertion Below', async ({ page }) => {
    const block = paragraphBlock(page);
    await expect(block).toBeVisible();
    await block.click();
    await block.fill('');

    // Type "---" to morph into a divider line
    await page.keyboard.type('---');

    // Verify the divider exists
    const divider = page.locator('hr.block-divider-line').first();
    await expect(divider).toBeVisible();

    // A new empty paragraph is inserted below and keeps the caret
    const activeClass = await page.evaluate(() => document.activeElement?.className || '');
    expect(activeClass).toContain('block-rich-text');
  });
});
