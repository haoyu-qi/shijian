import { test, expect } from "@playwright/test";
test("真实天气接口浏览器联调", async ({ page }) => {
  test.skip(
    process.env.SHIJIAN_LIVE_WEATHER !== "1",
    "仅按需运行真实外部接口联调",
  );
  await page.goto("/");
  await page.getByRole("button", { name: "打开设置" }).click();
  await page.getByLabel("天气城市", { exact: true }).selectOption("shanghai");
  await page.getByRole("button", { name: "关闭面板" }).click();
  await expect(page.locator(".weather strong")).toHaveText(/^-?\d+°C$/, {
    timeout: 20000,
  });
  await expect(page.locator(".weather small")).toContainText("上海");
  await page.screenshot({
    path: "test-results/live-weather.png",
    animations: "disabled",
  });
});
