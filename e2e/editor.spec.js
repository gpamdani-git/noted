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

test.describe('E2E QA Automation: Noted Core Editor (Notion Desktop Parity)', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('Page loads properly with sidebar, header, and editor area', async ({ page }) => {
    await expect(page.locator('.noted-sidebar').first()).toBeVisible();
    await expect(page.locator('.noted-editor-container').first()).toBeVisible();
    await expect(page.locator('.editor-content-area').first()).toBeVisible();
    await expect(page.locator('.page-title-input').first()).toBeVisible();
  });

  test('Markdown [] shortcut morphs into to-do checklist with caret preserved', async ({ page }) => {
    const block = page.locator('.block-type-paragraph .block-rich-text').first();
    await block.click();
    await block.fill('');

    const todos = page.locator('.block-todo-wrapper');
    const before = await todos.count();

    // Type [] and space
    await block.pressSequentially('[] ');

    // The native checkbox input is hidden by the custom control, so the
    // visible element is the styled label.
    const todoCheckbox = page.locator('.block-checkbox-custom').first();
    await expect(todoCheckbox).toBeVisible();
    await expect(todos).toHaveCount(before + 1);

    // The morphed block keeps the caret, so the text lands in the new to-do
    const todoInput = page.locator('.block-rich-text:focus').first();
    await expect(todoInput).toHaveClass(/block-todo-input/);

    await page.keyboard.type('Automated QA Task');
    await expect(todoInput).toContainText('Automated QA Task');

    // Press Enter to create a new to-do block
    await page.keyboard.press('Enter');
    await expect(todos).toHaveCount(before + 2);

    // Press Backspace on the empty to-do to un-morph back to a paragraph
    await page.keyboard.press('Backspace');
    await expect(todos).toHaveCount(before + 1);
  });

  test('Floating Bubble Menu appears on text selection and applies formatting live', async ({ page }) => {
    const block = page.locator('.block-rich-text').first();
    await block.click();
    await block.fill('');
    await page.keyboard.type('Important Report Title');

    // Double-click the word "Report" to select it
    await page.keyboard.press('Home');
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
    }
    // Select "Report" via Shift+ArrowRight
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Shift+ArrowRight');
    }

    // Floating bubble menu should be visible
    const bubbleMenu = page.locator('.bubble-menu-toolbar');
    await expect(bubbleMenu).toBeVisible();

    // Click Bold button
    const boldBtn = bubbleMenu.locator('button[title*="Bold"]');
    await boldBtn.click();

    // Verify text is bolded live without refreshing
    const strongEl = block.locator('strong');
    await expect(strongEl).toContainText('Report');
  });

  test('Comments & Discussions popover can be toggled', async ({ page }) => {
    // The block context menu opens on a right click of the grip handle
    const grip = page.locator('.block-handle-btn.grip-btn').first();
    await grip.click({ button: 'right' });

    const commentItem = page.locator('.menu-action-item:has-text("Comment")').first();
    await expect(commentItem).toBeVisible();
    await commentItem.click();

    await expect(page.locator('.block-comment-popover').first()).toBeVisible();
  });
});
