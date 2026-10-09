/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Class for a finished loading workspace event.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.FinishedLoading
import * as registry from '../registry.js';
import { Abstract as AbstractEvent } from './events_abstract.js';
import { EventType } from './type.js';
/**
 * Notifies listeners when the workspace has finished deserializing from
 * JSON/XML.
 */
export class FinishedLoading extends AbstractEvent {
    /**
     * @param opt_workspace The workspace that has finished loading.  Undefined
     *     for a blank event.
     */
    constructor(opt_workspace) {
        super();
        this.isBlank = true;
        this.recordUndo = false;
        this.type = EventType.FINISHED_LOADING;
        this.isBlank = !!opt_workspace;
        if (!opt_workspace)
            return;
        this.workspaceId = opt_workspace.id;
    }
}
registry.register(registry.Type.EVENT, EventType.FINISHED_LOADING, FinishedLoading);
//# sourceMappingURL=workspace_events.js.map