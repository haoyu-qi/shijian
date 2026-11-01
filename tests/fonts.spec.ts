import { test, expect } from "@playwright/test";
import { poems, fortunes } from "../src/content";
test("内置行书覆盖当前诗词签文，并在三套布局中保持完整", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.load('30px "Zhi Mang Xing"'));
  const han = [
    ...new Set(
      (
        poems.map((p) => p.full).join("") +
        fortunes.map((f) => f.verse).join("") +
        "子丑寅卯辰巳午未申酉戌亥时立春雨水惊蛰春分清明谷雨立夏小满芒种夏至小暑大暑立秋处暑白露秋分寒露霜降立冬小雪大雪冬至小寒大寒"
      ).match(/\p{Script=Han}/gu),
    ),
  ].join("");
  await page.evaluate((text) => {
    const probe = document.createElement("span");
    probe.id = "font-coverage-probe";
    probe.style.cssText =
      'position:fixed;inset:0;z-index:100;background:white;color:black;font:12px "Zhi Mang Xing";overflow:auto';
    probe.textContent = text;
    document.body.appendChild(probe);
  }, han);
  await page.screenshot();
  const session = await page.context().newCDPSession(page);
  await session.send("DOM.enable");
  await session.send("CSS.enable");
  const { root } = await session.send("DOM.getDocument");
  const { nodeId } = await session.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: "#font-coverage-probe",
  });
  const { fonts } = await session.send("CSS.getPlatformFontsForNode", {
    nodeId,
  });
  expect(fonts.length).toBe(1);
  expect(fonts[0].isCustomFont).toBe(true);
  expect(fonts[0].familyName).toContain("Zhi Mang Xing");
  await page.locator("#font-coverage-probe").evaluate((el) => el.remove());
  for (const [name, width, height] of [
    ["经典竖版", 280, 700],
    ["横向诗钟", 520, 390],
    ["月轮竖版", 300, 720],
    ["经典竖版", 260, 620],
    ["月轮竖版", 260, 620],
  ] as const) {
    await page.getByRole("button", { name: "打开设置" }).click();
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("button", { name: "关闭面板" }).click();
    await page.setViewportSize({ width, height });
    const text = await page.locator(".poem-lines").boundingBox(),
      actions = await page.locator(".poem-actions").boundingBox();
    expect(text!.y + text!.height).toBeLessThanOrEqual(actions!.y + 1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "打开设置" }),
    ).toBeInViewport();
    await page.screenshot({
      path: `test-results/行书-${name}-${width}x${height}.png`,
      animations: "disabled",
    });
  }
});
