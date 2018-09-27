/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { LElementNode } from './interfaces/node';
import { RElement } from './interfaces/renderer';
import { LViewData } from './interfaces/view';
/**
 * This property will be monkey-patched on elements, components and directives
 */
export declare const MONKEY_PATCH_KEY_NAME = "__ngContext__";
/**
 * The internal view context which is specific to a given DOM element, directive or
 * component instance. Each value in here (besides the LViewData and element node details)
 * can be present, null or undefined. If undefined then it implies the value has not been
 * looked up yet, otherwise, if null, then a lookup was executed and nothing was found.
 *
 * Each value will get filled when the respective value is examined within the getContext
 * function. The component, element and each directive instance will share the same instance
 * of the context.
 */
export interface LContext {
    /**
     * The component's parent view data.
     */
    lViewData: LViewData;
    /**
     * The index instance of the LNode.
     */
    lNodeIndex: number;
    /**
     * The instance of the DOM node that is attached to the lNode.
     */
    native: RElement;
    /**
     * The instance of the Component node.
     */
    component: {} | null | undefined;
    /**
     * The list of indices for the active directives that exist on this element.
     */
    directiveIndices: number[] | null | undefined;
    /**
     * The list of active directives that exist on this element.
     */
    directives: any[] | null | undefined;
    /**
     * The map of local references (local reference name => element or directive instance) that exist
     * on this element.
     */
    localRefs: {
        [key: string]: any;
    } | null | undefined;
}
/** Returns the matching `LContext` data for a given DOM node, directive or component instance.
 *
 * This function will examine the provided DOM element, component, or directive instance\'s
 * monkey-patched property to derive the `LContext` data. Once called then the monkey-patched
 * value will be that of the newly created `LContext`.
 *
 * If the monkey-patched value is the `LViewData` instance then the context value for that
 * target will be created and the monkey-patch reference will be updated. Therefore when this
 * function is called it may mutate the provided element\'s, component\'s or any of the associated
 * directive\'s monkey-patch values.
 *
 * If the monkey-patch value is not detected then the code will walk up the DOM until an element
 * is found which contains a monkey-patch reference. When that occurs then the provided element
 * will be updated with a new context (which is then returned). If the monkey-patch value is not
 * detected for a component/directive instance then it will throw an error (all components and
 * directives should be automatically monkey-patched by ivy).
 */
export declare function getContext(target: any): LContext | null;
/**
 * A utility function for retrieving the matching lElementNode
 * from a given DOM element, component or directive.
 */
export declare function getLElementNode(target: any): LElementNode | null;
export declare function getLElementFromRootComponent(rootComponentInstance: {}): LElementNode | null;
/**
 * A simplified lookup function for finding the LElementNode from a component instance.
 *
 * This function exists for tree-shaking purposes to avoid having to pull in everything
 * that `getContext` has in the event that an Angular application doesn't need to have
 * any programmatic access to an element's context (only change detection uses this function).
 */
export declare function getLElementFromComponent(componentInstance: {}): LElementNode;
/**
 * Assigns the given data to the given target (which could be a component,
 * directive or DOM node instance) using monkey-patching.
 */
export declare function attachPatchData(target: any, data: LViewData | LContext): void;
/**
 * Returns the monkey-patch value data present on the target (which could be
 * a component, directive or a DOM node).
 */
export declare function readPatchedData(target: any): LViewData | LContext | null;
export declare function readPatchedLViewData(target: any): LViewData | null;
export declare function isComponentInstance(instance: any): boolean;
export declare function isDirectiveInstance(instance: any): boolean;
/**
 * Returns a collection of directive index values that are used on the element
 * (which is referenced by the lNodeIndex)
 */
export declare function discoverDirectiveIndices(lViewData: LViewData, lNodeIndex: number, includeComponents?: boolean): number[] | null;
/**
 * Returns a list of directives extracted from the given view based on the
 * provided list of directive index values.
 *
 * @param lViewData The target view data
 * @param indices A collection of directive index values which will be used to
 *    figure out the directive instances
 */
export declare function discoverDirectives(lViewData: LViewData, indices: number[]): number[] | null;
/**
 * Returns a map of local references (local reference name => element or directive instance) that
 * exist on a given element.
 */
export declare function discoverLocalRefs(lViewData: LViewData, lNodeIndex: number): {
    [key: string]: any;
} | null;
export declare function readElementValue(value: LElementNode | any[]): LElementNode;
