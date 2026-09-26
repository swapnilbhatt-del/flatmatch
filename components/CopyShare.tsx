"use client";

import { useState } from "react";

export function CopyShare({ url, shareText }: { url: string; shareText: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

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
      <button type="button" className="btn flex-1" onClick={copy}>
        {copied ? "Copied ✓" : "Copy link"}
      </button>
      {canShare && (
        <button type="button" className="btn-primary flex-1" onClick={share}>
          Share (WhatsApp…)
        </button>
      )}
    </div>
  );
}
