import { useEffect, useState, type RefObject } from "react";

const A4_HEIGHT_PX = 1122;

export function usePageEstimate(ref: RefObject<HTMLElement | null>): number {
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setPages(Math.max(1, Math.ceil(el.scrollHeight / A4_HEIGHT_PX)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return pages;
}
