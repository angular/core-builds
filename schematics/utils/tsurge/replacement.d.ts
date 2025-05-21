/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { ProjectFile } from './project_paths';
/** A text replacement for the given file. */
export declare class Replacement {
    projectFile: ProjectFile;
    update: TextUpdate;
    constructor(projectFile: ProjectFile, update: TextUpdate);
}
/** An isolated text update that may be applied to a file. */
export declare class TextUpdate {
    data: {
        position: number;
        end: number;
        toInsert: string;
    };
    constructor(data: {
        position: number;
        end: number;
        toInsert: string;
    });
}
/** Helper that applies updates to the given text. */
export declare function applyTextUpdates(input: string, updates: TextUpdate[]): string;
