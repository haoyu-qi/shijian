import { test, expect } from "@playwright/test";
test("不同屏幕像素倍率下行书与辅助文字均完整", async ({ browser }) => {
  for (const scale of [1, 1.25, 1.5, 2]) {
    const context = await browser.newContext({
      viewport: { width: 280, height: 700 },
      deviceScaleFactor: scale,
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:1420");
    await page.evaluate(() => document.fonts.load('30px "Zhi Mang Xing"'));
    await expect(
      page.getByRole("region", { name: "今日日期" }),
    ).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "打开设置" }),
    ).toBeInViewport();
    const poem = await page.locator(".poem-lines").boundingBox(),
      actions = await page.locator(".poem-actions").boundingBox();
    expect(poem!.y + poem!.height).toBeLessThanOrEqual(actions!.y + 1);
    await page.screenshot({
      path: `test-results/字体-${scale}x.png`,
      animations: "disabled",
    });
    await context.close();
  }
});
