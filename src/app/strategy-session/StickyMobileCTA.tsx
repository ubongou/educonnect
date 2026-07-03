"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { StrategyCTA } from "./StrategyCTA";

// A thumb-reachable CTA pinned to the bottom of the viewport on mobile. It
// appears once the visitor scrolls past the hero. CSS keeps it mobile-only.
export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={clsx("ss-sticky", visible && "visible")} aria-hidden={!visible}>
      <StrategyCTA source="ss-sticky" block />
    </div>
  );
}
