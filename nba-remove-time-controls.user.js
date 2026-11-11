// ==UserScript==
// @name         NBA.com: remove time controls
// @namespace    https://www.nba.com/
// @version      1.2
// @description  Removes the playback/time control cluster from NBA.com video overlay; J/L seek 5s instead of 10s
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

// ---- Added in 1.1: J / L seek 5 seconds instead of the site's 10 ----
// Separate block so the original code above is untouched.
(function () {
  'use strict';

  const SEEK_SECONDS = 5;

  function isTyping(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  // Pick the main video: prefer one that's playing, otherwise the largest on screen.
  function findVideo() {
    const videos = Array.from(document.querySelectorAll('video'));
    if (videos.length === 0) return null;
    const playing = videos.find((v) => !v.paused && v.readyState > 1);
    if (playing) return playing;
    return videos.reduce((best, v) => {
      const area = v.offsetWidth * v.offsetHeight;
      const bestArea = best ? best.offsetWidth * best.offsetHeight : -1;
      return area > bestArea ? v : best;
    }, null);
  }

  function isJorL(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    const k = (e.key || '').toLowerCase();
    return k === 'j' || k === 'l';
  }

  // True only if time t is inside video that has already been downloaded.
  // Seeking outside this range behind the player's back is what froze it.
  function isBuffered(video, t) {
    const b = video.buffered;
    for (let i = 0; i < b.length; i++) {
      if (t >= b.start(i) && t <= b.end(i) - 0.5) return true;
    }
    return false;
  }

  // Remembers which keys we took over on keydown, so we only block
  // the matching keyup/keypress for those (otherwise the site gets them all).
  const handled = new Set();

  function handler(e) {
    if (!isJorL(e) || isTyping(e.target)) return;
    const k = e.key.toLowerCase();

    if (e.type !== 'keydown') {
      if (handled.has(k)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.type === 'keyup') handled.delete(k);
      }
      return;
    }

    handled.delete(k);
    const video = findVideo();
    if (!video) return; // no video: let the key behave normally

    const t = video.currentTime + (k === 'l' ? SEEK_SECONDS : -SEEK_SECONDS);

    // Not loaded yet: do nothing, let NBA.com do its normal 10-second jump
    if (!isBuffered(video, t)) return;

    // Loaded: block the site's 10-second jump and move 5 seconds ourselves
    e.preventDefault();
    e.stopImmediatePropagation();
    handled.add(k);
    video.currentTime = t;
  }

  // Capture phase on window runs before any page listeners
  ['keydown', 'keypress', 'keyup'].forEach((type) => {
    window.addEventListener(type, handler, true);
  });
})();
