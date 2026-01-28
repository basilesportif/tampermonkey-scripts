// ==UserScript==
// @name         Peacock: remove bottom overlay except time bar
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Keep playback scrubber/time, remove all other controls + fade overlay
// @match        https://www.peacocktv.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';

  const STYLE_ID = 'tm-keep-only-timebar';

  const SEL = {
    overlayRoot: '.playback-overlay__container',
    upper: '.playback-overlay__container-upper-controls',
    scrubber: '.playback-scrubber-bar',
    time: '.playback-time-elapsed__container',
    controls: '.playback-controls__container',
    metadata: '.playback-metadata__container',
    liveThumb: '.playback-scrubber-live-thumbnail',
  };

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
/* 1) Remove fade-to-black overlay */
${SEL.overlayRoot},
${SEL.upper} {
  background: transparent !important;
  box-shadow: none !important;
  filter: none !important;
}
${SEL.overlayRoot}::before,
${SEL.overlayRoot}::after,
${SEL.upper}::before,
${SEL.upper}::after {
  content: none !important;
  background: transparent !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* 2) Nuke thumbnail preview window */
${SEL.liveThumb},
${SEL.liveThumb} * {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* 3) Remove all other controls/metadata */
${SEL.controls},
${SEL.metadata} {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* Hide everything in upper controls except scrubber + time */
${SEL.upper} > *:not(${SEL.scrubber}):not(${SEL.time}) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* 4) Force scrubber/time visible + clickable */
${SEL.scrubber},
${SEL.time},
${SEL.scrubber} *,
${SEL.time} * {
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

/* Pin scrubber to bottom */
${SEL.scrubber} {
  position: fixed !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 10px !important;
  z-index: 2147483647 !important;
}

/* Put time text above bar */
${SEL.time} {
  position: fixed !important;
  right: 12px !important;
  bottom: 34px !important;
  z-index: 2147483647 !important;
}

${SEL.upper} {
  padding: 0 !important;
  margin: 0 !important;
}
    `.trim();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.documentElement.appendChild(style);
  }

  function removeElements(selectors) {
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => el.remove());
    }
  }

  function apply() {
    injectCss();

    // Remove thumbnail preview nodes if the app inserts them dynamically
    removeElements([SEL.liveThumb]);
  }

  function observe() {
    const mo = new MutationObserver(() => apply());
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  }

  apply();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { apply(); observe(); }, { once: true });
  } else {
    observe();
  }
})();
