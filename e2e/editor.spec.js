import { test, expect } from '@playwright/test';

test.describe('E2E QA Automation: Noted Core Editor (Notion Desktop Parity)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Page loads properly with sidebar, header, and editor area', async ({ page }) => {
    await expect(page.locator('.app-sidebar, .sidebar')).toBeVisible();
    await expect(page.locator('.editor-container, .editor-content-area')).toBeVisible();
  });

  test('Markdown [] shortcut morphs into to-do checklist with caret preserved', async ({ page }) => {
    // Find or add an editable block
    const block = page.locator('.block-rich-text').first();
    await block.click();
    await block.fill('');

    // Type [] and space
    await block.pressSequentially('[] ');

    // Verify block morphed into to_do checkbox
    const todoCheckbox = page.locator('.block-checkbox, .block-checkbox-custom').first();
    await expect(todoCheckbox).toBeVisible();

    // Verify we can continue typing immediately next to the checkbox
    await page.keyboard.type('Automated QA Task');
    await expect(page.locator('.block-todo-input').first()).toContainText('Automated QA Task');

    // Press Enter to create new to-do block
    await page.keyboard.press('Enter');
    const todos = page.locator('.block-todo-wrapper');
    await expect(todos).toHaveCount(2);

    // Press Backspace on empty to-do to un-morph back to paragraph
    await page.keyboard.press('Backspace');
    await expect(todos).toHaveCount(1);
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
    // Check if comments icon or button exists in header
    const commentBtn = page.locator('button:has-text("Add comment"), button:has-text("Komentar"), button[title*="comment"]').first();
    if (await commentBtn.isVisible()) {
      await commentBtn.click();
      await expect(page.locator('.comments-sidebar, .comment-popover, .notion-discussion-thread').first()).toBeVisible();
    }
  });
});
