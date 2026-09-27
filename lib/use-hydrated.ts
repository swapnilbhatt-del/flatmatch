"use client";

import { useSyncExternalStore } from "react";

/**
 * false in the server HTML, true once React is running in the browser.
 * Forms disable their fields until then: anything typed before hydration would be
 * silently discarded, and "Save" would re-submit the old values.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
