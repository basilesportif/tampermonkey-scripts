// ==UserScript==
// @name         ESPN: X toggles player UI
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Press X to toggle ESPN player overlays/controls. Shows a tiny tooltip.
// @match        *://*.espn.com/watch/player/*
// @match        *://watch.espn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  const S = { on: false };
  const toast = document.createElement("div");
  toast.style.cssText =
    "position:fixed;top:8px;left:8px;z-index:2147483647;" +
    "padding:3px 6px;border-radius:6px;font:11px/1.2 system-ui;" +
    "background:rgba(0,0,0,.72);color:#fff;pointer-events:none;" +
    "opacity:.9;transition:opacity .15s ease";
  document.documentElement.appendChild(toast);

  const setToast = (txt) => { toast.textContent = txt; };
  const apply = () => {
    const v = S.on ? "0" : "";
    const pe = S.on ? "none" : "";
    document.querySelectorAll("controls-overlay, buffering-overlay, espn-web-player-ui")
      .forEach(el => { el.style.opacity = v; el.style.pointerEvents = pe; });
    setToast(`TM: X toggle UI — ${S.on ? "HIDDEN" : "VISIBLE"}`);
  };

  setToast("TM: X toggle UI — READY");

  window.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (e.key === "x" || e.key === "X") { S.on = !S.on; apply(); }
  }, true);
})();
