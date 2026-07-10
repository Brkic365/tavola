"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard may be blocked on insecure origins; ignore */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-accent-strong" strokeWidth={2} />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" strokeWidth={1.75} />
          Copy link
        </>
      )}
    </button>
  );
}
