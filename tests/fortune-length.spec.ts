import { test, expect } from "@playwright/test";
import { fortunes } from "../src/content";
test("全部六十条签文在窄窗口中均按句显示，不产生单字落行", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 260, height: 620 });
  await page.goto("/");
  for (const { id, verse, meaning, note } of fortunes) {
    await page.evaluate((id) => {
      const s = JSON.parse(localStorage.getItem("shijian-v1")!);
      const d = Object.keys(s.dailyPoems).sort().at(-1)!;
      s.draws[d] = id;
      localStorage.setItem("shijian-v1", JSON.stringify(s));
    }, id);
    await page.reload();
    await page.getByRole("button", { name: /重温今日签/ }).click();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".fortune-number")).toHaveText(
      `第 ${String(id).padStart(2, "0")} 签`,
    );
    await expect(page.locator(".fortune-verse")).toHaveText(
      verse.replace(/[，,]/g, ""),
    );
    await expect(page.locator(".fortune-interpretation p")).toHaveText(meaning);
    await expect(page.locator(".fortune-wish p")).toHaveText(note);
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
