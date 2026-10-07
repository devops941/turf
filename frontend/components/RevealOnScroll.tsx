"use client";

import { useEffect } from "react";

/**
 * Progressive scroll reveal for the landing page. Adds `.is-in` to every
 * `.reveal` element once it enters the viewport. A MutationObserver picks up
 * `.reveal` nodes that mount later (e.g. sections rendered after an async
 * fetch), so they are never left stuck at `opacity: 0`. Reduced-motion users
 * get the final state immediately (handled in CSS).
 */
export function RevealOnScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      document.querySelectorAll(".reveal").forEach((n) => n.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );

    const observe = (node: Element) => {
      if (node instanceof HTMLElement && node.classList.contains("reveal")) {
        if (!node.classList.contains("is-in")) io.observe(node);
      }
    };

    document.querySelectorAll(".reveal").forEach(observe);

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          observe(node);
          node.querySelectorAll?.(".reveal").forEach(observe);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
