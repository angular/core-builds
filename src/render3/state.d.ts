/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { StyleSanitizeFn } from '../sanitization/style_sanitizer';
import { TNode } from './interfaces/node';
import { LView, OpaqueViewState } from './interfaces/view';
/**
 *
 */
interface LFrame {
    /**
     * Parent LFrame.
     *
     * This is needed when `leaveView` is called to restore the previous state.
     */
    parent: LFrame;
    /**
     * Child LFrame.
     *
     * This is used to cache existing LFrames to relieve the memory pressure.
     */
    child: LFrame | null;
    /**
     * State of the current view being processed.
     *
     * An array of nodes (text, element, container, etc), pipes, their bindings, and
     * any local variables that need to be stored between invocations.
     */
    lView: LView;
    /**
     * Used to set the parent property when nodes are created and track query results.
     *
     * This is used in conjunction with `isParent`.
     */
    previousOrParentTNode: TNode;
    /**
     * If `isParent` is:
     *  - `true`: then `previousOrParentTNode` points to a parent node.
     *  - `false`: then `previousOrParentTNode` points to previous node (sibling).
     */
    isParent: boolean;
    /**
     * Index of currently selected element in LView.
     *
     * Used by binding instructions. Updated as part of advance instruction.
     */
    selectedIndex: number;
    /**
     * Current pointer to the binding index.
     */
    bindingIndex: number;
    /**
     * The last viewData retrieved by nextContext().
     * Allows building nextContext() and reference() calls.
     *
     * e.g. const inner = x().$implicit; const outer = x().$implicit;
     */
    contextLView: LView;
    /**
     * Store the element depth count. This is used to identify the root elements of the template
     * so that we can then attach patch data `LView` to only those elements. We know that those
     * are the only places where the patch data could change, this way we will save on number
     * of places where tha patching occurs.
     */
    elementDepthCount: number;
    /**
     * Current namespace to be used when creating elements
     */
    currentNamespace: string | null;
    /**
     * Current sanitizer
     */
    currentSanitizer: StyleSanitizeFn | null;
    /**
     * The root index from which pure function instructions should calculate their binding
     * indices. In component views, this is TView.bindingStartIndex. In a host binding
     * context, this is the TView.expandoStartIndex + any dirs/hostVars before the given dir.
     */
    bindingRootIndex: number;
    /**
     * Current index of a View or Content Query which needs to be processed next.
     * We iterate over the list of Queries and increment current query index at every step.
     */
    currentQueryIndex: number;
    /**
     * When host binding is executing this points to the directive index.
     * `TView.data[currentDirectiveIndex]` is `DirectiveDef`
     * `LView[currentDirectiveIndex]` is directive instance.
     */
    currentDirectiveIndex: number;
}
/**
 * All implicit instruction state is stored here.
 *
 * It is useful to have a single object where all of the state is stored as a mental model
 * (rather it being spread across many different variables.)
 *
 * PERF NOTE: Turns out that writing to a true global variable is slower than
 * having an intermediate object with properties.
 */
interface InstructionState {
    /**
     * Current `LFrame`
     *
     * `null` if we have not called `enterView`
     */
    lFrame: LFrame;
    /**
     * Stores whether directives should be matched to elements.
     *
     * When template contains `ngNonBindable` then we need to prevent the runtime from matching
     * directives on children of that element.
     *
     * Example:
     * ```
     * <my-comp my-directive>
     *   Should match component / directive.
     * </my-comp>
     * <div ngNonBindable>
     *   <my-comp my-directive>
     *     Should not match component / directive because we are in ngNonBindable.
     *   </my-comp>
     * </div>
     * ```
     */
    bindingsEnabled: boolean;
    /**
     * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
     *
     * Necessary to support ChangeDetectorRef.checkNoChanges().
     */
    checkNoChangesMode: boolean;
}
export declare const instructionState: InstructionState;
export declare function getElementDepthCount(): number;
export declare function increaseElementDepthCount(): void;
export declare function decreaseElementDepthCount(): void;
export declare function getBindingsEnabled(): boolean;
/**
 * Enables directive matching on elements.
 *
 *  * Example:
 * ```
 * <my-comp my-directive>
 *   Should match component / directive.
 * </my-comp>
 * <div ngNonBindable>
 *   <!-- ɵɵdisableBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- ɵɵenableBindings() -->
 * </div>
 * ```
 *
 * @codeGenApi
 */
export declare function ɵɵenableBindings(): void;
/**
 * Disables directive matching on element.
 *
 *  * Example:
 * ```
 * <my-comp my-directive>
 *   Should match component / directive.
 * </my-comp>
 * <div ngNonBindable>
 *   <!-- ɵɵdisableBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- ɵɵenableBindings() -->
 * </div>
 * ```
 *
 * @codeGenApi
 */
export declare function ɵɵdisableBindings(): void;
/**
 * Return the current LView.
 *
 * The return value can be `null` if the method is called outside of template. This can happen if
 * directive is instantiated by module injector (rather than by node injector.)
 */
export declare function getLView(): LView;
/**
 * Restores `contextViewData` to the given OpaqueViewState instance.
 *
 * Used in conjunction with the getCurrentView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 *
 * @param viewToRestore The OpaqueViewState instance to restore.
 *
 * @codeGenApi
 */
export declare function ɵɵrestoreView(viewToRestore: OpaqueViewState): void;
export declare function getPreviousOrParentTNode(): TNode;
export declare function setPreviousOrParentTNode(tNode: TNode, _isParent: boolean): void;
export declare function getIsParent(): boolean;
export declare function setIsNotParent(): void;
export declare function setIsParent(): void;
export declare function getContextLView(): LView;
export declare function getCheckNoChangesMode(): boolean;
export declare function setCheckNoChangesMode(mode: boolean): void;
export declare function getBindingRoot(): number;
export declare function getBindingIndex(): number;
export declare function setBindingIndex(value: number): number;
export declare function nextBindingIndex(): number;
export declare function incrementBindingIndex(count: number): number;
/**
 * Set a new binding root index so that host template functions can execute.
 *
 * Bindings inside the host template are 0 index. But because we don't know ahead of time
 * how many host bindings we have we can't pre-compute them. For this reason they are all
 * 0 index and we just shift the root so that they match next available location in the LView.
 *
 * @param bindingRootIndex Root index for `hostBindings`
 * @param currentDirectiveIndex `TData[currentDirectiveIndex]` will point to the current directive
 *        whose `hostBindings` are being processed.
 */
export declare function setBindingRootForHostBindings(bindingRootIndex: number, currentDirectiveIndex: number): void;
/**
 * When host binding is executing this points to the directive index.
 * `TView.data[getCurrentDirectiveIndex()]` is `DirectiveDef`
 * `LView[getCurrentDirectiveIndex()]` is directive instance.
 */
export declare function getCurrentDirectiveIndex(): number;
export declare function getCurrentQueryIndex(): number;
export declare function setCurrentQueryIndex(value: number): void;
/**
 * This is a light weight version of the `enterView` which is needed by the DI system.
 * @param newView
 * @param tNode
 */
export declare function enterDI(newView: LView, tNode: TNode): void;
/**
 * This is a light weight version of the `leaveView` which is needed by the DI system.
 *
 * Because the implementation is same it is only an alias
 */
export declare const leaveDI: typeof leaveView;
/**
 * Swap the current lView with a new lView.
 *
 * For performance reasons we store the lView in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the lView for later, and when the view is
 * exited the state has to be restored
 *
 * @param newView New lView to become active
 * @param tNode Element to which the View is a child of
 * @returns the previously active lView;
 */
export declare function enterView(newView: LView, tNode: TNode | null): void;
export declare function leaveView(): void;
export declare function nextContextImpl<T = any>(level: number): T;
/**
 * Gets the currently selected element index.
 *
 * Used with {@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 */
export declare function getSelectedIndex(): number;
/**
 * Sets the most recent index passed to {@link select}
 *
 * Used with {@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 *
 * (Note that if an "exit function" was set earlier (via `setElementExitFn()`) then that will be
 * run if and when the provided `index` value is different from the current selected index value.)
 */
export declare function setSelectedIndex(index: number): void;
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/2000/svg'` in global state.
 *
 * @codeGenApi
 */
export declare function ɵɵnamespaceSVG(): void;
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/1998/MathML/'` in global state.
 *
 * @codeGenApi
 */
export declare function ɵɵnamespaceMathML(): void;
/**
 * Sets the namespace used to create elements to `null`, which forces element creation to use
 * `createElement` rather than `createElementNS`.
 *
 * @codeGenApi
 */
export declare function ɵɵnamespaceHTML(): void;
/**
 * Sets the namespace used to create elements to `null`, which forces element creation to use
 * `createElement` rather than `createElementNS`.
 */
export declare function namespaceHTMLInternal(): void;
export declare function getNamespace(): string | null;
export declare function setCurrentStyleSanitizer(sanitizer: StyleSanitizeFn | null): void;
export declare function resetCurrentStyleSanitizer(): void;
export declare function getCurrentStyleSanitizer(): StyleSanitizeFn | null;
export {};
