"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyErrorIcon, CopyIcon } from "@/components/ui-icons";

type CopyState = "idle" | "copied" | "failed";

async function writeDidToClipboard(did: string) {
  if (navigator.clipboard?.writeText) {
    let timeoutId: number | undefined;
    try {
      await Promise.race([
        navigator.clipboard.writeText(did),
        new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error("Clipboard write timed out")), 800);
        }),
      ]);
      return;
    } catch {
      // Continue to the selection-based fallback for insecure or restricted contexts.
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
  }

  const field = document.createElement("textarea");
  const focusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  field.value = did;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "0";
  field.style.left = "0";
  field.style.opacity = "0";
  field.style.pointerEvents = "none";
  field.style.fontSize = "16px";
  document.body.appendChild(field);
  field.focus({ preventScroll: true });
  field.select();
  field.setSelectionRange(0, field.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    field.remove();
    focusedElement?.focus({ preventScroll: true });
  }

  if (!copied) throw new Error("Clipboard copy was unavailable");
}

export function CopyDidButton({ did }: { did: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  async function copyDid() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try {
      await writeDidToClipboard(did);
      setState("copied");
    } catch {
      setState("failed");
    }
    timeoutRef.current = setTimeout(() => setState("idle"), 1500);
  }

  return <button className={`copy-did-button copy-did-button--${state}`} type="button" aria-label="Copy full DID" onClick={copyDid}>
    {state === "copied" ? <CheckIcon /> : state === "failed" ? <CopyErrorIcon /> : <CopyIcon />}
    <span className="visually-hidden" aria-live="polite">{state === "copied" ? "DID copied" : state === "failed" ? "Could not copy DID" : ""}</span>
  </button>;
}
