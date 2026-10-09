/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Css from './css.js';
import { Msg } from './msg.js';
import * as aria from './utils/aria.js';
import * as dom from './utils/dom.js';
import { Svg } from './utils/svg.js';
const CLASS_NAME = 'blocklyToast';
const MESSAGE_CLASS_NAME = 'blocklyToastMessage';
const CLOSE_BUTTON_CLASS_NAME = 'blocklyToastCloseButton';
/**
 * Class that allows for showing and dismissing temporary notifications.
 */
export class Toast {
    /**
     * Shows a toast notification.
     *
     * @param workspace The workspace to show the toast on.
     * @param options Configuration options for the toast message, duration, etc.
     */
    static show(workspace, options) {
        if (options.oncePerSession && options.id) {
            if (this.shownIds.has(options.id))
                return;
            this.shownIds.add(options.id);
        }
        // Clear any existing toasts.
        this.hide(workspace);
        const toast = this.createDom(workspace, options);
        // Animate the toast into view.
        requestAnimationFrame(() => {
            toast.style.bottom = '2rem';
        });
    }
    /**
     * Creates the DOM representation of a toast.
     *
     * @param workspace The workspace to inject the toast notification onto.
     * @param options Configuration options for the toast.
     * @returns The root DOM element of the toast.
     */
    static createDom(workspace, options) {
        const { message, duration = 5, assertiveness = Toast.Assertiveness.POLITE, } = options;
        const toast = document.createElement('div');
        workspace.getInjectionDiv().appendChild(toast);
        toast.dataset.toastId = options.id;
        toast.className = CLASS_NAME;
        aria.setRole(toast, aria.Role.STATUS);
        aria.setState(toast, aria.State.LIVE, assertiveness);
        const messageElement = toast.appendChild(document.createElement('div'));
        messageElement.className = MESSAGE_CLASS_NAME;
        messageElement.innerText = message;
        const closeButton = toast.appendChild(document.createElement('button'));
        closeButton.className = CLOSE_BUTTON_CLASS_NAME;
        aria.setState(closeButton, aria.State.LABEL, Msg['CLOSE']);
        const closeIcon = dom.createSvgElement(Svg.SVG, {
            width: 24,
            height: 24,
            viewBox: '0 0 24 24',
            fill: 'none',
        }, closeButton);
        aria.setState(closeIcon, aria.State.HIDDEN, true);
        dom.createSvgElement(Svg.RECT, {
            x: 19.7782,
            y: 2.80762,
            width: 2,
            height: 24,
            transform: 'rotate(45, 19.7782, 2.80762)',
            fill: 'black',
        }, closeIcon);
        dom.createSvgElement(Svg.RECT, {
            x: 2.80762,
            y: 4.22183,
            width: 2,
            height: 24,
            transform: 'rotate(-45, 2.80762, 4.22183)',
            fill: 'black',
        }, closeIcon);
        closeButton.addEventListener('click', () => {
            toast.remove();
            workspace.markFocused();
        });
        let timeout;
        const setToastTimeout = () => {
            timeout = setTimeout(() => toast.remove(), duration * 1000);
        };
        const clearToastTimeout = () => clearTimeout(timeout);
        toast.addEventListener('focusin', clearToastTimeout);
        toast.addEventListener('focusout', setToastTimeout);
        toast.addEventListener('mouseenter', clearToastTimeout);
        toast.addEventListener('mousemove', clearToastTimeout);
        toast.addEventListener('mouseleave', setToastTimeout);
        setToastTimeout();
        return toast;
    }
    /**
     * Dismiss a toast, e.g. in response to a user action.
     *
     * @param workspace The workspace to dismiss a toast in.
     * @param id The toast ID, or undefined to clear any toast.
     */
    static hide(workspace, id) {
        const toast = workspace.getInjectionDiv().querySelector(`.${CLASS_NAME}`);
        if (toast instanceof HTMLElement && (!id || id === toast.dataset.toastId)) {
            toast.remove();
        }
    }
}
/** IDs of toasts that have previously been shown. */
Toast.shownIds = new Set();
/**
 * Options for how aggressively toasts should be read out by screenreaders.
 * Values correspond to those for aria-live.
 */
(function (Toast) {
    let Assertiveness;
    (function (Assertiveness) {
        Assertiveness["ASSERTIVE"] = "assertive";
        Assertiveness["POLITE"] = "polite";
    })(Assertiveness = Toast.Assertiveness || (Toast.Assertiveness = {}));
})(Toast || (Toast = {}));
Css.register(`
.${CLASS_NAME} {
  font-size: 1.2rem;
  position: absolute;
  bottom: -10rem;
  right: 2rem;
  padding: 1rem;
  color: black;
  background-color: white;
  border: 2px solid black;
  border-radius: 0.4rem;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  line-height: 1.5;
  transition: bottom 0.3s ease-out;
}

.${CLASS_NAME} .${MESSAGE_CLASS_NAME} {
  maxWidth: 18rem;
}

.${CLASS_NAME} .${CLOSE_BUTTON_CLASS_NAME} {
  margin: 0;
  padding: 0.2rem;
  background-color: transparent;
  color: black;
  border: none;
  cursor: pointer;
}
`);
//# sourceMappingURL=toast.js.map