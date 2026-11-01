import { test, expect } from "@playwright/test";
test("三布局五主题保留同一份诗签数据并正确加载背景", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const poem = await page.locator(".poem-lines").textContent();
  for (const [layout, width, height] of [
    ["经典竖版", 280, 700],
    ["横向诗钟", 520, 390],
    ["月轮竖版", 300, 720],
  ] as const) {
    await page.getByRole("button", { name: "打开设置" }).click();
    await page.getByRole("button", { name: layout, exact: true }).click();
    await page.getByRole("button", { name: "关闭面板" }).click();
    await page.setViewportSize({ width, height });
    for (const [theme, id] of [
      ["宣纸雅韵", "paper"],
      ["桃花春雨", "blossom"],
      ["烟雨江南", "rain"],
      ["玄青月色", "moon"],
      ["雪落长安", "snow"],
    ] as const) {
      await page.getByRole("button", { name: "打开设置" }).click();
      await page.getByRole("button", { name: new RegExp(theme) }).click();
      await page.getByRole("button", { name: "关闭面板" }).click();
      await expect(page.locator(".poem-lines")).toHaveText(poem!);
      await expect(
        page.getByRole("button", { name: /今日灵签/ }),
      ).toBeInViewport();
      await expect(
        page.getByRole("region", { name: "今日日期" }),
      ).toBeInViewport();
      const asset = await page.request.get(`/themes/${id}-v1.png`);
      expect(asset.ok()).toBe(true);
      await page.screenshot({
        path: `test-results/${layout}-${id}.png`,
        animations: "disabled",
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  await page.reload();
  await expect(page.locator("main")).toHaveClass(/layout-moon/);
  expect(errors).toEqual([]);
});
test("天气切城取消旧请求，缓存跨刷新可用，断网保留过期标记", async ({
  page,
}) => {
  const current = (temperature: number) => ({
    current: {
      temperature_2m: temperature,
      weather_code: 61,
      relative_humidity_2m: 75,
      wind_speed_10m: 6,
      time: Math.floor(Date.now() / 1000),
    },
  });
  await page.route("https://api.open-meteo.com/**", async (route) => {
    const city = new URL(route.request().url()).searchParams.get("latitude");
    if (city === "31.23") await new Promise((r) => setTimeout(r, 500));
    await route
      .fulfill({ json: current(city === "31.23" ? 99 : 18) })
      .catch(() => {});
  });
  await page.goto("/");
  await page.getByRole("button", { name: "打开设置" }).click();
  await page.getByLabel("天气城市", { exact: true }).selectOption("shanghai");
  await page.getByLabel("天气城市", { exact: true }).selectOption("hangzhou");
  await page.getByRole("button", { name: "关闭面板" }).click();
  await expect(page.locator(".weather")).toContainText("18°C");
  await expect(page.locator(".weather")).toContainText("杭州");
  await page.waitForTimeout(600);
  await expect(page.locator(".weather")).not.toContainText("99");
  await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith("shijian-weather-")) {
        const v = JSON.parse(localStorage.getItem(k)!);
        v.fetchedAt = Date.now() - 3600000;
        localStorage.setItem(k, JSON.stringify(v));
      }
    }
  });
  await page.unroute("https://api.open-meteo.com/**");
  await page.route("https://api.open-meteo.com/**", (r) => r.abort());
  await page.reload();
  await expect(page.locator(".weather")).toContainText("18°C");
  await expect(page.locator(".weather")).toContainText("已过期");
});
test("每日随机跨刷新稳定，旧版收藏与签文升级后可查看", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("shijian-v1"))
      localStorage.setItem(
        "shijian-v1",
        JSON.stringify({
          schemaVersion: 1,
          theme: "moon",
          timeMode: "both",
          reducedMotion: false,
          favorites: ["qiuxi"],
          dailyPoems: { "2026-10-31": "qiuxi" },
          draws: { "2026-10-31": 2 },
        }),
      );
  });
  await page.goto("/");
  await page.getByRole("button", { name: "打开设置" }).click();
  await page.getByLabel("换肤方式", { exact: true }).selectOption("daily");
  await page.getByRole("button", { name: "关闭面板" }).click();
  const theme = await page.locator(".art-background").getAttribute("style");
  await page.reload();
  await expect(page.locator(".art-background")).toHaveAttribute(
    "style",
    theme!,
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("shijian-v1")!),
  );
  expect(saved.schemaVersion).toBe(2);
  expect(saved.favorites).toContain("qiuxi");
  expect(saved.draws["2026-10-31"]).toBe(2);
});
