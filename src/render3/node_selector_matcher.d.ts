/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_dev_mode';
import { TNode } from './interfaces/node';
import { CssSelector, CssSelectorList } from './interfaces/projection';
/**
 * A utility function to match an Ivy node static data against a simple CSS selector
 *
 * @param node static data of the node to match
 * @param selector The selector to try matching against the node.
 * @param isProjectionMode if `true` we are matching for content projection, otherwise we are doing
 * directive matching.
 * @returns true if node matches the selector.
 */
export declare function isNodeMatchingSelector(tNode: TNode, selector: CssSelector, isProjectionMode: boolean): boolean;
export declare function isNodeMatchingSelectorList(tNode: TNode, selector: CssSelectorList, isProjectionMode?: boolean): boolean;
export declare function getProjectAsAttrValue(tNode: TNode): CssSelector | null;
/**
 * Checks whether a selector is inside a CssSelectorList
 * @param selector Selector to be checked.
 * @param list List in which to look for the selector.
 */
export declare function isSelectorInSelectorList(selector: CssSelector, list: CssSelectorList): boolean;
