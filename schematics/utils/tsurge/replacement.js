/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import MagicString from 'magic-string';
/** A text replacement for the given file. */
export class Replacement {
    projectFile;
    update;
    constructor(projectFile, update) {
        this.projectFile = projectFile;
        this.update = update;
    }
}
/** An isolated text update that may be applied to a file. */
export class TextUpdate {
    data;
    constructor(data) {
        this.data = data;
    }
}
/** Helper that applies updates to the given text. */
export function applyTextUpdates(input, updates) {
    const res = new MagicString(input);
    for (const update of updates) {
        res.remove(update.data.position, update.data.end);
        res.appendLeft(update.data.position, update.data.toInsert);
    }
    return res.toString();
}
//# sourceMappingURL=replacement.js.map