/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Enum of values for the .type property for event classes (concrete subclasses
 * of Abstract).
 */
export var EventType;
(function (EventType) {
    /** Type of event that creates a block. */
    EventType["BLOCK_CREATE"] = "create";
    /** Type of event that deletes a block. */
    EventType["BLOCK_DELETE"] = "delete";
    /** Type of event that changes a block. */
    EventType["BLOCK_CHANGE"] = "change";
    /**
     * Type of event representing an in-progress change to a field of a
     * block, which is expected to be followed by a block change event.
     */
    EventType["BLOCK_FIELD_INTERMEDIATE_CHANGE"] = "block_field_intermediate_change";
    /** Type of event that moves a block. */
    EventType["BLOCK_MOVE"] = "move";
    /** Type of event that creates a variable. */
    EventType["VAR_CREATE"] = "var_create";
    /** Type of event that deletes a variable. */
    EventType["VAR_DELETE"] = "var_delete";
    /** Type of event that renames a variable. */
    EventType["VAR_RENAME"] = "var_rename";
    /** Type of event that changes the type of a variable. */
    EventType["VAR_TYPE_CHANGE"] = "var_type_change";
    /**
     * Type of generic event that records a UI change.
     *
     * @deprecated Was only ever intended for internal use.
     */
    EventType["UI"] = "ui";
    /** Type of event that drags a block. */
    EventType["BLOCK_DRAG"] = "drag";
    /** Type of event that records a change in selected element. */
    EventType["SELECTED"] = "selected";
    /** Type of event that records a click. */
    EventType["CLICK"] = "click";
    /** Type of event that records a marker move. */
    EventType["MARKER_MOVE"] = "marker_move";
    /** Type of event that records a bubble open. */
    EventType["BUBBLE_OPEN"] = "bubble_open";
    /** Type of event that records a trashcan open. */
    EventType["TRASHCAN_OPEN"] = "trashcan_open";
    /** Type of event that records a toolbox item select. */
    EventType["TOOLBOX_ITEM_SELECT"] = "toolbox_item_select";
    /** Type of event that records a theme change. */
    EventType["THEME_CHANGE"] = "theme_change";
    /** Type of event that records a viewport change. */
    EventType["VIEWPORT_CHANGE"] = "viewport_change";
    /** Type of event that creates a comment. */
    EventType["COMMENT_CREATE"] = "comment_create";
    /** Type of event that deletes a comment. */
    EventType["COMMENT_DELETE"] = "comment_delete";
    /** Type of event that changes a comment. */
    EventType["COMMENT_CHANGE"] = "comment_change";
    /** Type of event that moves a comment. */
    EventType["COMMENT_MOVE"] = "comment_move";
    /** Type of event that resizes a comment. */
    EventType["COMMENT_RESIZE"] = "comment_resize";
    /**  Type of event that drags a comment. */
    EventType["COMMENT_DRAG"] = "comment_drag";
    /** Type of event that collapses a comment. */
    EventType["COMMENT_COLLAPSE"] = "comment_collapse";
    /** Type of event that records a workspace load. */
    EventType["FINISHED_LOADING"] = "finished_loading";
})(EventType || (EventType = {}));
/**
 * List of events that cause objects to be bumped back into the visible
 * portion of the workspace.
 *
 * Not to be confused with bumping so that disconnected connections do not
 * appear connected.
 */
export const BUMP_EVENTS = [
    EventType.BLOCK_CREATE,
    EventType.BLOCK_MOVE,
    EventType.COMMENT_CREATE,
    EventType.COMMENT_MOVE,
];
//# sourceMappingURL=type.js.map