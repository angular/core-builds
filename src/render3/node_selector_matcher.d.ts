/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { TNode } from './interfaces/node';
import { CssSelector, CssSelectorWithNegations, SimpleCssSelector } from './interfaces/projection';
/**
 * A utility function to match an Ivy node static data against a simple CSS selector
 *
 * @param node static data to match
 * @param selector
 * @returns true if node matches the selector.
 */
export declare function isNodeMatchingSimpleSelector(tNode: TNode, selector: SimpleCssSelector): boolean;
export declare function isNodeMatchingSelectorWithNegations(tNode: TNode, selector: CssSelectorWithNegations): boolean;
export declare function isNodeMatchingSelector(tNode: TNode, selector: CssSelector): boolean;
/**
 * Checks a given node against matching selectors and returns
 * selector index (or 0 if none matched);
 */
export declare function matchingSelectorIndex(tNode: TNode, selectors: CssSelector[]): number;
