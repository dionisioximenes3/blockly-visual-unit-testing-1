/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BlockSvg } from '../block_svg.js';
import { ConnectionType } from '../connection_type.js';
import { isFocusableNode } from '../interfaces/i_focusable_node.js';
import { WorkspaceSvg } from '../workspace_svg.js';
/**
 * Set of rules controlling keyboard navigation from a block.
 */
export class BlockNavigationPolicy {
    /**
     * Returns the first child of the given block.
     *
     * @param current The block to return the first child of.
     * @returns The first field or input of the given block, if any.
     */
    getFirstChild(current) {
        const candidates = getBlockNavigationCandidates(current, true);
        return candidates[0];
    }
    /**
     * Returns the parent of the given block.
     *
     * @param current The block to return the parent of.
     * @returns The top block of the given block's stack, or the connection to
     *     which it is attached.
     */
    getParent(current) {
        if (current.previousConnection?.targetBlock()) {
            const surroundParent = current.getSurroundParent();
            if (surroundParent)
                return surroundParent;
        }
        else if (current.outputConnection?.targetBlock()) {
            return current.outputConnection.targetBlock();
        }
        return current.workspace;
    }
    /**
     * Returns the next peer node of the given block.
     *
     * @param current The block to find the following element of.
     * @returns The first node of the next input/stack if the given block is a terminal
     *     block, or its next connection.
     */
    getNextSibling(current) {
        if (current.nextConnection?.targetBlock()) {
            return current.nextConnection?.targetBlock();
        }
        else if (current.outputConnection?.targetBlock()) {
            return navigateBlock(current, 1);
        }
        else if (current.getSurroundParent()) {
            return navigateBlock(current.getTopStackBlock(), 1);
        }
        else if (this.getParent(current) instanceof WorkspaceSvg) {
            return navigateStacks(current, 1);
        }
        return null;
    }
    /**
     * Returns the previous peer node of the given block.
     *
     * @param current The block to find the preceding element of.
     * @returns The block's previous/output connection, or the last
     *     connection/block of the previous block stack if it is a root block.
     */
    getPreviousSibling(current) {
        if (current.previousConnection?.targetBlock()) {
            return current.previousConnection?.targetBlock();
        }
        else if (current.outputConnection?.targetBlock()) {
            return navigateBlock(current, -1);
        }
        else if (this.getParent(current) instanceof WorkspaceSvg) {
            return navigateStacks(current, -1);
        }
        return null;
    }
    /**
     * Returns whether or not the given block can be navigated to.
     *
     * @param current The instance to check for navigability.
     * @returns True if the given block can be focused.
     */
    isNavigable(current) {
        return current.canBeFocused();
    }
    /**
     * Returns whether the given object can be navigated from by this policy.
     *
     * @param current The object to check if this policy applies to.
     * @returns True if the object is a BlockSvg.
     */
    isApplicable(current) {
        return current instanceof BlockSvg;
    }
}
/**
 * Returns a list of the navigable children of the given block.
 *
 * @param block The block to retrieve the navigable children of.
 * @returns A list of navigable/focusable children of the given block.
 */
function getBlockNavigationCandidates(block, forward) {
    const candidates = block.getIcons();
    for (const input of block.inputList) {
        if (!input.isVisible())
            continue;
        candidates.push(...input.fieldRow);
        if (input.connection?.targetBlock()) {
            const connectedBlock = input.connection.targetBlock();
            if (input.connection.type === ConnectionType.NEXT_STATEMENT && !forward) {
                const lastStackBlock = connectedBlock
                    .lastConnectionInStack(false)
                    ?.getSourceBlock();
                if (lastStackBlock) {
                    candidates.push(lastStackBlock);
                }
            }
            else {
                candidates.push(connectedBlock);
            }
        }
        else if (input.connection?.type === ConnectionType.INPUT_VALUE) {
            candidates.push(input.connection);
        }
    }
    return candidates;
}
/**
 * Returns the next/previous stack relative to the given element's stack.
 *
 * @param current The element whose stack will be navigated relative to.
 * @param delta The difference in index to navigate; positive values navigate
 *     to the nth next stack, while negative values navigate to the nth previous
 *     stack.
 * @returns The first element in the stack offset by `delta` relative to the
 *     current element's stack, or the last element in the stack offset by
 * `delta` relative to the current element's stack when navigating backwards.
 */
export function navigateStacks(current, delta) {
    const stacks = current.workspace
        .getTopBoundedElements(true)
        .filter((element) => isFocusableNode(element));
    const currentIndex = stacks.indexOf(current instanceof BlockSvg ? current.getRootBlock() : current);
    const targetIndex = currentIndex + delta;
    let result = null;
    if (targetIndex >= 0 && targetIndex < stacks.length) {
        result = stacks[targetIndex];
    }
    else if (targetIndex < 0) {
        result = stacks[stacks.length - 1];
    }
    else if (targetIndex >= stacks.length) {
        result = stacks[0];
    }
    // When navigating to a previous block stack, our previous sibling is the last
    // block in it.
    if (delta < 0 && result instanceof BlockSvg) {
        return result.lastConnectionInStack(false)?.getSourceBlock() ?? result;
    }
    return result;
}
/**
 * Returns the next navigable item relative to the provided block child.
 *
 * @param current The navigable block child item to navigate relative to.
 * @param delta The difference in index to navigate; positive values navigate
 *     forward by n, while negative values navigate backwards by n.
 * @returns The navigable block child offset by `delta` relative to `current`.
 */
export function navigateBlock(current, delta) {
    const block = current instanceof BlockSvg
        ? (current.outputConnection?.targetBlock() ?? current.getSurroundParent())
        : current.getSourceBlock();
    if (!(block instanceof BlockSvg))
        return null;
    const candidates = getBlockNavigationCandidates(block, delta > 0);
    const currentIndex = candidates.indexOf(current);
    if (currentIndex === -1)
        return null;
    const targetIndex = currentIndex + delta;
    if (targetIndex >= 0 && targetIndex < candidates.length) {
        return candidates[targetIndex];
    }
    return null;
}
//# sourceMappingURL=block_navigation_policy.js.map