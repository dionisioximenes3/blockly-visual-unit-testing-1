/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { IconType } from '../icons/icon_types.js';
import { hasBubble } from './i_has_bubble.js';
import { isIcon } from './i_icon.js';
import { isSerializable } from './i_serializable.js';
/** Checks whether the given object is an ICommentIcon. */
export function isCommentIcon(obj) {
    return (isIcon(obj) &&
        hasBubble(obj) &&
        isSerializable(obj) &&
        typeof obj.setText === 'function' &&
        typeof obj.getText === 'function' &&
        typeof obj.setBubbleSize === 'function' &&
        typeof obj.getBubbleSize === 'function' &&
        typeof obj.setBubbleLocation === 'function' &&
        typeof obj.getBubbleLocation === 'function' &&
        obj.getType() === IconType.COMMENT);
}
//# sourceMappingURL=i_comment_icon.js.map