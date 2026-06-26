"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function getNavOffset() {
  const nav = document.querySelector("[data-landing-nav]");
  if (!nav) return 128;
  return nav.getBoundingClientRect().height + 20;
}

function computeActiveSection(sectionIds) {
  const line = getNavOffset();
  let active = "";

  for (const id of sectionIds) {
    const element = document.getElementById(id);
    if (!element) continue;

    const { top } = element.getBoundingClientRect();
    if (top <= line) {
      active = id;
    }
  }

  return active;
}

export function useActiveSection(sectionIds) {
  const [active, setActive] = useState("");
  const manualLock = useRef(null);
  const unlockTimer = useRef(null);
  const ticking = useRef(false);

  const syncActive = useCallback(() => {
    if (manualLock.current) {
      setActive(manualLock.current);
      return;
    }
    setActive(computeActiveSection(sectionIds));
  }, [sectionIds]);

  const setManualActive = useCallback(
    (id) => {
      manualLock.current = id;
      setActive(id);

      if (unlockTimer.current) {
        window.clearTimeout(unlockTimer.current);
      }

      unlockTimer.current = window.setTimeout(() => {
        manualLock.current = null;
        syncActive();
      }, 900);
    },
    [syncActive]
  );

  useEffect(() => {
    syncActive();

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(() => {
        syncActive();
        ticking.current = false;
      });
    };

    const releaseManualLock = () => {
      manualLock.current = null;
      syncActive();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", syncActive);
    window.addEventListener("hashchange", syncActive);
    window.addEventListener("scrollend", releaseManualLock);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", syncActive);
      window.removeEventListener("hashchange", syncActive);
      window.removeEventListener("scrollend", releaseManualLock);
      if (unlockTimer.current) {
        window.clearTimeout(unlockTimer.current);
      }
    };
  }, [syncActive]);

  return { active, setManualActive };
}

export function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return;

  const top = element.getBoundingClientRect().top + window.scrollY - getNavOffset() + 8;
  window.scrollTo({ top, behavior: "smooth" });
}
