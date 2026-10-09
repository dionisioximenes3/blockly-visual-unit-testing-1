/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventType } from './type.js';
/** @returns true iff event.type is EventType.BLOCK_CREATE */
export function isBlockCreate(event) {
    return event.type === EventType.BLOCK_CREATE;
}
/** @returns true iff event.type is EventType.BLOCK_DELETE */
export function isBlockDelete(event) {
    return event.type === EventType.BLOCK_DELETE;
}
/** @returns true iff event.type is EventType.BLOCK_CHANGE */
export function isBlockChange(event) {
    return event.type === EventType.BLOCK_CHANGE;
}
/** @returns true iff event.type is EventType.BLOCK_FIELD_INTERMEDIATE_CHANGE */
export function isBlockFieldIntermediateChange(event) {
    return event.type === EventType.BLOCK_FIELD_INTERMEDIATE_CHANGE;
}
/** @returns true iff event.type is EventType.BLOCK_MOVE */
export function isBlockMove(event) {
    return event.type === EventType.BLOCK_MOVE;
}
/** @returns true iff event.type is EventType.VAR_CREATE */
export function isVarCreate(event) {
    return event.type === EventType.VAR_CREATE;
}
/** @returns true iff event.type is EventType.VAR_DELETE */
export function isVarDelete(event) {
    return event.type === EventType.VAR_DELETE;
}
/** @returns true iff event.type is EventType.VAR_RENAME */
export function isVarRename(event) {
    return event.type === EventType.VAR_RENAME;
}
/** @returns true iff event.type is EventType.BLOCK_DRAG */
export function isBlockDrag(event) {
    return event.type === EventType.BLOCK_DRAG;
}
/** @returns true iff event.type is EventType.SELECTED */
export function isSelected(event) {
    return event.type === EventType.SELECTED;
}
/** @returns true iff event.type is EventType.CLICK */
export function isClick(event) {
    return event.type === EventType.CLICK;
}
/** @returns true iff event.type is EventType.BUBBLE_OPEN */
export function isBubbleOpen(event) {
    return event.type === EventType.BUBBLE_OPEN;
}
/** @returns true iff event.type is EventType.TRASHCAN_OPEN */
export function isTrashcanOpen(event) {
    return event.type === EventType.TRASHCAN_OPEN;
}
/** @returns true iff event.type is EventType.TOOLBOX_ITEM_SELECT */
export function isToolboxItemSelect(event) {
    return event.type === EventType.TOOLBOX_ITEM_SELECT;
}
/** @returns true iff event.type is EventType.THEME_CHANGE */
export function isThemeChange(event) {
    return event.type === EventType.THEME_CHANGE;
}
/** @returns true iff event.type is EventType.VIEWPORT_CHANGE */
export function isViewportChange(event) {
    return event.type === EventType.VIEWPORT_CHANGE;
}
/** @returns true iff event.type is EventType.COMMENT_CREATE */
export function isCommentCreate(event) {
    return event.type === EventType.COMMENT_CREATE;
}
/** @returns true iff event.type is EventType.COMMENT_DELETE */
export function isCommentDelete(event) {
    return event.type === EventType.COMMENT_DELETE;
}
/** @returns true iff event.type is EventType.COMMENT_CHANGE */
export function isCommentChange(event) {
    return event.type === EventType.COMMENT_CHANGE;
}
/** @returns true iff event.type is EventType.COMMENT_MOVE */
export function isCommentMove(event) {
    return event.type === EventType.COMMENT_MOVE;
}
/** @returns true iff event.type is EventType.COMMENT_RESIZE */
export function isCommentResize(event) {
    return event.type === EventType.COMMENT_RESIZE;
}
/** @returns true iff event.type is EventType.COMMENT_DRAG */
export function isCommentDrag(event) {
    return event.type === EventType.COMMENT_DRAG;
}
/** @returns true iff event.type is EventType.COMMENT_COLLAPSE */
export function isCommentCollapse(event) {
    return event.type === EventType.COMMENT_COLLAPSE;
}
/** @returns true iff event.type is EventType.FINISHED_LOADING */
export function isFinishedLoading(event) {
    return event.type === EventType.FINISHED_LOADING;
}
//# sourceMappingURL=predicates.js.map