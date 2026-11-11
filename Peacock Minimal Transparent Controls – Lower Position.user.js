// ==UserScript==
// @name         Peacock Minimal Transparent Controls – Lower Position
// @namespace    peacock-minimal-controls
// @version      0.2.4
// @description  Removes Peacock's dark playback overlay, keeps only the scrubber, time, play/pause, and 10-second buttons, and moves them closer to the bottom. Works on both live and replay (VOD) players.
// @match        https://www.peacocktv.com/watch/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    /*
     * Final positioning:
     *
     * Scrubber/time bar: 48 pixels lower
     * Playback buttons: 24 pixels lower
     */
    const SCRUBBER_SHIFT_PX = 90;
    const BUTTON_SHIFT_PX = 30;

    const STYLE_ID = 'tm-peacock-minimal-controls-style';

    /*
     * "Play" must also be preserved because the Pause button changes
     * into a Play button whenever the video is paused.
     */
    const KEEP_BUTTON_PATTERN =
        /\b(play|pause)\b|(?:rewind|replay|back|backward|forward|skip|seek).{0,30}\b10\b|\b10\b.{0,30}(?:second|seconds|sec)\b/i;

    /*
     * ADDED (0.2.4): Also keep the settings / audio & subtitles
     * button so the broadcast language can be changed. Kept
     * separate from KEEP_BUTTON_PATTERN so that pattern is unchanged.
     * Plain "audio" is deliberately not matched, so the volume/mute
     * button stays hidden.
     */
    const KEEP_SETTINGS_PATTERN =
        /\b(settings?|subtitles?|captions?|languages?)\b|\baudio\s*(?:&|and|\/)\s*(?:subtitles?|captions?)\b/i;

    let updateScheduled = false;

    function installStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `
            /*
             * Remove Peacock's black or darkened playback overlay.
             */
            [data-tm-peacock-no-shade="true"] {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                box-shadow: none !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
            }

            [data-tm-peacock-no-shade="true"]::before,
            [data-tm-peacock-no-shade="true"]::after {
                content: none !important;
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                box-shadow: none !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
            }

            /*
             * Hide the title, episode information, description,
             * metadata, and scrubber thumbnail.
             */
            [data-testid="playback-upper-controls"] h1,
            [data-testid="playback-upper-controls"] ul,
            [data-testid="playback-upper-controls"] p:not(:has(time)),
            [data-testid="playback-upper-controls"] img,
            [data-testid="playback-upper-controls"] [data-testid="metadata-title"],
            [data-testid="playback-upper-controls"] [data-testid="metadata"],
            [data-testid="playback-upper-controls"] [data-testid="metadata-description"],
            [data-tm-peacock-hide="true"] {
                display: none !important;
            }

            /*
             * Move the scrubber and elapsed-time display down,
             * closer to the playback buttons.
             */
            [data-testid="playback-upper-controls"] {
                position: relative !important;
                top: ${SCRUBBER_SHIFT_PX}px !important;
            }

            /*
             * Hide every playback button except Play/Pause,
             * Back 10 Seconds, and Forward 10 Seconds.
             */
            [data-tm-peacock-hide-button="true"] {
                display: none !important;
            }

            /*
             * Preserve the desired playback buttons and move them
             * farther down toward the bottom of the screen.
             */
            [data-tm-peacock-keep-button="true"] {
                display: inline-flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                top: ${BUTTON_SHIFT_PX}px !important;
            }

            /*
             * FIX (0.2.3): The replay (VOD) player puts Play/Pause
             * inline with the scrubber, so the live-player button
             * shift would misalign it. Cancel the shift there only.
             */
            [data-testid="pff-scrubber"] [data-tm-peacock-keep-button="true"] {
                top: 0 !important;
            }

            /*
             * Explicitly preserve the scrubber and playback times.
             */
            [data-testid="scrubber-bar"],
            [data-testid="elapsed-time"],
            [data-testid="duration-time"] {
                visibility: visible !important;
                opacity: 1 !important;
            }

            /*
             * FIX (0.2.2): Shifting playback-upper-controls down by
             * SCRUBBER_SHIFT_PX moves the scrubber visually into the
             * space occupied by playback-lower-controls, which is
             * NOT shifted and sits later in paint order. Its empty
             * grid cells (pointer-events: auto) were absorbing the
             * pointerdown before it could reach the scrubber
             * underneath. Make the container itself pass clicks
             * through, while keeping its own buttons clickable.
             */
            [data-testid="playback-lower-controls"] {
                pointer-events: none !important;
            }

            [data-testid="playback-lower-controls"] button,
            [data-testid="playback-lower-controls"] [role="button"],
            [data-testid="playback-lower-controls"] [role="slider"] {
                pointer-events: auto !important;
            }
        `;

        (document.head || document.documentElement).appendChild(style);
    }

    function isVisible(element) {
        if (!(element instanceof HTMLElement)) {
            return false;
        }

        const rect = element.getBoundingClientRect();
        const styles = getComputedStyle(element);

        return (
            rect.width > 0 &&
            rect.height > 0 &&
            styles.display !== 'none' &&
            styles.visibility !== 'hidden'
        );
    }

    function getActiveVideo() {
        return [...document.querySelectorAll('video')]
            .filter(isVisible)
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
     * Find the nearest shared container containing both the video
     * and Peacock's playback controls.
     */
    function findPlayerRoot(controls, video) {
        let current = controls;

        while (
            current &&
            current !== document.body &&
            current !== document.documentElement
        ) {
            if (!video || current.contains(video)) {
                return current;
            }

            current = current.parentElement;
        }

        return controls.parentElement || controls;
    }

    /*
     * Make every container between the controls and player root
     * transparent. Peacock may put the dark gradient on any one
     * of these containers.
     */
    function markControlAncestorsTransparent(controls, playerRoot) {
        let current = controls;

        while (
            current &&
            current !== document.body &&
            current !== document.documentElement
        ) {
            current.setAttribute('data-tm-peacock-no-shade', 'true');

            if (current === playerRoot) {
                break;
            }

            current = current.parentElement;
        }
    }

    function parseBackgroundColor(color) {
        const match = color.match(
            /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*[,/]\s*(\d*\.?\d+)%?)?\s*\)/
        );

        if (!match) {
            return null;
        }

        let alpha = 1;

        if (match[4] !== undefined) {
            alpha = match[4].includes('%')
                ? Number.parseFloat(match[4]) / 100
                : Number.parseFloat(match[4]);
        }

        return {
            red: Number(match[1]),
            green: Number(match[2]),
            blue: Number(match[3]),
            alpha
        };
    }

    function isDarkBackground(styles) {
        const color = parseBackgroundColor(styles.backgroundColor);

        if (
            color &&
            color.alpha > 0.05 &&
            color.red < 80 &&
            color.green < 80 &&
            color.blue < 80
        ) {
            return true;
        }

        return Boolean(
            styles.backgroundImage &&
            styles.backgroundImage !== 'none'
        );
    }

    function hasPseudoElementShade(element, pseudoElement) {
        const styles = getComputedStyle(element, pseudoElement);

        return (
            isDarkBackground(styles) ||
            Boolean(
                styles.backdropFilter &&
                styles.backdropFilter !== 'none'
            ) ||
            Boolean(
                styles.webkitBackdropFilter &&
                styles.webkitBackdropFilter !== 'none'
            )
        );
    }

    function getOverlapRatio(elementRect, videoRect) {
        const left = Math.max(elementRect.left, videoRect.left);
        const right = Math.min(elementRect.right, videoRect.right);
        const top = Math.max(elementRect.top, videoRect.top);
        const bottom = Math.min(elementRect.bottom, videoRect.bottom);

        if (right <= left || bottom <= top) {
            return 0;
        }

        const overlapArea = (right - left) * (bottom - top);
        const videoArea = videoRect.width * videoRect.height;

        return videoArea > 0 ? overlapArea / videoArea : 0;
    }

    /*
     * Identify and neutralize any large dark or gradient element
     * covering a substantial portion of the video.
     */
    function neutralizeLargeOverlayLayers(playerRoot, video) {
        if (!video) {
            return;
        }

        const videoRect = video.getBoundingClientRect();

        if (videoRect.width < 100 || videoRect.height < 100) {
            return;
        }

        const candidates = [
            playerRoot,
            ...playerRoot.querySelectorAll('div, section, aside')
        ];

        for (const element of candidates) {
            if (
                element === video ||
                element instanceof HTMLVideoElement ||
                element instanceof HTMLCanvasElement ||
                element instanceof HTMLImageElement
            ) {
                continue;
            }

            const rect = element.getBoundingClientRect();
            const overlapRatio = getOverlapRatio(rect, videoRect);

            /*
             * Ignore small elements such as buttons, subtitles,
             * tooltips, and menus.
             */
            if (overlapRatio < 0.45) {
                continue;
            }

            const styles = getComputedStyle(element);

            const hasBackdrop =
                Boolean(
                    styles.backdropFilter &&
                    styles.backdropFilter !== 'none'
                ) ||
                Boolean(
                    styles.webkitBackdropFilter &&
                    styles.webkitBackdropFilter !== 'none'
                );

            const createsShade =
                isDarkBackground(styles) ||
                hasBackdrop ||
                hasPseudoElementShade(element, '::before') ||
                hasPseudoElementShade(element, '::after');

            if (createsShade) {
                element.setAttribute(
                    'data-tm-peacock-no-shade',
                    'true'
                );
            }
        }
    }

    function hideMetadataSection(upperControls) {
        const title = upperControls.querySelector(
            '[data-testid="metadata-title"]'
        );

        if (!title) {
            return;
        }

        /*
         * Hide the complete title/description branch while leaving
         * the scrubber branch visible.
         */
        let metadataBranch = title;

        while (
            metadataBranch.parentElement &&
            metadataBranch.parentElement !== upperControls
        ) {
            metadataBranch = metadataBranch.parentElement;
        }

        if (metadataBranch.parentElement === upperControls) {
            metadataBranch.setAttribute(
                'data-tm-peacock-hide',
                'true'
            );
        }
    }

    function describeControl(element) {
        return [
            element.getAttribute('aria-label'),
            element.getAttribute('title'),
            element.getAttribute('data-testid'),
            element.getAttribute('data-test-id'),
            element.getAttribute('name'),
            element.textContent
        ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /*
     * FIX (0.2.1): Some player UIs implement the scrubber's drag
     * handle as a <button role="slider"> (for keyboard/screen
     * reader accessibility) rather than as part of the track div.
     * That button's accessible name (e.g. "Seek slider", "Video
     * progress") does not match KEEP_BUTTON_PATTERN, so the generic
     * button filter below was hiding it with display:none, which
     * removes it from hit-testing and makes it impossible to grab
     * and drag. This check exempts slider controls, and anything
     * inside the scrubber bar itself, from being hidden.
     */
    function isSliderControl(element) {
        if (element.getAttribute('role') === 'slider') {
            return true;
        }

        return Boolean(
            element.closest('[data-testid="scrubber-bar"]')
        );
    }

    /*
     * ADDED (0.2.4): Buttons inside the settings menu (language
     * choices, close, back) must not be hidden either, or the menu
     * opens empty. Leave anything inside a menu/dialog alone.
     */
    function isMenuControl(element) {
        const role = element.getAttribute('role');

        if (/^(menuitem|menuitemradio|menuitemcheckbox|option|radio|checkbox|tab)$/.test(role || '')) {
            return true;
        }

        return Boolean(
            element.closest(
                '[role="dialog"], [role="menu"], [role="listbox"], [role="radiogroup"], [role="tablist"], [aria-modal="true"]'
            )
        );
    }

    function filterButtons(playerRoot) {
        const buttons = playerRoot.querySelectorAll('button');

        for (const button of buttons) {
            if (isSliderControl(button) || isMenuControl(button)) {
                /*
                 * Leave slider/scrubber controls completely alone -
                 * don't hide them, and don't apply the button
                 * down-shift either, since that's meant for the
                 * separate play/pause/±10s row and would misalign
                 * the handle from the track.
                 */
                button.removeAttribute(
                    'data-tm-peacock-hide-button'
                );
                button.removeAttribute(
                    'data-tm-peacock-keep-button'
                );
                continue;
            }

            const description = describeControl(button);

            if (
                KEEP_BUTTON_PATTERN.test(description) ||
                KEEP_SETTINGS_PATTERN.test(description)
            ) {
                button.removeAttribute(
                    'data-tm-peacock-hide-button'
                );

                button.setAttribute(
                    'data-tm-peacock-keep-button',
                    'true'
                );
            } else {
                button.removeAttribute(
                    'data-tm-peacock-keep-button'
                );

                button.setAttribute(
                    'data-tm-peacock-hide-button',
                    'true'
                );
            }
        }
    }

    function applyChanges() {
        updateScheduled = false;
        installStyles();

        /*
         * FIX (0.2.3): The live player exposes
         * playback-upper-controls; the replay (VOD) player does not
         * and uses pff-scrubber instead. Without this fallback the
         * script returned early on replay and did nothing.
         */
        const upperControls =
            document.querySelector(
                '[data-testid="playback-upper-controls"]'
            ) ||
            document.querySelector(
                '[data-testid="pff-scrubber"]'
            );

        if (!upperControls) {
            return;
        }

        const video = getActiveVideo();
        const playerRoot = findPlayerRoot(upperControls, video);

        hideMetadataSection(upperControls);
        markControlAncestorsTransparent(
            upperControls,
            playerRoot
        );
        neutralizeLargeOverlayLayers(playerRoot, video);
        filterButtons(playerRoot);
    }

    function scheduleUpdate() {
        if (updateScheduled) {
            return;
        }

        updateScheduled = true;
        requestAnimationFrame(applyChanges);
    }

    function start() {
        installStyles();
        scheduleUpdate();

        /*
         * Peacock dynamically rebuilds its controls, so watch for
         * changes and reapply the modifications automatically.
         */
        const observer = new MutationObserver(scheduleUpdate);

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: [
                'class',
                'style',
                'aria-label',
                'data-testid'
            ]
        });

        /*
         * Backup check for player changes that do not trigger
         * an observable DOM mutation.
         */
        window.setInterval(scheduleUpdate, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, {
            once: true
        });
    } else {
        start();
    }
})();