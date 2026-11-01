import { test, expect } from "@playwright/test";
test("搜索国内城市、过滤境外结果并持久保存", async ({ page }) => {
  await page.route("https://geocoding-api.open-meteo.com/**", async (r) => {
    expect(new URL(r.request().url()).searchParams.get("countryCode")).toBe(
      "CN",
    );
    await r.fulfill({
      json: {
        results: [
          {
            id: 1886760,
            name: "苏州市",
            country_code: "CN",
            admin1: "江苏省",
            latitude: 31.3,
            longitude: 120.6,
          },
          {
            id: 9,
            name: "国外同名地区",
            country_code: "US",
            latitude: 31,
            longitude: 120,
          },
        ],
      },
    });
  });
  await page.route("https://api.open-meteo.com/**", (r) =>
    r.fulfill({
      json: {
        current: {
          temperature_2m: 20,
          weather_code: 0,
          relative_humidity_2m: 60,
          wind_speed_10m: 5,
          time: Math.floor(Date.now() / 1000),
        },
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "打开设置" }).click();
  await page.getByLabel("自定义国内城市 / 区县").fill("苏州");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByRole("list", { name: "城市搜索结果" })).toContainText(
    "江苏省",
  );
  await expect(page.getByText("国外同名地区")).toHaveCount(0);
  await page.getByRole("button", { name: /苏州市.*江苏省/ }).click();
  await expect(page.getByLabel("天气城市", { exact: true })).toHaveValue(
    "geo-1886760",
  );
  await page.getByRole("button", { name: "关闭面板" }).click();
  await expect(page.locator(".weather")).toContainText("苏州市");
  await page.reload();
  await expect(page.locator(".weather")).toContainText("苏州市");
});
test("城市搜索失败与空结果有明确提示，原城市保留", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "打开设置" }).click();
  await page.getByLabel("天气城市", { exact: true }).selectOption("shanghai");
  await page.route("https://geocoding-api.open-meteo.com/**", (r) =>
    r.fulfill({ json: { results: [] } }),
  );
  await page.getByLabel("自定义国内城市 / 区县").fill("不存在的城市");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByText(/未找到匹配地区/)).toBeVisible();
  await expect(page.getByLabel("天气城市", { exact: true })).toHaveValue(
    "shanghai",
  );
  await page.unroute("https://geocoding-api.open-meteo.com/**");
  await page.route("https://geocoding-api.open-meteo.com/**", (r) => r.abort());
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.locator(".city-error")).toBeVisible();
});
test("顶部按钮移入显示移出隐藏，灵签分区清楚且结果稳定", async ({ page }) => {
  await page.goto("/");
  await page.mouse.move(0, 0);
  await page.mouse.move(120,100);
  await expect(page.locator(".quick-actions")).toHaveCSS("opacity", "1");
  await page.mouse.move(-10,-10);
  await expect(page.locator(".quick-actions")).toHaveCSS("opacity", "0");
  await page.getByRole("button", { name: /今日灵签/ }).click();
  await expect(page.getByText("每日一次 · 结果自动保存")).toBeVisible();
  await page.screenshot({
    path: "test-results/新版-待抽签.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: "抽取今日签", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "签意", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "今日寄语", exact: true }),
  ).toBeVisible();
  const verse = await page.locator(".fortune-verse").textContent();
  await page.screenshot({
    path: "test-results/新版-灵签.png",
    animations: "disabled",
  });
  await page.reload();
  await page.getByRole("button", { name: /重温今日签/ }).click();
  await expect(page.locator(".fortune-verse")).toHaveText(verse!);
});
