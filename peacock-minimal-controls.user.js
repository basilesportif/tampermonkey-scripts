// ==UserScript==
// @name         Peacock: remove bottom overlay: keep time and playback controls
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Keep playback scrubber/time + back10/play/forward10, remove all other controls + fade overlay + hover thumbnail
// @match        https://www.peacocktv.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';

  const STYLE_ID = 'tm-peacock-min-player-ui';

  const SEL = {
    overlayRoot: '.playback-overlay__container',
    upper: '.playback-overlay__container-upper-controls',

    scrubber: '.playback-scrubber-bar',
    time: '.playback-time-elapsed__container',

    controls: '.playback-controls__container',
    leftControls: '.playback-controls__container--left',
    centerControls: '.playback-controls__container--center',
    rightControls: '.playback-controls__container--right',

    back10: 'button.playback-button.backward',
    playPause: 'button.playback-button.play-pause',
    fwd10: 'button.playback-button.forward',

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

/* 2) Nuke hover thumbnail preview window */
${SEL.liveThumb},
${SEL.liveThumb} * {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* 3) Hide metadata */
${SEL.metadata} {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* 4) In upper controls, keep ONLY scrubber + time */
${SEL.upper} > *:not(${SEL.scrubber}):not(${SEL.time}) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* 5) Controls: keep ONLY center transport cluster, and inside it keep only 3 buttons */
${SEL.leftControls},
${SEL.rightControls} {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* Hide everything inside center controls except the 3 target buttons */
${SEL.centerControls} > *:not(${SEL.back10}):not(${SEL.playPause}):not(${SEL.fwd10}) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* Ensure the 3 buttons stay visible/clickable */
${SEL.centerControls} ${SEL.back10},
${SEL.centerControls} ${SEL.playPause},
${SEL.centerControls} ${SEL.fwd10} {
  display: inline-flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  z-index: 2147483647 !important;
}

/* 6) Force scrubber/time visible + clickable */
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

/* Pin time at bottom-right (move up so it doesn't collide with buttons) */
${SEL.time} {
  position: fixed !important;
  right: 12px !important;
  bottom: 64px !important; /* stacked above buttons */
  z-index: 2147483647 !important;
  white-space: nowrap !important;
}

/* Tuck the 3-button cluster to the right, BELOW the time (and above scrubber) */
${SEL.centerControls} {
  position: fixed !important;
  right: 12px !important;
  bottom: 34px !important; /* buttons line */
  z-index: 2147483647 !important;

  display: flex !important;
  gap: 10px !important;
  align-items: center !important;
  justify-content: flex-end !important;

  /* prevent any inherited wide layout */
  left: auto !important;
  transform: none !important;

  /* optional: shrink slightly to avoid crowding */
  transform: scale(0.85) !important;
  transform-origin: right center !important;
}

/* Let the overall controls container not block clicks */
${SEL.controls} {
  pointer-events: none !important;
}
${SEL.centerControls},
${SEL.centerControls} * {
  pointer-events: auto !important;
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
    // Remove the thumbnail preview node if Peacock inserts it dynamically
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

