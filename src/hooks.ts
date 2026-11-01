import { useEffect, useState } from "react";
import { nextMinuteDelay } from "./services/calendar";
export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      clearTimeout(timer);
      const current = new Date();
      setNow(current);
      timer = setTimeout(tick, nextMinuteDelay(current));
    };
    const visible = () => {
      if (document.visibilityState === "visible") tick();
    };
    tick();
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return now;
}
