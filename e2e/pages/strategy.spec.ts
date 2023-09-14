import { test } from '@playwright/test';
import { screenshot } from '../utils/operators';

test.describe('Strategies', () => {
  test('First Strategy Page', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('first-strategy').waitFor({ state: 'visible' });
    await screenshot(page, 'first-strategy');
  });
});
