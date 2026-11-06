// ==UserScript==
// @name         Paramount+ - J/K/L player keys
// @namespace    https://tampermonkey.net/
// @version      1.2
// @description  J = back 5s, K = play/pause, L = forward 5s
// @match        https://www.paramountplus.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  console.log('TM (J/K/L keys) running on', location.href);

  const SKIP_SECONDS = 5;

  const KEY_MAP = {
    j: 'button[data-controls="rewind"]',
    k: 'button[data-controls="play-pause"]',
    l: 'button[data-controls="fast-forward"]',
  };

  function isTyping(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  // The largest visible <video> on the page is the main feed.
  function getActiveVideo() {
    return [...document.querySelectorAll('video')]
      .filter((v) => {
        const r = v.getBoundingClientRect();
        const s = getComputedStyle(v);
        return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
      })
      .sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return rb.width * rb.height - ra.width * ra.height;
      })[0] || null;
  }

  // Move the video by `seconds`, staying inside the seekable range.
  function seekBy(video, seconds) {
    let target = video.currentTime + seconds;
    const range = video.seekable;
    if (range && range.length > 0) {
      const start = range.start(0);
      const end = range.end(range.length - 1);
      target = Math.min(Math.max(target, start), end);
    }
    video.currentTime = target;
  }

  function handle(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTyping(e.target)) return;

    const key = (e.key || '').toLowerCase();
    const selector = KEY_MAP[key];
    if (!selector) return;

    const button = document.querySelector(selector);
    if (!button) return; // not on a player page; let the key behave normally

    // Stop the site's own handler for this key
    e.preventDefault();
    e.stopImmediatePropagation();

    // Act once, on keydown only (ignore auto-repeat for play/pause)
    if (e.type === 'keydown') {
      if (key === 'k') {
        if (e.repeat) return;
        button.click();
        return;
      }

      const video = getActiveVideo();
      if (!video) {
        button.click(); // no video found: fall back to the 10s button
        return;
      }
      seekBy(video, key === 'j' ? -SKIP_SECONDS : SKIP_SECONDS);
    }
  }

  // Capture phase on window so this runs before the player's handlers
  window.addEventListener('keydown', handle, true);
  window.addEventListener('keyup', handle, true);
  window.addEventListener('keypress', handle, true);
})();
