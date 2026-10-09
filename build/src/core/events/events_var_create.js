/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as registry from '../registry.js';
import { VarBase } from './events_var_base.js';
import { EventType } from './type.js';
/**
 * Notifies listeners that a variable model has been created.
 */
export class VarCreate extends VarBase {
    /**
     * @param opt_variable The created variable. Undefined for a blank event.
     */
    constructor(opt_variable) {
        super(opt_variable);
        this.type = EventType.VAR_CREATE;
        if (!opt_variable) {
            return; // Blank event to be populated by fromJson.
        }
        this.varType = opt_variable.getType();
        this.varName = opt_variable.getName();
    }
    /**
     * Encode the event as JSON.
     *
     * @returns JSON representation.
     */
    toJson() {
        const json = super.toJson();
        if (this.varType === undefined) {
            throw new Error('The var type is undefined. Either pass a variable to ' +
                'the constructor, or call fromJson');
        }
        if (!this.varName) {
            throw new Error('The var name is undefined. Either pass a variable to ' +
                'the constructor, or call fromJson');
        }
        json['varType'] = this.varType;
        json['varName'] = this.varName;
        return json;
    }
    /**
     * Deserializes the JSON event.
     *
     * @param event The event to append new properties to. Should be a subclass
     *     of VarCreate, but we can't specify that due to the fact that parameters
     *     to static methods in subclasses must be supertypes of parameters to
     *     static methods in superclasses.
     * @internal
     */
    static fromJson(json, workspace, event) {
        const newEvent = super.fromJson(json, workspace, event ?? new VarCreate());
        newEvent.varType = json['varType'];
        newEvent.varName = json['varName'];
        return newEvent;
    }
    /**
     * Run a variable creation event.
     *
     * @param forward True if run forward, false if run backward (undo).
     */
    run(forward) {
        const workspace = this.getEventWorkspace_();
        if (!this.varId) {
            throw new Error('The var ID is undefined. Either pass a variable to ' +
                'the constructor, or call fromJson');
        }
        if (!this.varName) {
            throw new Error('The var name is undefined. Either pass a variable to ' +
                'the constructor, or call fromJson');
        }
        const variableMap = workspace.getVariableMap();
        if (forward) {
            variableMap.createVariable(this.varName, this.varType, this.varId);
        }
        else {
            const variable = variableMap.getVariableById(this.varId);
            if (variable)
                variableMap.deleteVariable(variable);
        }
    }
}
registry.register(registry.Type.EVENT, EventType.VAR_CREATE, VarCreate);
//# sourceMappingURL=events_var_create.js.map