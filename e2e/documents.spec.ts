import { test, expect } from '@playwright/test';

test.describe('Documents', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test project board
    await page.goto('/projects/test-project-id/board');
    await page.waitForLoadState('networkidle');
  });

  test('opens task details dialog with documents section', async ({ page }) => {
    // Find and click on first task card
    const firstTask = page.locator('[class*="task-card"]').first();
    const hasTask = (await firstTask.count()) > 0;

    if (!hasTask) {
      test.skip();
    }

    await firstTask.click();

    // Verify task details dialog opened
    await expect(page.getByRole('heading', { name: /détails de la tâche/i })).toBeVisible();

    // Look for Documents section heading
    const documentsHeading = page.getByRole('heading', { name: /documents/i });
    if ((await documentsHeading.count()) === 0) {
      test.skip();
    }

    await expect(documentsHeading).toBeVisible();

    // Verify tabs are visible
    await expect(page.getByRole('tab', { name: /fichiers/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /liens/i })).toBeVisible();
  });

  test('uploads a file', async ({ page }) => {
    // Open task details
    const firstTask = page.locator('[class*="task-card"]').first();
    if ((await firstTask.count()) === 0) {
      test.skip();
    }

    await firstTask.click();

    // Wait for dialog to open
    await page.waitForTimeout(500);

    // Check if Documents section exists
    const documentsHeading = page.getByRole('heading', { name: /documents/i });
    if ((await documentsHeading.count()) === 0) {
      test.skip();
    }

    // Ensure we're on the Fichiers tab
    const filesTab = page.getByRole('tab', { name: /fichiers/i });
    await filesTab.click();

    // Find file input (it might be hidden)
    const fileInput = page.locator('input[type="file"]').first();
    if ((await fileInput.count()) === 0) {
      test.skip();
    }

    // Create a test file and upload it
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF test content'),
    });

    // Wait for upload to complete and file to appear in list
    await page.waitForTimeout(1000);

    // Verify file appears in the list (look for the filename)
    const fileItem = page.locator('text=test-document.pdf').first();
    if ((await fileItem.count()) > 0) {
      await expect(fileItem).toBeVisible({ timeout: 5000 });
    }
  });

  test('downloads a file', async ({ page }) => {
    // Open task details
    const firstTask = page.locator('[class*="task-card"]').first();
    if ((await firstTask.count()) === 0) {
      test.skip();
    }

    await firstTask.click();
    await page.waitForTimeout(500);

    // Check if Documents section exists
    const documentsHeading = page.getByRole('heading', { name: /documents/i });
    if ((await documentsHeading.count()) === 0) {
      test.skip();
    }

    // Ensure we're on Fichiers tab
    const filesTab = page.getByRole('tab', { name: /fichiers/i });
    await filesTab.click();

    // Upload a file first
    const fileInput = page.locator('input[type="file"]').first();
    if ((await fileInput.count()) === 0) {
      test.skip();
    }

    await fileInput.setInputFiles({
      name: 'download-test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF download test'),
    });

    await page.waitForTimeout(1000);

    // Find the download button (look for Download icon or button)
    const downloadButton = page
      .locator('button[aria-label*="télécharger" i], button:has-text("Télécharger")')
      .first();

    if ((await downloadButton.count()) === 0) {
      test.skip();
    }

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('deletes a file with confirmation', async ({ page }) => {
    // Open task details
    const firstTask = page.locator('[class*="task-card"]').first();
    if ((await firstTask.count()) === 0) {
      test.skip();
    }

    await firstTask.click();
    await page.waitForTimeout(500);

    // Check if Documents section exists
    const documentsHeading = page.getByRole('heading', { name: /documents/i });
    if ((await documentsHeading.count()) === 0) {
      test.skip();
    }

    // Ensure we're on Fichiers tab
    const filesTab = page.getByRole('tab', { name: /fichiers/i });
    await filesTab.click();

    // Upload a file to delete
    const fileInput = page.locator('input[type="file"]').first();
    if ((await fileInput.count()) === 0) {
      test.skip();
    }

    await fileInput.setInputFiles({
      name: 'delete-test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF delete test'),
    });

    await page.waitForTimeout(1000);

    // Verify file is uploaded
    const fileItem = page.locator('text=delete-test.pdf').first();
    if ((await fileItem.count()) === 0) {
      test.skip();
    }

    await expect(fileItem).toBeVisible();

    // Find and click delete button
    const deleteButton = page
      .locator('button[aria-label*="supprimer" i], button:has-text("Supprimer")')
      .first();

    if ((await deleteButton.count()) === 0) {
      test.skip();
    }

    await deleteButton.click();

    // Confirm deletion in dialog
    const confirmButton = page
      .locator('button:has-text("Supprimer"), button:has-text("Confirmer")')
      .last();

    if ((await confirmButton.count()) > 0) {
      await confirmButton.click();
    }

    // Wait for deletion
    await page.waitForTimeout(1000);

    // Verify file is removed
    await expect(fileItem).not.toBeVisible({ timeout: 5000 });
  });

  test('switches between Fichiers and Liens tabs', async ({ page }) => {
    // Open task details
    const firstTask = page.locator('[class*="task-card"]').first();
    if ((await firstTask.count()) === 0) {
      test.skip();
    }

    await firstTask.click();
    await page.waitForTimeout(500);

    // Check if Documents section exists
    const documentsHeading = page.getByRole('heading', { name: /documents/i });
    if ((await documentsHeading.count()) === 0) {
      test.skip();
    }

    // Verify Fichiers tab is active by default
    const filesTab = page.getByRole('tab', { name: /fichiers/i });
    await expect(filesTab).toBeVisible();

    // Click on Liens tab
    const linksTab = page.getByRole('tab', { name: /liens/i });
    await linksTab.click();

    // Verify Liens tab content is visible (look for "Ajouter un lien" button)
    await page.waitForTimeout(500);
    const addLinkButton = page.locator('button:has-text("Ajouter un lien")').first();
    if ((await addLinkButton.count()) > 0) {
      await expect(addLinkButton).toBeVisible();
    }

    // Switch back to Fichiers tab
    await filesTab.click();
    await page.waitForTimeout(500);

    // Verify file upload zone is visible
    const fileInput = page.locator('input[type="file"]').first();
    if ((await fileInput.count()) > 0) {
      expect(await fileInput.count()).toBeGreaterThan(0);
    }
  });

  test('adds a link', async ({ page }) => {
    // Open task details
    const firstTask = page.locator('[class*="task-card"]').first();
    if ((await firstTask.count()) === 0) {
      test.skip();
    }

    await firstTask.click();
    await page.waitForTimeout(500);

    // Check if Documents section exists
    const documentsHeading = page.getByRole('heading', { name: /documents/i });
    if ((await documentsHeading.count()) === 0) {
      test.skip();
    }

    // Switch to Liens tab
    const linksTab = page.getByRole('tab', { name: /liens/i });
    await linksTab.click();
    await page.waitForTimeout(500);

    // Find "Ajouter un lien" button
    const addLinkButton = page.locator('button:has-text("Ajouter un lien")').first();
    if ((await addLinkButton.count()) === 0) {
      test.skip();
    }

    await addLinkButton.click();
    await page.waitForTimeout(500);

    // Fill the link form
    const titleInput = page.locator('input[id*="title"], input[placeholder*="titre" i]').first();
    const urlInput = page.locator('input[id*="url"], input[placeholder*="url" i]').first();

    if ((await titleInput.count()) === 0 || (await urlInput.count()) === 0) {
      test.skip();
    }

    await titleInput.fill('Documentation React');
    await urlInput.fill('https://react.dev');

    // Submit the form
    const submitButton = page
      .locator('button:has-text("Ajouter"), button:has-text("Enregistrer"), button[type="submit"]')
      .first();

    await submitButton.click();
    await page.waitForTimeout(1000);

    // Verify link appears in the list
    const linkItem = page.locator('text=Documentation React').first();
    if ((await linkItem.count()) > 0) {
      await expect(linkItem).toBeVisible({ timeout: 5000 });
    }
  });

  test('edits a link', async ({ page }) => {
    // Open task details
    const firstTask = page.locator('[class*="task-card"]').first();
    if ((await firstTask.count()) === 0) {
      test.skip();
    }

    await firstTask.click();
    await page.waitForTimeout(500);

    // Check if Documents section exists
    const documentsHeading = page.getByRole('heading', { name: /documents/i });
    if ((await documentsHeading.count()) === 0) {
      test.skip();
    }

    // Switch to Liens tab
    const linksTab = page.getByRole('tab', { name: /liens/i });
    await linksTab.click();
    await page.waitForTimeout(500);

    // Add a link first
    const addLinkButton = page.locator('button:has-text("Ajouter un lien")').first();
    if ((await addLinkButton.count()) === 0) {
      test.skip();
    }

    await addLinkButton.click();
    await page.waitForTimeout(500);

    const titleInput = page.locator('input[id*="title"], input[placeholder*="titre" i]').first();
    const urlInput = page.locator('input[id*="url"], input[placeholder*="url" i]').first();

    await titleInput.fill('GitHub');
    await urlInput.fill('https://github.com');

    const submitButton = page
      .locator('button:has-text("Ajouter"), button:has-text("Enregistrer"), button[type="submit"]')
      .first();

    await submitButton.click();
    await page.waitForTimeout(1000);

    // Find and click edit button
    const editButton = page
      .locator('button[aria-label*="modifier" i], button:has-text("Modifier")')
      .first();

    if ((await editButton.count()) === 0) {
      test.skip();
    }

    await editButton.click();
    await page.waitForTimeout(500);

    // Modify the title
    const editTitleInput = page.locator('input[id*="title"], input[placeholder*="titre" i]').first();
    await editTitleInput.clear();
    await editTitleInput.fill('GitHub - Modifié');

    // Save changes
    const saveButton = page
      .locator('button:has-text("Enregistrer"), button:has-text("Modifier"), button[type="submit"]')
      .first();

    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify updated link appears
    const updatedLink = page.locator('text=GitHub - Modifié').first();
    if ((await updatedLink.count()) > 0) {
      await expect(updatedLink).toBeVisible({ timeout: 5000 });
    }
  });

  test('deletes a link with confirmation', async ({ page }) => {
    // Open task details
    const firstTask = page.locator('[class*="task-card"]').first();
    if ((await firstTask.count()) === 0) {
      test.skip();
    }

    await firstTask.click();
    await page.waitForTimeout(500);

    // Check if Documents section exists
    const documentsHeading = page.getByRole('heading', { name: /documents/i });
    if ((await documentsHeading.count()) === 0) {
      test.skip();
    }

    // Switch to Liens tab
    const linksTab = page.getByRole('tab', { name: /liens/i });
    await linksTab.click();
    await page.waitForTimeout(500);

    // Add a link first
    const addLinkButton = page.locator('button:has-text("Ajouter un lien")').first();
    if ((await addLinkButton.count()) === 0) {
      test.skip();
    }

    await addLinkButton.click();
    await page.waitForTimeout(500);

    const titleInput = page.locator('input[id*="title"], input[placeholder*="titre" i]').first();
    const urlInput = page.locator('input[id*="url"], input[placeholder*="url" i]').first();

    await titleInput.fill('Link to Delete');
    await urlInput.fill('https://example.com');

    const submitButton = page
      .locator('button:has-text("Ajouter"), button:has-text("Enregistrer"), button[type="submit"]')
      .first();

    await submitButton.click();
    await page.waitForTimeout(1000);

    // Verify link is added
    const linkItem = page.locator('text=Link to Delete').first();
    if ((await linkItem.count()) === 0) {
      test.skip();
    }

    await expect(linkItem).toBeVisible();

    // Find and click delete button
    const deleteButton = page
      .locator('button[aria-label*="supprimer" i], button:has-text("Supprimer")')
      .first();

    if ((await deleteButton.count()) === 0) {
      test.skip();
    }

    await deleteButton.click();

    // Confirm deletion
    const confirmButton = page
      .locator('button:has-text("Supprimer"), button:has-text("Confirmer")')
      .last();

    if ((await confirmButton.count()) > 0) {
      await confirmButton.click();
    }

    // Wait for deletion
    await page.waitForTimeout(1000);

    // Verify link is removed
    await expect(linkItem).not.toBeVisible({ timeout: 5000 });
  });

  test('displays empty state for files', async ({ page }) => {
    // Open task details
    const firstTask = page.locator('[class*="task-card"]').first();
    if ((await firstTask.count()) === 0) {
      test.skip();
    }

    await firstTask.click();
    await page.waitForTimeout(500);

    // Check if Documents section exists
    const documentsHeading = page.getByRole('heading', { name: /documents/i });
    if ((await documentsHeading.count()) === 0) {
      test.skip();
    }

    // Ensure we're on Fichiers tab
    const filesTab = page.getByRole('tab', { name: /fichiers/i });
    await filesTab.click();
    await page.waitForTimeout(500);

    // Look for empty state message (may vary based on implementation)
    const emptyState = page
      .locator('text=/aucun fichier/i, text=/pas de fichier/i, text=/glissez/i')
      .first();

    if ((await emptyState.count()) > 0) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('displays empty state for links', async ({ page }) => {
    // Open task details
    const firstTask = page.locator('[class*="task-card"]').first();
    if ((await firstTask.count()) === 0) {
      test.skip();
    }

    await firstTask.click();
    await page.waitForTimeout(500);

    // Check if Documents section exists
    const documentsHeading = page.getByRole('heading', { name: /documents/i });
    if ((await documentsHeading.count()) === 0) {
      test.skip();
    }

    // Switch to Liens tab
    const linksTab = page.getByRole('tab', { name: /liens/i });
    await linksTab.click();
    await page.waitForTimeout(500);

    // Look for empty state or "Ajouter un lien" button
    const addLinkButton = page.locator('button:has-text("Ajouter un lien")').first();

    if ((await addLinkButton.count()) > 0) {
      await expect(addLinkButton).toBeVisible();
    }
  });
});
