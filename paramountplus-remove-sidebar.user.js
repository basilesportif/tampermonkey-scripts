// ==UserScript==
// @name         Paramount+ - remove skin-sidebar-plugin
// @namespace    https://tampermonkey.net/
// @version      1.0
// @description  Removes div(s) with class "skin-sidebar-plugin" on paramountplus.com
// @match        https://www.paramountplus.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
   console.log('TM running on', location.href);


  const TARGET_CLASS = 'skin-sidebar-plugin';

  function removeTargets() {
    const nodes = document.getElementsByClassName(TARGET_CLASS);
    // HTMLCollection is live, so remove until none remain
    while (nodes.length > 0) {
      nodes[0].remove();
    }
  }

  // Remove ASAP
  removeTargets();

  // Remove again once DOM is ready (some apps inject after initial parse)
  document.addEventListener('DOMContentLoaded', removeTargets, { once: true });

  // Keep removing if the site re-injects it later (SPA behavior)
  const observer = new MutationObserver(() => removeTargets());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Optional: if the element is injected extremely frequently, you can throttle.
})();

