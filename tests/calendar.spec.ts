import { test, expect } from "@playwright/test";
test("诗词收藏、换肤及每日灵签跨刷新持久化", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("region", { name: "每日诗词" })).toBeVisible();
  await page.screenshot({ path: "test-results/shijian-paper.png" });
  await page.getByRole("button", { name: "♡ 藏诗", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "♥ 已藏", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "打开设置" }).click();
  await page.getByRole("button", { name: /玄青月色/ }).click();
  await expect(page.locator("main")).toHaveClass(/theme-moon/);
  await page.getByRole("button", { name: "关闭面板" }).click();
  await page.getByRole("button", { name: /今日灵签/ }).click();
  await page.getByRole("button", { name: "抽取今日签", exact: true }).click();
  await expect(page.locator(".fortune-number")).toBeVisible();
  const result = await page.locator(".fortune-verse").textContent();
  await page.reload();
  await expect(page.locator("main")).toHaveClass(/theme-moon/);
  await expect(
    page.getByRole("button", { name: "♥ 已藏", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /重温今日签/ }).click();
  await expect(page.locator(".fortune-verse")).toHaveText(result!);
  await expect(
    page.getByRole("button", { name: "抽取今日签", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "关闭面板" }).click();
  await page.screenshot({ path: "test-results/shijian-moon.png" });
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("写入失败不会显示虚假的抽签成功", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /今日灵签/ }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("quota");
    };
  });
  await page.getByRole("button", { name: "抽取今日签", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("操作未完成");
  await expect(page.locator(".fortune-number")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "抽取今日签", exact: true }),
  ).toBeEnabled();
});
test("五套配色及紧凑尺寸均能操作", async ({ page }) => {
  await page.setViewportSize({ width: 260, height: 620 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "打开设置" })).toBeInViewport();
  for (const name of [
    "宣纸雅韵",
    "桃花春雨",
    "烟雨江南",
    "玄青月色",
    "雪落长安",
  ]) {
    await page.getByRole("button", { name: "打开设置" }).click();
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await page.getByRole("button", { name: "关闭面板" }).click();
    await expect(
      page.getByRole("button", { name: /今日灵签/ }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
