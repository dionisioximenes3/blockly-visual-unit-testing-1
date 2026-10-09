/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as priorities from './priorities.js';
/**
 * Serializes the given IProcedureModel to JSON.
 */
export function saveProcedure(proc) {
    const state = proc.saveState();
    if (!proc.getParameters().length)
        return state;
    state.parameters = proc.getParameters().map((param) => param.saveState());
    return state;
}
/**
 * Deserializes the given procedure model State from JSON.
 */
export function loadProcedure(procedureModelClass, parameterModelClass, state, workspace) {
    const proc = procedureModelClass.loadState(state, workspace);
    if (!state.parameters)
        return proc;
    for (const [index, param] of state.parameters.entries()) {
        proc.insertParameter(parameterModelClass.loadState(param, workspace), index);
    }
    return proc;
}
/** Serializer for saving and loading procedure state. */
export class ProcedureSerializer {
    /**
     * Constructs the procedure serializer.
     *
     * Example usage:
     *   new ProcedureSerializer(MyProcedureModelClass, MyParameterModelClass)
     *
     * @param procedureModelClass The class (implementing IProcedureModel) that
     *     you want this serializer to deserialize.
     * @param parameterModelClass The class (implementing IParameterModel) that
     *     you want this serializer to deserialize.
     */
    constructor(procedureModelClass, parameterModelClass) {
        this.procedureModelClass = procedureModelClass;
        this.parameterModelClass = parameterModelClass;
        this.priority = priorities.PROCEDURES;
    }
    /** Serializes the procedure models of the given workspace. */
    save(workspace) {
        const save = workspace
            .getProcedureMap()
            .getProcedures()
            .map((proc) => saveProcedure(proc));
        return save.length ? save : null;
    }
    /**
     * Deserializes the procedures models defined by the given state into the
     * workspace.
     */
    load(state, workspace) {
        const map = workspace.getProcedureMap();
        for (const procState of state) {
            map.add(loadProcedure(this.procedureModelClass, this.parameterModelClass, procState, workspace));
        }
    }
    /** Disposes of any procedure models that exist on the workspace. */
    clear(workspace) {
        workspace.getProcedureMap().clear();
    }
}
//# sourceMappingURL=procedures.js.map