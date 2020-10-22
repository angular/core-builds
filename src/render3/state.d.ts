/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DirectiveDef } from './interfaces/definition';
import { TNode } from './interfaces/node';
import { LView, OpaqueViewState, TData, TView } from './interfaces/view';
/**
 * Returns true if the instruction state stack is empty.
 *
 * Intended to be called from tests only (tree shaken otherwise).
 */
export declare function specOnlyIsInstructionStateEmpty(): boolean;
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
 * Return the current `LView`.
 */
export declare function getLView(): LView;
/**
 * Return the current `TView`.
 */
export declare function getTView(): TView;
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
export declare function getCurrentTNode(): TNode | null;
export declare function getCurrentTNodePlaceholderOk(): TNode | null;
export declare function getCurrentParentTNode(): TNode | null;
export declare function setCurrentTNode(tNode: TNode | null, isParent: boolean): void;
export declare function isCurrentTNodeParent(): boolean;
export declare function setCurrentTNodeAsNotParent(): void;
export declare function setCurrentTNodeAsParent(): void;
export declare function getContextLView(): LView;
export declare function isInCheckNoChangesMode(): boolean;
export declare function setIsInCheckNoChangesMode(mode: boolean): void;
export declare function getBindingRoot(): number;
export declare function getBindingIndex(): number;
export declare function setBindingIndex(value: number): number;
export declare function nextBindingIndex(): number;
export declare function incrementBindingIndex(count: number): number;
export declare function isInI18nBlock(): boolean;
export declare function setInI18nBlock(isInI18nBlock: boolean): void;
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
/**
 * Sets an index of a directive whose `hostBindings` are being processed.
 *
 * @param currentDirectiveIndex `TData` index where current directive instance can be found.
 */
export declare function setCurrentDirectiveIndex(currentDirectiveIndex: number): void;
/**
 * Retrieve the current `DirectiveDef` which is active when `hostBindings` instruction is being
 * executed.
 *
 * @param tData Current `TData` where the `DirectiveDef` will be looked up at.
 */
export declare function getCurrentDirectiveDef(tData: TData): DirectiveDef<any> | null;
export declare function getCurrentQueryIndex(): number;
export declare function setCurrentQueryIndex(value: number): void;
/**
 * This is a light weight version of the `enterView` which is needed by the DI system.
 * @param newView
 * @param tNode
 */
export declare function enterDI(newView: LView, tNode: TNode): void;
/**
 * Swap the current lView with a new lView.
 *
 * For performance reasons we store the lView in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the lView for later, and when the view is
 * exited the state has to be restored
 *
 * @param newView New lView to become active
 * @returns the previously active lView;
 */
export declare function enterView(newView: LView): void;
/**
 * This is a lightweight version of the `leaveView` which is needed by the DI system.
 *
 * NOTE: this function is an alias so that we can change the type of the function to have `void`
 * return type.
 */
export declare const leaveDI: () => void;
/**
 * Leave the current `LView`
 *
 * This pops the `LFrame` with the associated `LView` from the stack.
 *
 * IMPORTANT: We must zero out the `LFrame` values here otherwise they will be retained. This is
 * because for performance reasons we don't release `LFrame` but rather keep it for next use.
 */
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
 * Gets the `tNode` that represents currently selected element.
 */
export declare function getSelectedTNode(): TNode;
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
