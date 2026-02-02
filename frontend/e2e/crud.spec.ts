import { test, expect } from '@playwright/test'

const TEST_EMAIL = `test-${Date.now()}@example.com`
const TEST_PASSWORD = 'testpassword123'

test.describe.serial('Core CRUD', () => {
  test('should sign up and see empty collection', async ({ page }) => {
    // Sign up
    await page.goto('/signup')
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input#password', TEST_PASSWORD)
    await page.fill('input#confirmPassword', TEST_PASSWORD)
    await page.click('button[type="submit"]')

    // Wait for redirect to collection
    await page.waitForURL('/collection', { timeout: 15000 })

    // Wait for collection page to load (either "My Collection" or an error message)
    await expect(
      page.getByText('My Collection').or(page.getByText('Failed to create'))
    ).toBeVisible({ timeout: 30000 })

    // Make sure it's the success case
    await expect(page.getByText('My Collection')).toBeVisible()
  })

  test('should add a record', async ({ page }) => {
    // Login with existing user
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/collection', { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Click add record - use the link in the empty state or header
    const addButton = page.locator('a:has-text("Add")').first()
    await addButton.click()
    await page.waitForURL(/\/collection\/new/, { timeout: 10000 })

    // Fill in the form
    await page.fill('input#title', 'Abbey Road')
    await page.fill('input#artist', 'The Beatles')
    await page.click('button[type="submit"]')

    // Should redirect back to collection
    await page.waitForURL('/collection', { timeout: 10000 })

    // Record should appear in grid
    await expect(page.getByText('Abbey Road')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('The Beatles')).toBeVisible()
  })

  test('should view record detail', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/collection', { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Click on the record
    await page.click('a:has-text("Abbey Road")')
    await page.waitForURL(/\/collection\/[a-f0-9-]+/, { timeout: 10000 })

    // Should show record details
    await expect(page.locator('h1:has-text("Abbey Road")')).toBeVisible()
    await expect(page.getByText('The Beatles')).toBeVisible()
    await expect(page.getByRole('button', { name: /play/i })).toBeVisible()
    await expect(page.getByText('Delete Record')).toBeVisible()
  })

  test('should delete a record', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/collection', { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Click on the record
    await page.click('a:has-text("Abbey Road")')
    await page.waitForURL(/\/collection\/[a-f0-9-]+/, { timeout: 10000 })

    // Click delete
    await page.click('text=Delete Record')

    // Confirm deletion
    await expect(page.getByText('Delete this record?')).toBeVisible()
    await page.click('text=Yes, Delete')

    // Should redirect back to collection
    await page.waitForURL('/collection', { timeout: 10000 })

    // Record should be gone - check that Abbey Road is not visible
    await expect(page.getByText('Abbey Road')).not.toBeVisible({ timeout: 5000 })
  })
})
