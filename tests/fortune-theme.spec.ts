import { test, expect } from "@playwright/test";
test("五套皮肤的灵签背景和文字同步，换肤不改变签文", async ({ page }) => {
  await page.goto("/");
  let original = "";
  for (const [name, id] of [
    ["宣纸雅韵", "paper"],
    ["桃花春雨", "blossom"],
    ["烟雨江南", "rain"],
    ["玄青月色", "moon"],
    ["雪落长安", "snow"],
  ] as const) {
    await page.getByRole("button", { name: "打开设置" }).click();
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await page.getByRole("button", { name: "关闭面板" }).click();
    await page.getByRole("button", { name: /今日灵签|重温今日签/ }).click();
    await expect(page.locator("[data-fortune-theme]")).toHaveAttribute(
      "data-fortune-theme",
      id,
    );
    await expect(page.locator(".fortune-scene")).toHaveCSS(
      "background-image",
      new RegExp(`/themes/${id}-v1.png`),
    );
    if (!original) {
      await page.screenshot({
        path: "test-results/灵签-待抽取.png",
        animations: "disabled",
      });
      await page
        .getByRole("button", { name: "抽取今日签", exact: true })
        .click();
      original = (await page.locator(".fortune-verse").textContent())!;
    }
    await expect(page.locator(".fortune-verse")).toHaveText(original);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            getComputedStyle(document.querySelector("main")!).color ===
            getComputedStyle(document.querySelector(".fortune-card")!).color,
        ),
      )
      .toBe(true);
    await page.screenshot({
      path: `test-results/灵签随肤-${id}.png`,
      animations: "disabled",
    });
    await page.getByRole("button", { name: "关闭面板" }).click();
  }
  await page.reload();
  await page.getByRole("button", { name: /重温今日签/ }).click();
  await expect(page.locator("[data-fortune-theme]")).toHaveAttribute(
    "data-fortune-theme",
    "snow",
  );
  await expect(page.locator(".fortune-verse")).toHaveText(original);
});
