"use client";

import { useCallback, useState } from "react";
import { toPng } from "html-to-image";

const EXPORT_PAD_PX = 40;

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

    const wrapper = document.createElement("div");
    wrapper.style.cssText = [
      "position:fixed",
      "left:-10000px",
      "top:0",
      `padding:${EXPORT_PAD_PX}px`,
      "background:#0b0b0c",
      "box-sizing:border-box",
      `width:${Math.max(node.scrollWidth, node.clientWidth) + EXPORT_PAD_PX * 2}px`,
    ].join(";");

    const clone = node.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("[data-export-exclude]").forEach((el) => el.remove());
    clone.querySelectorAll("form").forEach((el) => el.remove());

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
      const dataUrl = await toPng(wrapper, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0b0b0c",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${captureId}.png`;
      a.click();
      setMsg("Image downloaded — drop it in the group chat");
    } catch {
      setMsg("Screenshot failed — try again");
    } finally {
      wrapper.remove();
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
