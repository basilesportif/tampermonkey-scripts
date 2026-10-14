// ==UserScript==
// @name         Paramount+ - hide replay pause ad
// @namespace    https://tampermonkey.net/
// @version      1.2
// @description  Hides the pause-screen ad, dimming, and return button on paramountplus.com replays
// @match        https://www.paramountplus.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  console.log('TM (replay pause ad) running on', location.href);

  const style = document.createElement('style');
  style.textContent = `
    .pause-panel-ad-container { display: none !important; }
    .pause-panel-background { display: none !important; }
    .pause-panel-return-button { display: none !important; }
  `;
  (document.head || document.documentElement).appendChild(style);
})();