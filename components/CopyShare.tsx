"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "./ui";

export function CopyShare({ url, shareText }: { url: string; shareText: string }) {
  const [copied, setCopied] = useState(false);
  // false during SSR, real value in the browser (no hydration mismatch)
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  async function share() {
    try {
      await navigator.share({ title: "FlatMatch", text: shareText, url });
    } catch {
      // user cancelled, nothing to do
    }
  }

  return (
    <div className="flex gap-2">
      <button type="button" className={`btn flex-1 ${copied ? "border-emerald-300 bg-emerald-50 text-emerald-800" : ""}`} onClick={copy}>
        <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
        {copied ? "Copied" : "Copy link"}
      </button>
      {canShare && (
        <button type="button" className="btn-primary flex-1" onClick={share}>
          <Icon name="share" className="h-4 w-4" /> Share
        </button>
      )}
    </div>
  );
}
