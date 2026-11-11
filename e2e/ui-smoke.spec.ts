import { expect, test } from "@playwright/test";

const password = "correct-horse-battery";

test("home page renders the hero and calls to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Laporan Keuangan & Akuntansi Double-Entry");
  await expect(page.getByRole("link", { name: "Buka Dashboard" })).toBeVisible();
});

test("a signed-out visitor is redirected away from the dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("forms validate before calling the server", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter your name")).toBeVisible();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await page.getByLabel("Name").fill("Short Pass");
  await page.getByLabel("Email").fill("short@example.test");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Use at least 8 characters")).toBeVisible();
});

test("sign up, access dashboard, verify playground echo, sign out and sign in again", async ({ page }) => {
  const tag = crypto.randomUUID().slice(0, 8);
  const email = `ui-${tag}@example.test`;

  // sign up -> dashboard
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Akuntan Utama");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Akuntan Utama");
  await expect(page.getByText(`Masuk sebagai ${email}.`)).toBeVisible();

  // playground echo
  await page.getByRole("link", { name: "Playground" }).click();
  await expect(page).toHaveURL(/\/playground$/);
  await page.getByLabel("Message").fill("hello from finance test");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByLabel("Echo response")).toContainText('"message": "hello from finance test"');

  // back to dashboard
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // sign out -> protected route is closed again
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);

  // wrong password, then the right one
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
