/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as registry from '../registry.js';
import { VarBase } from './events_var_base.js';
import { EventType } from './type.js';
/**
 * Notifies listeners that a variable model was renamed.
 */
export class VarRename extends VarBase {
    /**
     * @param opt_variable The renamed variable. Undefined for a blank event.
     * @param newName The new name the variable will be changed to.
     */
    constructor(opt_variable, newName) {
        super(opt_variable);
        this.type = EventType.VAR_RENAME;
        if (!opt_variable) {
            return; // Blank event to be populated by fromJson.
        }
        this.oldName = opt_variable.getName();
        this.newName = typeof newName === 'undefined' ? '' : newName;
    }
    /**
     * Encode the event as JSON.
     *
     * @returns JSON representation.
     */
    toJson() {
        const json = super.toJson();
        if (!this.oldName) {
            throw new Error('The old var name is undefined. Either pass a variable to ' +
                'the constructor, or call fromJson');
        }
        if (!this.newName) {
            throw new Error('The new var name is undefined. Either pass a value to ' +
                'the constructor, or call fromJson');
        }
        json['oldName'] = this.oldName;
        json['newName'] = this.newName;
        return json;
    }
    /**
     * Deserializes the JSON event.
     *
     * @param event The event to append new properties to. Should be a subclass
     *     of VarRename, but we can't specify that due to the fact that parameters
     *     to static methods in subclasses must be supertypes of parameters to
     *     static methods in superclasses.
     * @internal
     */
    static fromJson(json, workspace, event) {
        const newEvent = super.fromJson(json, workspace, event ?? new VarRename());
        newEvent.oldName = json['oldName'];
        newEvent.newName = json['newName'];
        return newEvent;
    }
    /**
     * Run a variable rename event.
     *
     * @param forward True if run forward, false if run backward (undo).
     */
    run(forward) {
        const workspace = this.getEventWorkspace_();
        if (!this.varId) {
            throw new Error('The var ID is undefined. Either pass a variable to ' +
                'the constructor, or call fromJson');
        }
        if (!this.oldName) {
            throw new Error('The old var name is undefined. Either pass a variable to ' +
                'the constructor, or call fromJson');
        }
        if (!this.newName) {
            throw new Error('The new var name is undefined. Either pass a value to ' +
                'the constructor, or call fromJson');
        }
        const variableMap = workspace.getVariableMap();
        const variable = variableMap.getVariableById(this.varId);
        if (forward) {
            if (variable)
                variableMap.renameVariable(variable, this.newName);
        }
        else {
            if (variable)
                variableMap.renameVariable(variable, this.oldName);
        }
    }
}
registry.register(registry.Type.EVENT, EventType.VAR_RENAME, VarRename);
//# sourceMappingURL=events_var_rename.js.map