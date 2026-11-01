import { test, expect } from "@playwright/test";
import { poems } from "../src/content";
import { poemReadings } from "../src/services/readings";
const detailed = poems.find(
  (p) => p.id === "cp-3be8afbd-659c-4e16-b54d-a9d17b9d0e0c",
)!;
const old = poems.find((p) => p.id === "qiuxi")!;
const reference = poems.find(
  (p) => poemReadings[p.id]?.kind === "ai-reference",
)!;
const uncovered = poems.find((p) => !poemReadings[p.id] && !p.meaning)!;

test("三套模板可阅读本地全文、释义、注释和赏析，不跳出应用", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".poem-lines").waitFor();
  for (const [layout, width, height] of [
    ["classic", 280, 700],
    ["horizontal", 520, 390],
    ["moon", 300, 720],
  ] as const) {
    await page.evaluate(
      ({ id, layout }) => {
        const s = JSON.parse(localStorage.getItem("shijian-v1")!);
        s.dailyPoems[Object.keys(s.dailyPoems).sort().at(-1)!] = id;
        s.layout = layout;
        localStorage.setItem("shijian-v1", JSON.stringify(s));
      },
      { id: detailed.id, layout },
    );
    await page.setViewportSize({ width, height });
    await page.reload();
    await page.locator(".poem-title").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator(".full-poem")).toHaveText(detailed.full);
    await expect(
      dialog.getByRole("heading", { name: detailed.title, exact: true }),
    ).toBeVisible();
    for (const sentence of await dialog.locator(".poem-sentence").all()) {
      const size = await sentence.evaluate((el) => ({
        client: el.clientWidth,
        content: el.scrollWidth,
      }));
      expect(size.content).toBeLessThanOrEqual(size.client + 1);
    }
    await page.screenshot({
      path: `test-results/离线全文-${layout}.png`,
      animations: "disabled",
    });
    await dialog.getByRole("button", { name: "解读", exact: true }).click();
    await expect(
      dialog.getByRole("region", { name: "白话释义" }),
    ).toContainText(poemReadings[detailed.id].translation![0]);
    await expect(
      dialog.getByRole("region", { name: "词语注释" }),
    ).toContainText("洛堤");
    await expect(dialog.getByRole("region", { name: "赏析" })).toContainText(
      poemReadings[detailed.id].appreciation,
    );
    await expect(dialog.getByRole("link")).toHaveCount(0);
    await page.screenshot({
      path: `test-results/离线解读-${layout}.png`,
      animations: "disabled",
    });
    await dialog.getByRole("button", { name: "关闭面板" }).click();
    await page.getByRole("button", { name: "阅读全文", exact: true }).click();
    await expect(dialog.locator(".full-poem")).toHaveText(detailed.full);
    await dialog.getByRole("button", { name: "关闭面板" }).click();
  }
});

test("收藏和历史打开对应作品，阅读弹窗重置滚动位置且收藏不误改今日诗", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".poem-lines").waitFor();
  await page.evaluate(
    ({ current, saved }) => {
      const s = JSON.parse(localStorage.getItem("shijian-v1")!);
      s.dailyPoems[Object.keys(s.dailyPoems).sort().at(-1)!] = current;
      s.dailyPoems["2026-01-01"] = saved;
      s.favorites = [saved];
      localStorage.setItem("shijian-v1", JSON.stringify(s));
    },
    { current: detailed.id, saved: old.id },
  );
  await page.reload();
  await page.getByRole("button", { name: "打开设置" }).click();
  await page.getByRole("dialog").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "阅读全文", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "原文", exact: true }),
  ).toBeInViewport();
  await page.getByRole("button", { name: "关闭面板" }).click();
  await page.getByRole("button", { name: "打开设置" }).click();
  await page.getByRole("button", { name: "我的藏诗", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: `${old.title} · ${old.author}`, exact: true })
    .click();
  await expect(dialog.locator(".full-poem")).toHaveText(old.full);
  await dialog.getByRole("button", { name: "解读", exact: true }).click();
  await expect(dialog.getByRole("region", { name: "白话释义" })).toContainText(
    poemReadings[old.id].translation![0],
  );
  await dialog.getByRole("button", { name: "取消收藏", exact: true }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("shijian-v1")!).favorites,
    ),
  ).toEqual([]);
  await dialog.getByRole("button", { name: "关闭面板" }).click();
  await page.locator("main").hover();
  await page.getByRole("button", { name: "收藏与历史", exact: true }).click();
  await dialog
    .locator("article")
    .filter({ has: page.locator("time", { hasText: "2026-01-01" }) })
    .getByRole("button", { name: /阅读全文/ })
    .click();
  await expect(dialog.locator(".full-poem")).toHaveText(old.full);
  await dialog.getByRole("button", { name: "关闭面板" }).click();
  await page.getByRole("button", { name: "阅读全文", exact: true }).click();
  await expect(dialog.locator(".full-poem")).toHaveText(detailed.full);
});

test("断网可读本地解读，参考赏析有标记，未覆盖篇目明确提示", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.locator(".poem-lines").waitFor();
  for (const poem of [detailed, reference, uncovered]) {
    await context.setOffline(false);
    await page.evaluate((id) => {
      const s = JSON.parse(localStorage.getItem("shijian-v1")!);
      s.dailyPoems[Object.keys(s.dailyPoems).sort().at(-1)!] = id;
      localStorage.setItem("shijian-v1", JSON.stringify(s));
    }, poem.id);
    await page.reload();
    await page.locator(".poem-lines").waitFor();
    await context.setOffline(true);
    await page.getByRole("button", { name: "阅读全文", exact: true }).click();
    await expect(page.locator(".full-poem")).toHaveText(poem.full);
    await page.getByRole("button", { name: "解读", exact: true }).click();
    if (poem === uncovered)
      await expect(
        page.getByRole("heading", { name: "本地详解待补充" }),
      ).toBeVisible();
    else {
      await expect(page.getByRole("region", { name: "赏析" })).toContainText(
        poemReadings[poem.id].appreciation,
      );
      if (poem === reference)
        await expect(page.locator(".reading-badge")).toHaveText(
          "AI整理 · 阅读参考",
        );
    }
    await expect(page.getByRole("dialog").getByRole("link")).toHaveCount(0);
    await page.getByRole("button", { name: "关闭面板" }).click();
  }
});
