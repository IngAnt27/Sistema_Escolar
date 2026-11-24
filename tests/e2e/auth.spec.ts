import { test, expect } from '@playwright/test'

test.describe('Protección de Rutas y Login', () => {
  test('redirige a /login si un usuario sin sesión entra a /dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirige a /login si un usuario sin sesión intenta entrar a /dashboard/pagos', async ({ page }) => {
    await page.goto('/dashboard/pagos')
    await expect(page).toHaveURL(/\/login/)
  })

  test('muestra el formulario de inicio de sesión correctamente', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})