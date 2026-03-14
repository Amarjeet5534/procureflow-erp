import { expect, test } from "@playwright/test";

test("shows the Google sign-in entry point", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "ProcureFlow" })).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in with google/i })).toBeVisible();
});