/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Toast } from './toast.js';
const defaultAlert = function (message, opt_callback) {
    window.alert(message);
    if (opt_callback) {
        opt_callback();
    }
};
let alertImplementation = defaultAlert;
const defaultConfirm = function (message, callback) {
    callback(window.confirm(message));
};
let confirmImplementation = defaultConfirm;
const defaultPrompt = function (message, defaultValue, callback) {
    // NOTE TO DEVELOPER: Ephemeral focus doesn't need to be taken for the native
    // window prompt since it prevents focus from changing while open.
    callback(window.prompt(message, defaultValue));
};
let promptImplementation = defaultPrompt;
const defaultToast = Toast.show.bind(Toast);
let toastImplementation = defaultToast;
/**
 * Wrapper to window.alert() that app developers may override via setAlert to
 * provide alternatives to the modal browser window.
 *
 * @param message The message to display to the user.
 * @param opt_callback The callback when the alert is dismissed.
 */
export function alert(message, opt_callback) {
    alertImplementation(message, opt_callback);
}
/**
 * Sets the function to be run when Blockly.dialog.alert() is called.
 *
 * @param alertFunction The function to be run, or undefined to restore the
 *     default implementation.
 * @see Blockly.dialog.alert
 */
export function setAlert(alertFunction = defaultAlert) {
    alertImplementation = alertFunction;
}
/**
 * Wrapper to window.confirm() that app developers may override via setConfirm
 * to provide alternatives to the modal browser window.
 *
 * @param message The message to display to the user.
 * @param callback The callback for handling user response.
 */
export function confirm(message, callback) {
    confirmImplementation(message, callback);
}
/**
 * Sets the function to be run when Blockly.dialog.confirm() is called.
 *
 * @param confirmFunction The function to be run, or undefined to restore the
 *     default implementation.
 * @see Blockly.dialog.confirm
 */
export function setConfirm(confirmFunction = defaultConfirm) {
    confirmImplementation = confirmFunction;
}
/**
 * Wrapper to window.prompt() that app developers may override via setPrompt to
 * provide alternatives to the modal browser window. Built-in browser prompts
 * are often used for better text input experience on mobile device. We strongly
 * recommend testing mobile when overriding this.
 *
 * @param message The message to display to the user.
 * @param defaultValue The value to initialize the prompt with.
 * @param callback The callback for handling user response.
 */
export function prompt(message, defaultValue, callback) {
    promptImplementation(message, defaultValue, callback);
}
/**
 * Sets the function to be run when Blockly.dialog.prompt() is called.
 *
 * **Important**: When overridding this, be aware that non-native prompt
 * experiences may require managing ephemeral focus in FocusManager. This isn't
 * needed for the native window prompt because it prevents focus from being
 * changed while open.
 *
 * @param promptFunction The function to be run, or undefined to restore the
 *     default implementation.
 * @see Blockly.dialog.prompt
 */
export function setPrompt(promptFunction = defaultPrompt) {
    promptImplementation = promptFunction;
}
/**
 * Displays a temporary notification atop the workspace. Blockly provides a
 * default toast implementation, but developers may provide their own via
 * setToast. For simple appearance customization, CSS should be sufficient.
 *
 * @param workspace The workspace to display the toast notification atop.
 * @param options Configuration options for the notification, including its
 *     message and duration.
 */
export function toast(workspace, options) {
    toastImplementation(workspace, options);
}
/**
 * Sets the function to be run when Blockly.dialog.toast() is called.
 *
 * @param toastFunction The function to be run, or undefined to restore the
 *     default implementation.
 * @see Blockly.dialog.toast
 */
export function setToast(toastFunction = defaultToast) {
    toastImplementation = toastFunction;
}
//# sourceMappingURL=dialog.js.map