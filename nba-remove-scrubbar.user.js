// ==UserScript==
// @name         NBA.com: remove time controls
// @namespace    https://www.nba.com/
// @version      1.0
// @description  Removes the playback/time control cluster (play/pause, skip/jump, etc.) from NBA.com video overlay
// @match        https://www.nba.com/*
// @match        https://nba.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  function removeScrubControls() {
    // Most stable anchors:
    // - the range input has a stable data-id
    // - progress bar container has an id
    const scrub = document.querySelector('input[type="range"][data-id="video-player:scrub-bar:controls"]')
               || document.querySelector('#progress-bar-container')
               || document.querySelector('#progress-bar');

    if (!scrub) return false;

    // Remove the smallest ancestor that clearly corresponds to the scrub/time row.
    // We'll walk up and pick the first ancestor that contains #progress-bar-container
    // (or the scrub input) AND looks like a dedicated block (has a progress element).
    let node = scrub instanceof HTMLElement ? scrub : scrub.parentElement;
    while (node && node !== document.documentElement) {
      const hasProgress = !!node.querySelector('progress#progress-bar, progress');
      const hasRange = !!node.querySelector('input[type="range"][data-id="video-player:scrub-bar:controls"]');
      const hasContainer = !!node.querySelector('#progress-bar-container');

      // This combo is a good signal we're at the right wrapper
      if ((hasRange || scrub.matches?.('#progress-bar-container, #progress-bar')) && (hasProgress || hasContainer)) {
        // Prefer removing the wrapper around the whole scrub bar row
        node.remove();
        return true;
      }

      node = node.parentElement;
    }

    // Fallback: remove the specific parts if we couldn't find a nice wrapper
    document.querySelectorAll('#progress-bar-container, progress#progress-bar, input[type="range"][data-id="video-player:scrub-bar:controls"]')
      .forEach((el) => el.remove());

    return true;
  }

  // Run ASAP
  removeScrubControls();

  // Keep removing if NBA.com re-renders
  const obs = new MutationObserver(() => {
    removeScrubControls();
  });

  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
