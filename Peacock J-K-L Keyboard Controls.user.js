// ==UserScript==
// @name         Peacock J/K/L Keyboard Controls
// @namespace    peacock-jkl-keys
// @version      0.4.2
// @description  J = same as Left Arrow, K = play/pause, L = forward 5 seconds, U = back 30 seconds, O = forward 30 seconds. Controls the video directly, so it works on live matches even when the on-screen skip buttons are missing.
// @match        https://www.peacocktv.com/watch/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    const SKIP_SECONDS = 5;
    const LONG_SKIP_SECONDS = 30;

    const HANDLED_KEYS = ['j', 'k', 'l', 'u', 'o'];

    /*
     * Same selection rule as the Minimal Controls script:
     * the largest visible <video> on the page is the main feed.
     */
    function getActiveVideo() {
        return [...document.querySelectorAll('video')]
            .filter((video) => {
                const rect = video.getBoundingClientRect();
                const styles = getComputedStyle(video);

                return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    styles.display !== 'none' &&
                    styles.visibility !== 'hidden'
                );
            })
            .sort((a, b) => {
                const aRect = a.getBoundingClientRect();
                const bRect = b.getBoundingClientRect();

                return (
                    bRect.width * bRect.height -
                    aRect.width * aRect.height
                );
            })[0] || null;
    }

    /*
     * Start of the buffered chunk the playhead is currently in,
     * or null if the playhead isn't inside any buffered chunk.
     */
    function getBufferedStart(video) {
        const buffered = video.buffered;
        const now = video.currentTime;

        for (let i = 0; i < buffered.length; i++) {
            if (buffered.start(i) <= now && now <= buffered.end(i)) {
                return buffered.start(i);
            }
        }

        return null;
    }

    /*
     * Live streams only allow seeking inside the window Peacock
     * keeps available (video.seekable). Keep the target inside it.
     *
     * When going backwards, also stay inside video already downloaded
     * (video.buffered). Jumping back into video that isn't downloaded
     * makes Peacock's player re-fetch and resync, which shows up as
     * the stutter/skip on J.
     */
    function seekBy(video, seconds) {
        let target = video.currentTime + seconds;
        const range = video.seekable;

        if (range && range.length > 0) {
            const start = range.start(0);
            const end = range.end(range.length - 1);

            target = Math.min(Math.max(target, start), end);
        }

        if (seconds < 0) {
            const bufferedStart = getBufferedStart(video);

            if (bufferedStart !== null && target < bufferedStart) {
                target = bufferedStart + 0.1;
            }
        }

        video.currentTime = target;
    }

    /*
     * Hand the press to Peacock's own Left Arrow handler, which
     * seeks back correctly on live streams. The jump size is
     * whatever Peacock uses for Left Arrow.
     */
    function pressPeacockKey(key, keyCode) {
        /*
         * Always send from the page body, not the focused seek bar.
         * Sent through the seek bar, Peacock handles the press twice
         * (10 seconds instead of 5).
         */
        const target = document.body;
        const init = {
            key,
            code: key,
            keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true,
            composed: true,
        };

        target.dispatchEvent(new KeyboardEvent('keydown', init));
        target.dispatchEvent(new KeyboardEvent('keyup', init));
    }

    function togglePlayPause(video) {
        if (video.paused) {
            const result = video.play();

            if (result && typeof result.catch === 'function') {
                result.catch(() => {});
            }
        } else {
            video.pause();
        }
    }

    /*
     * Don't steal J/K/L while typing in a search box or other field.
     */
    function isTypingTarget(element) {
        if (!(element instanceof HTMLElement)) {
            return false;
        }

        /*
         * Only text-entry inputs count as typing. Peacock's seek bar
         * (a range slider) takes focus after a Left Arrow seek; it must
         * not count, or J/K/L stop working after the first J press.
         */
        const NON_TYPING_INPUTS = [
            'range', 'button', 'checkbox', 'radio',
            'submit', 'reset', 'image', 'color', 'file',
        ];

        if (element.tagName === 'INPUT') {
            return !NON_TYPING_INPUTS.includes(
                (element.type || '').toLowerCase()
            );
        }

        return (
            element.isContentEditable ||
            element.tagName === 'TEXTAREA' ||
            element.tagName === 'SELECT'
        );
    }

    function isOurKey(event) {
        if (event.ctrlKey || event.metaKey || event.altKey) {
            return false;
        }

        if (isTypingTarget(event.target)) {
            return false;
        }

        return HANDLED_KEYS.includes(event.key.toLowerCase());
    }

    /*
     * Listen on window (not document) in the capture phase so this runs
     * before any of Peacock's own key handlers, and also swallow the
     * matching keyup/keypress so Peacock never sees half a key press.
     */
    window.addEventListener('keydown', (event) => {
        if (!isOurKey(event)) {
            return;
        }

        const video = getActiveVideo();

        if (!video) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        const key = event.key.toLowerCase();

        if (key === 'j') {
            pressPeacockKey('ArrowLeft', 37);
        } else if (key === 'l') {
            seekBy(video, SKIP_SECONDS);
        } else if (key === 'u') {
            seekBy(video, -LONG_SKIP_SECONDS);
        } else if (key === 'o') {
            seekBy(video, LONG_SKIP_SECONDS);
        } else {
            togglePlayPause(video);
        }
    }, true);

    const swallow = (event) => {
        if (isOurKey(event) && getActiveVideo()) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    };

    window.addEventListener('keyup', swallow, true);
    window.addEventListener('keypress', swallow, true);
})();
