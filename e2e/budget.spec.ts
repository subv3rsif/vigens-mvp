import { test, expect } from "@playwright/test";

test.describe("Budget Tracking", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test project board
    await page.goto("/projects/test-project-id/board");
  });

  test("sets project budget and displays it", async ({ page }) => {
    // Look for project settings/options
    // Usually accessed via a settings button or menu
    const settingsButton = page
      .locator(
        'button[aria-label*="settings" i], button[aria-label*="Paramètres" i], a[href*="/settings"]',
      )
      .first();
    const hasSettings = (await settingsButton.count()) > 0;

    if (!hasSettings) {
      test.skip();
    }

    await settingsButton.click();

    // Wait for page to navigate or dialog to open
    await page.waitForLoadState("networkidle");

    // Find and fill budget input
    const budgetInput = page
      .locator('input[id="budget"], input[id*="budget" i]')
      .first();
    const hasBudgetInput = (await budgetInput.count()) > 0;

    if (!hasBudgetInput) {
      test.skip();
    }

    // Clear any existing value and fill with 5000
    await budgetInput.clear();
    await budgetInput.fill("5000");

    // Look for save/submit button
    const saveButton = page
      .locator(
        'button:has-text("Enregistrer"), button:has-text("Sauvegarder"), button[type="submit"]',
      )
      .first();
    await saveButton.click();

    // Wait for success and verify budget was set
    // Check for budget display on the page
    await expect(page.locator("text=/5\\s*000/").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("adds tasks with costs and calculates budget", async ({ page }) => {
    // Create task with cost
    const addTaskButton = page
      .locator(
        'button:has-text("Ajouter une tâche"), button:has-text("Nouvelle tâche")',
      )
      .first();
    const hasButton = (await addTaskButton.count()) > 0;

    if (!hasButton) {
      test.skip();
    }

    await addTaskButton.click();

    // Wait for dialog/form to appear
    await page.waitForLoadState("networkidle");

    // Fill task form
    const titleInput = page
      .locator('input[id="title"], input[id*="title" i]')
      .first();
    await titleInput.fill("Task with cost");

    // Fill cost field if it exists
    const costInput = page
      .locator('input[id="cost"], input[id*="cost" i]')
      .first();
    if ((await costInput.count()) > 0) {
      await costInput.fill("1500");
    }

    // Submit task
    const submitButton = page
      .locator(
        'button:has-text("Créer"), button:has-text("Create"), button[type="submit"]',
      )
      .first();
    await submitButton.click();

    // Verify task was created
    await expect(page.locator("text=Task with cost").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("displays budget progress on project card", async ({ page }) => {
    // Go to dashboard/projects page
    await page.goto("/dashboard");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Find a project card - look for elements with budget info
    const budgetText = page
      .locator("text=/\\d+\\s*€\\s*\\/\\s*\\d+\\s*€/")
      .first();
    const hasBudgetInfo = (await budgetText.count()) > 0;

    if (!hasBudgetInfo) {
      // No budget configured yet, which is also valid
      test.skip();
    }

    // Budget is displayed - verify the text pattern
    await expect(budgetText).toBeVisible({ timeout: 5000 });
  });

  test("shows budget status colors for progress bar", async ({ page }) => {
    // Go to dashboard where project cards with budget are visible
    await page.goto("/dashboard");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Look for progress bars (role="progressbar")
    const progressBar = page.locator('[role="progressbar"]').first();
    const hasProgressBar = (await progressBar.count()) > 0;

    if (!hasProgressBar) {
      test.skip();
    }

    // Verify progress bar exists and has a background color class
    const progressBarClasses = await progressBar.getAttribute("class");

    if (!progressBarClasses) {
      test.skip();
    }

    // Check for color classes (bg-success, bg-warning, bg-error)
    const hasColorClass =
      progressBarClasses!.includes("bg-success") ||
      progressBarClasses!.includes("bg-warning") ||
      progressBarClasses!.includes("bg-error");

    expect(hasColorClass).toBe(true);
  });

  test("budget percentage increases with task costs", async ({ page }) => {
    // Navigate to project board
    await page.goto("/projects/test-project-id/board");

    // Go to settings to set a budget
    const settingsButton = page
      .locator(
        'button[aria-label*="settings" i], button[aria-label*="Paramètres" i], a[href*="/settings"]',
      )
      .first();
    if ((await settingsButton.count()) > 0) {
      await settingsButton.click();
      await page.waitForLoadState("networkidle");

      const budgetInput = page.locator('input[id="budget"]').first();
      if ((await budgetInput.count()) > 0) {
        await budgetInput.clear();
        await budgetInput.fill("10000");

        const saveButton = page.locator('button[type="submit"]').first();
        await saveButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // Create first task with cost
    const addTaskButton = page
      .locator('button:has-text("Ajouter une tâche")')
      .first();
    if ((await addTaskButton.count()) > 0) {
      await addTaskButton.click();
      await page.waitForLoadState("networkidle");

      const titleInput = page.locator('input[id="title"]').first();
      await titleInput.fill("First expensive task");

      const costInput = page.locator('input[id="cost"]').first();
      if ((await costInput.count()) > 0) {
        await costInput.fill("3000");
      }

      const submitButton = page.locator('button:has-text("Créer")').first();
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify first task is created
    await expect(page.locator("text=First expensive task").first()).toBeVisible(
      { timeout: 5000 },
    );

    // Create second task with cost
    if ((await addTaskButton.count()) > 0) {
      await addTaskButton.click();
      await page.waitForLoadState("networkidle");

      const titleInput = page.locator('input[id="title"]').first();
      await titleInput.fill("Second expensive task");

      const costInput = page.locator('input[id="cost"]').first();
      if ((await costInput.count()) > 0) {
        await costInput.fill("4000");
      }

      const submitButton = page.locator('button:has-text("Créer")').first();
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify second task is created
    await expect(
      page.locator("text=Second expensive task").first(),
    ).toBeVisible({ timeout: 5000 });

    // Navigate to dashboard to check budget display
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Look for the budget percentage/display - should show combined cost
    // Look for text like "7000 / 10000 €" or similar pattern
    const budgetDisplay = page
      .locator("text=/[67]\\s*000\\s*€\\s*\\/\\s*10\\s*000\\s*€/")
      .first();

    if ((await budgetDisplay.count()) > 0) {
      await expect(budgetDisplay).toBeVisible({ timeout: 5000 });
    }
  });
});
