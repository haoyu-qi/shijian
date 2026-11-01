import { test, expect } from "@playwright/test";
test("六条签文在窄窗口中均按句显示，不产生单字落行", async ({ page }) => {
  await page.setViewportSize({ width: 260, height: 620 });
  await page.goto("/");
  for (let id = 1; id <= 6; id++) {
    await page.evaluate((id) => {
      const s = JSON.parse(localStorage.getItem("shijian-v1")!);
      const d = Object.keys(s.dailyPoems).sort().at(-1)!;
      s.draws[d] = id;
      localStorage.setItem("shijian-v1", JSON.stringify(s));
    }, id);
    await page.reload();
    await page.getByRole("button", { name: /重温今日签/ }).click();
    await page.evaluate(() => document.fonts.ready);
    for (const line of await page.locator(".fortune-verse p").all()) {
      const metric = await line.evaluate((el) => ({
        height: el.getBoundingClientRect().height,
        lineHeight: parseFloat(getComputedStyle(el).lineHeight),
      }));
      expect(metric.height).toBeLessThanOrEqual(metric.lineHeight + 1);
    }
    await page.getByRole("button", { name: "关闭面板" }).click();
  }
});
