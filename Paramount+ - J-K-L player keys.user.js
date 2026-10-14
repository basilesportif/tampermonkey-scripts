// ==UserScript==
// @name         Paramount+ - J/K/L player keys
// @namespace    https://tampermonkey.net/
// @version      1.1
// @description  J = back 10s, K = play/pause, L = forward 10s, using the player's own buttons
// @match        https://www.paramountplus.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  console.log('TM (J/K/L keys) running on', location.href);

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
      if (key === 'k' && e.repeat) return;
      button.click();
    }
  }

  // Capture phase on window so this runs before the player's handlers
  window.addEventListener('keydown', handle, true);
  window.addEventListener('keyup', handle, true);
  window.addEventListener('keypress', handle, true);
})();