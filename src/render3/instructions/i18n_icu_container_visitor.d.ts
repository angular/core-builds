/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TIcuContainerNode } from '../interfaces/node';
import { RNode } from '../interfaces/renderer';
import { LView } from '../interfaces/view';
export declare function loadIcuContainerVisitor(): (tIcuContainerNode: TIcuContainerNode, lView: LView) => () => RNode | null;
