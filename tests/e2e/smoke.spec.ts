import { expect, test } from '@playwright/test'

test('home loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/digital-twin/i)
  await expect(page.getByRole('heading', { name: /synchronize/i })).toBeVisible()
})
