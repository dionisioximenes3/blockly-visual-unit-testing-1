/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Object in charge of managing markers and the cursor.
 *
 * @class
 */
// Former goog.module ID: Blockly.MarkerManager
import { LineCursor } from './keyboard_nav/line_cursor.js';
/**
 * Class to manage the multiple markers and the cursor on a workspace.
 */
export class MarkerManager {
    /**
     * @param workspace The workspace for the marker manager.
     * @internal
     */
    constructor(workspace) {
        this.workspace = workspace;
        /** The map of markers for the workspace. */
        this.markers = new Map();
        this.cursor = new LineCursor(this.workspace);
    }
    /**
     * Register the marker by adding it to the map of markers.
     *
     * @param id A unique identifier for the marker.
     * @param marker The marker to register.
     */
    registerMarker(id, marker) {
        if (this.markers.has(id)) {
            this.unregisterMarker(id);
        }
        this.markers.set(id, marker);
    }
    /**
     * Unregister the marker by removing it from the map of markers.
     *
     * @param id The ID of the marker to unregister.
     */
    unregisterMarker(id) {
        const marker = this.markers.get(id);
        if (marker) {
            marker.dispose();
            this.markers.delete(id);
        }
        else {
            throw Error('Marker with ID ' +
                id +
                ' does not exist. ' +
                'Can only unregister markers that exist.');
        }
    }
    /**
     * Get the cursor for the workspace.
     *
     * @returns The cursor for this workspace.
     */
    getCursor() {
        return this.cursor;
    }
    /**
     * Get a single marker that corresponds to the given ID.
     *
     * @param id A unique identifier for the marker.
     * @returns The marker that corresponds to the given ID, or null if none
     *     exists.
     */
    getMarker(id) {
        return this.markers.get(id) || null;
    }
    /**
     * Sets the cursor and initializes the drawer for use with keyboard
     * navigation.
     *
     * @param cursor The cursor used to move around this workspace.
     */
    setCursor(cursor) {
        this.cursor = cursor;
    }
    /**
     * Dispose of the marker manager.
     * Go through and delete all markers associated with this marker manager.
     *
     * @internal
     */
    dispose() {
        const markerIds = Object.keys(this.markers);
        for (let i = 0, markerId; (markerId = markerIds[i]); i++) {
            this.unregisterMarker(markerId);
        }
        this.markers.clear();
        this.cursor.dispose();
    }
}
/** The name of the local marker. */
MarkerManager.LOCAL_MARKER = 'local_marker_1';
//# sourceMappingURL=marker_manager.js.map