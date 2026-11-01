import { test, expect } from "@playwright/test";

test("诗词正文使用行书，其余所有界面文字使用楷体", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const checkRoles = async () => {
    const mismatches = await page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.querySelector("main")!,
        NodeFilter.SHOW_TEXT,
      );
      const errors: string[] = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const el = node.parentElement;
        if (!el || !node.textContent?.trim()) continue;
        const family = getComputedStyle(el).fontFamily;
        const isPoem = !!el.closest(
          ".poem-lines > span, .full-poem, .poem-excerpt",
        );
        const expected = isPoem ? "Zhi Mang Xing" : "KaiTi";
        if (!family.startsWith(expected) && !family.startsWith(`"${expected}"`))
          errors.push(`${node.textContent}: ${family}`);
      }
      return errors;
    });
    expect(mismatches).toEqual([]);
  };
  // 核对实际绘制的数字和中文字体，避免仅有字体栈声明、实际仍回退宋体。
  const session = await page.context().newCDPSession(page);
  await session.send("DOM.enable");
  await session.send("CSS.enable");
  const { root } = await session.send("DOM.getDocument");
  for (const selector of [
    ".time-widget time",
    ".date-row > strong",
    ".solar-term strong",
  ]) {
    const { nodeId } = await session.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector,
    });
    const { fonts } = await session.send("CSS.getPlatformFontsForNode", {
      nodeId,
    });
    expect(fonts.length).toBeGreaterThan(0);
    expect(fonts.every((font) => font.familyName === "KaiTi")).toBe(true);
  }
  await checkRoles();
  await page.getByRole("button", { name: /阅读《.*》全文/ }).click();
  await checkRoles();
  await page.getByRole("button", { name: "收藏此诗", exact: true }).click();
  await page.getByRole("button", { name: "关闭面板" }).click();
  await page.getByRole("button", { name: "打开设置" }).click();
  await checkRoles();
  await page.getByRole("button", { name: "我的藏诗", exact: true }).click();
  await checkRoles();
  await page.getByRole("button", { name: "关闭面板" }).click();
  await page.getByRole("button", { name: /今日灵签/ }).click();
  await checkRoles();
  await page.getByRole("button", { name: "抽取今日签", exact: true }).click();
  await expect(page.locator(".fortune-verse")).toBeVisible();
  await checkRoles();
  await page.getByRole("button", { name: /查看往日灵签/ }).click();
  await checkRoles();
});
