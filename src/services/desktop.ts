import {
  currentMonitor,
  getCurrentWindow,
  LogicalPosition,
  LogicalSize,
} from "@tauri-apps/api/window";
import { layouts } from "./themes";
import type { Layout } from "./storage";
let queue = Promise.resolve();
export function applyLayout(layout: Layout) {
  const task = queue.then(async () => {
    const win = getCurrentWindow(),
      spec = layouts.find((l) => l.id === layout)!;
    await win.setResizable(false);
    // 先解除旧模板的尺寸约束，再设置新模板的固定尺寸。
    await win.setMinSize(null);
    await win.setMaxSize(null);
    await win.setSize(new LogicalSize(spec.width, spec.height));
    await win.setMinSize(new LogicalSize(spec.width, spec.height));
    await win.setMaxSize(new LogicalSize(spec.width, spec.height));
    const monitor = await currentMonitor();
    if (monitor) {
      const area = monitor.workArea,
        s = monitor.scaleFactor,
        pos = await win.outerPosition();
      await win.setPosition(
        new LogicalPosition(
          Math.max(
            area.position.x / s,
            Math.min(
              pos.x / s,
              (area.position.x + area.size.width) / s - spec.width,
            ),
          ),
          Math.max(
            area.position.y / s,
            Math.min(
              pos.y / s,
              (area.position.y + area.size.height) / s - spec.height,
            ),
          ),
        ),
      );
    }
  });
  queue = task.catch(() => {});
  return task;
}
