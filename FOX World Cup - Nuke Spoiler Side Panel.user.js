// ==UserScript==
// @name         FOX World Cup - Nuke Spoiler Side Panel
// @namespace    tampermonkey-fox-watch-no-spoilers
// @version      1.0
// @description  Removes the FOX Watch side panel to avoid World Cup spoilers.
// @match        https://www.fox.com/*
// @match        https://www.fox.com/watch/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const SIDE_PANEL_SELECTOR = [
    '#WatchSidePanelContainer',
    '[data-testid="WatchSidePanelContainer"]'
  ].join(',');

  // Hide immediately, before React finishes rendering.
  const style = document.createElement('style');
  style.textContent = `
    ${SIDE_PANEL_SELECTOR} {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      flex: 0 0 0 !important;
      overflow: hidden !important;
      pointer-events: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  function nukeSidePanel() {
    document.querySelectorAll(SIDE_PANEL_SELECTOR).forEach((el) => {
      el.remove();
    });
  }

  // Run now.
  nukeSidePanel();

  // Keep nuking it if FOX re-inserts it dynamically.
  const observer = new MutationObserver(() => {
    nukeSidePanel();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Backup sweep in case FOX mutates attributes/classes without normal insertions.
  setInterval(nukeSidePanel, 1000);
})();