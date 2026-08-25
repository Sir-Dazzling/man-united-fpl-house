"use client";

import { useCallback, useState } from "react";
import { toPng } from "html-to-image";

const EXPORT_PAD_PX = 40;

/** Canvas can't paint oklch()/lab() from Tailwind v4 — bake computed rgb onto the clone. */
function bakeComputedColors(sourceRoot: HTMLElement, cloneRoot: HTMLElement) {
  const props = [
    "color",
    "background-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
    "text-decoration-color",
    "fill",
    "stroke",
    "box-shadow",
    "text-shadow",
    "opacity",
    "background-image",
  ] as const;

  const sources = [sourceRoot, ...sourceRoot.querySelectorAll<HTMLElement>("*")];
  const clones = [cloneRoot, ...cloneRoot.querySelectorAll<HTMLElement>("*")];

  for (let i = 0; i < sources.length; i += 1) {
    const src = sources[i];
    const clone = clones[i];
    if (!src || !clone) continue;
    const computed = window.getComputedStyle(src);
    for (const prop of props) {
      const value = computed.getPropertyValue(prop);
      if (value) clone.style.setProperty(prop, value);
    }
  }
}

export function ShareExportBar({
  captureId,
  csvFilename,
  csvRows,
}: {
  captureId: string;
  csvFilename: string;
  csvRows: string[][];
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const downloadCsv = useCallback(() => {
    const body = csvRows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFilename;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("CSV downloaded");
  }, [csvFilename, csvRows]);

  const downloadPng = useCallback(async () => {
    const node = document.getElementById(captureId);
    if (!node) {
      setMsg("Nothing to capture");
      return;
    }
    setBusy(true);
    setMsg(null);

    const hidden: Array<{ el: HTMLElement; display: string }> = [];
    node
      .querySelectorAll<HTMLElement>("[data-export-exclude], form")
      .forEach((el) => {
        hidden.push({ el, display: el.style.display });
        el.style.display = "none";
      });

    const prev = {
      padding: node.style.padding,
      background: node.style.backgroundColor,
      boxSizing: node.style.boxSizing,
    };
    node.style.padding = `${EXPORT_PAD_PX}px`;
    node.style.backgroundColor = "#0b0b0c";
    node.style.boxSizing = "border-box";

    try {
      // Warm-up pass helps Safari / Chrome paint fonts before serialize
      await toPng(node, {
        cacheBust: true,
        pixelRatio: 1,
        backgroundColor: "#0b0b0c",
        includeQueryParams: true,
        onclone: (_doc, cloned) => {
          bakeComputedColors(node, cloned as HTMLElement);
        },
      });

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0b0b0c",
        includeQueryParams: true,
        onclone: (_doc, cloned) => {
          bakeComputedColors(node, cloned as HTMLElement);
        },
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${captureId}.png`;
      a.click();
      setMsg("Image downloaded — drop it in the group chat");
    } catch {
      setMsg("Screenshot failed — try again");
    } finally {
      node.style.padding = prev.padding;
      node.style.backgroundColor = prev.background;
      node.style.boxSizing = prev.boxSizing;
      for (const { el, display } of hidden) {
        el.style.display = display;
      }
      setBusy(false);
    }
  }, [captureId]);

  return (
    <div className="flex flex-wrap items-center gap-2" data-export-exclude>
      <button
        type="button"
        onClick={downloadPng}
        disabled={busy}
        className="rounded-lg border border-gold/40 px-3 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold/10 disabled:opacity-50"
      >
        {busy ? "Capturing…" : "Download PNG"}
      </button>
      <button
        type="button"
        onClick={downloadCsv}
        className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/40"
      >
        Export CSV
      </button>
      {msg ? <span className="text-xs text-white/50">{msg}</span> : null}
    </div>
  );
}
