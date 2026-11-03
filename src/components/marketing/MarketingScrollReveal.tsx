"use client";

import { useEffect } from "react";

export function MarketingScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".mkt-root .reveal");
    if (els.length === 0) return;

    // Anything already on screen (or scrolled past) stays visible, so the
    // page never blanks out after it has painted. Only content still below
    // the fold is hidden, and it fades in as it arrives.
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("visible");
    });
    document.querySelectorAll(".mkt-root").forEach((root) => root.classList.add("reveal-on"));

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
