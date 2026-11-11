import { expect, test } from "@playwright/test";

const password = "correct-horse-battery";

test("home page renders the hero and calls to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pin places");
  await expect(page.getByRole("link", { name: "Try the search" })).toBeVisible();
  await expect(page.getByRole("img", { name: /search ring/i })).toBeVisible();
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

test("sign up, manage places, search nearby, sign out and sign in again", async ({ page }) => {
  const tag = crypto.randomUUID().slice(0, 8);
  const email = `ui-${tag}@example.test`;
  const placeName = `Corner Cafe ${tag}`;

  // sign up -> dashboard
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ada Lovelace");
  await expect(page.getByText(`Signed in as ${email}.`)).toBeVisible();

  // coordinates are validated in the browser
  await page.getByLabel("Name", { exact: true }).fill(placeName);
  await page.getByLabel("Longitude").fill("200");
  await page.getByLabel("Latitude").fill("48.8584");
  await page.getByRole("button", { name: "Save place" }).click();
  await expect(page.getByText(/Longitude must be between -180 and 180/)).toBeVisible();

  // create
  await page.getByLabel("Longitude").fill("2.2945");
  await page.getByRole("button", { name: "Save place" }).click();
  const row = page.getByRole("listitem").filter({ hasText: placeName });
  await expect(row).toBeVisible();
  await expect(row.getByText("2.29450, 48.85840")).toBeVisible();

  // duplicate name is reported
  await page.getByLabel("Name", { exact: true }).fill(placeName);
  await page.getByLabel("Longitude").fill("3");
  await page.getByLabel("Latitude").fill("3");
  await page.getByRole("button", { name: "Save place" }).click();
  await expect(page.getByText("You already have a place with this name.")).toBeVisible();

  // nearby search in the playground finds it
  await page.getByRole("link", { name: "Playground" }).click();
  await expect(page).toHaveURL(/\/playground$/);
  await page.getByRole("button", { name: "Search" }).click();
  const hit = page.getByRole("list", { name: "Nearby places" }).getByRole("listitem").filter({ hasText: placeName });
  await expect(hit).toBeVisible();

  // echo
  await page.getByLabel("Message").fill("hello from e2e");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByLabel("Echo response")).toContainText('"message": "hello from e2e"');

  // delete from the dashboard
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.getByRole("button", { name: `Delete ${placeName}` }).click();
  await expect(page.getByRole("listitem").filter({ hasText: placeName })).toHaveCount(0);

  // sign out -> protected route is closed again
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);

  // wrong password, then the right one (and the ?next= target is honoured)
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
