/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { LContainer } from './interfaces/container';
import { CssSelector, LProjection } from './interfaces/projection';
import { LQueries } from './interfaces/query';
import { LView, TView } from './interfaces/view';
import { LContainerNode, LElementNode, LNode, LNodeFlags, LProjectionNode, LViewNode } from './interfaces/node';
import { ComponentDef, ComponentTemplate, ComponentType, DirectiveDef, DirectiveType } from './interfaces/definition';
import { RElement, RText, Renderer3, RendererFactory3 } from './interfaces/renderer';
/**
 * Directive (D) sets a property on all component instances using this constant as a key and the
 * component's host node (LElement) as the value. This is used in methods like detectChanges to
 * facilitate jumping from an instance to the host node.
 */
export declare const NG_HOST_SYMBOL = "__ngHostLNode__";
export declare function getRenderer(): Renderer3;
export declare function getPreviousOrParentNode(): LNode;
export declare function getCurrentQueries(QueryType: {
    new (): LQueries;
}): LQueries;
export declare function getCreationMode(): boolean;
/**
 * Swap the current state with a new state.
 *
 * For performance reasons we store the state in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the state for later, and when the view is
 * exited the state has to be restored
 *
 * @param newView New state to become active
 * @param host Element to which the View is a child of
 * @returns the previous state;
 */
export declare function enterView(newView: LView, host: LElementNode | LViewNode | null): LView;
/**
 * Used in lieu of enterView to make it clear when we are exiting a child view. This makes
 * the direction of traversal (up or down the view tree) a bit clearer.
 */
export declare function leaveView(newView: LView): void;
export declare function createLView(viewId: number, renderer: Renderer3, tView: TView, template: ComponentTemplate<any> | null, context: any | null): LView;
/**
 * A common way of creating the LNode to make sure that all of them have same shape to
 * keep the execution code monomorphic and fast.
 */
export declare function createLNode(index: number | null, type: LNodeFlags.Element, native: RElement | RText | null, lView?: LView | null): LElementNode;
export declare function createLNode(index: null, type: LNodeFlags.View, native: null, lView: LView): LViewNode;
export declare function createLNode(index: number, type: LNodeFlags.Container, native: undefined, lContainer: LContainer): LContainerNode;
export declare function createLNode(index: number, type: LNodeFlags.Projection, native: null, lProjection: LProjection): LProjectionNode;
/**
 *
 * @param host Existing node to render into.
 * @param template Template function with the instructions.
 * @param context to pass into the template.
 */
export declare function renderTemplate<T>(hostNode: RElement, template: ComponentTemplate<T>, context: T, providedRendererFactory: RendererFactory3, host: LElementNode | null): LElementNode;
export declare function renderEmbeddedTemplate<T>(viewNode: LViewNode | null, template: ComponentTemplate<T>, context: T, renderer: Renderer3): LViewNode;
export declare function renderComponentOrTemplate<T>(node: LElementNode, hostView: LView, componentOrContext: T, template?: ComponentTemplate<T>): void;
/**
 * Create DOM element. The instruction must later be followed by `elementEnd()` call.
 *
 * @param index Index of the element in the data array
 * @param nameOrComponentType Name of the DOM Node or `ComponentType` to create.
 * @param attrs Statically bound set of attributes to be written into the DOM element on creation.
 * @param directiveTypes A set of directives declared on this element.
 * @param localRefs A set of local reference bindings on the element.
 *
 * Attributes and localRefs are passed as an array of strings where elements with an even index
 * hold an attribute name and elements with an odd index hold an attribute value, ex.:
 * ['id', 'warning5', 'class', 'alert']
 */
export declare function elementStart(index: number, nameOrComponentType?: string | ComponentType<any>, attrs?: string[] | null, directiveTypes?: DirectiveType<any>[] | null, localRefs?: string[] | null): RElement;
/** Creates a TView instance */
export declare function createTView(): TView;
export declare function createError(text: string, token: any): Error;
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param elementOrSelector Render element or CSS selector to locate the element.
 */
export declare function locateHostElement(factory: RendererFactory3, elementOrSelector: RElement | string): RElement | null;
/**
 * Creates the host LNode.
 *
 * @param rNode Render host element.
 * @param def ComponentDef
 */
export declare function hostElement(rNode: RElement | null, def: ComponentDef<any>): void;
/**
 * Adds an event listener to the current node.
 *
 * If an output exists on one of the node's directives, it also subscribes to the output
 * and saves the subscription for later cleanup.
 *
 * @param eventName Name of the event
 * @param listener The function to be called when event emits
 * @param useCapture Whether or not to use capture in event listener.
 */
export declare function listener(eventName: string, listener: EventListener, useCapture?: boolean): void;
/** Mark the end of the element. */
export declare function elementEnd(): void;
/**
 * Updates the value of removes an attribute on an Element.
 *
 * @param number index The index of the element in the data array
 * @param string name The name of the attribute.
 * @param any value The attribute is removed when value is `null` or `undefined`.
 *                  Otherwise the attribute value is set to the stringified value.
 */
export declare function elementAttribute(index: number, name: string, value: any): void;
/**
 * Update a property on an Element.
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new @Inputs don't have to be re-compiled.
 *
 * @param index The index of the element to update in the data array
 * @param propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param value New value to write.
 */
export declare function elementProperty<T>(index: number, propName: string, value: T | NO_CHANGE): void;
/**
 * Add or remove a class in a classList.
 *
 * This instruction is meant to handle the [class.foo]="exp" case
 *
 * @param index The index of the element to update in the data array
 * @param className Name of class to toggle. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param value A value indicating if a given class should be added or removed.
 */
export declare function elementClass<T>(index: number, className: string, value: T | NO_CHANGE): void;
/**
 * Update a given style on an Element.
 *
 * @param index Index of the element to change in the data array
 * @param styleName Name of property. Because it is going to DOM this is not subject to
 *        renaming as part of minification.
 * @param value New value to write (null to remove).
 * @param suffix Suffix to add to style's value (optional).
 */
export declare function elementStyle<T>(index: number, styleName: string, value: T | NO_CHANGE, suffix?: string): void;
/**
 * Create static text node
 *
 * @param index Index of the node in the data array.
 * @param value Value to write. This value will be stringified.
 *   If value is not provided than the actual creation of the text node is delayed.
 */
export declare function text(index: number, value?: any): void;
/**
 * Create text node with binding
 * Bindings should be handled externally with the proper bind(1-8) method
 *
 * @param index Index of the node in the data array.
 * @param value Stringified value to write.
 */
export declare function textBinding<T>(index: number, value: T | NO_CHANGE): void;
/**
 * Create a directive.
 *
 * NOTE: directives can be created in order other than the index order. They can also
 *       be retrieved before they are created in which case the value will be null.
 *
 * @param index Each directive in a `View` will have a unique index. Directives can
 *        be created or retrieved out of order.
 * @param directive The directive instance.
 * @param directiveDef DirectiveDef object which contains information about the template.
 * @param queryName Name under which the query can retrieve the directive instance.
 */
export declare function directiveCreate<T>(index: number, directive: T, directiveDef: DirectiveDef<T>, queryName?: string | null): T;
/**
 * Creates an LContainerNode.
 *
 * Only `LViewNodes` can go into `LContainerNodes`.
 *
 * @param index The index of the container in the data array
 * @param template Optional inline template
 * @param tagName The name of the container element, if applicable
 * @param attrs The attrs attached to the container, if applicable
 * @param localRefs A set of local reference bindings on the element.
 */
export declare function container(index: number, directiveTypes?: DirectiveType<any>[], template?: ComponentTemplate<any>, tagName?: string, attrs?: string[], localRefs?: string[] | null): void;
/**
 * Sets a container up to receive views.
 *
 * @param index The index of the container in the data array
 */
export declare function containerRefreshStart(index: number): void;
/**
 * Marks the end of the LContainerNode.
 *
 * Marking the end of LContainerNode is the time when to child Views get inserted or removed.
 */
export declare function containerRefreshEnd(): void;
/**
 * Marks the start of an embedded view.
 *
 * @param viewBlockId The ID of this view
 * @return boolean Whether or not this view is in creation mode
 */
export declare function embeddedViewStart(viewBlockId: number): boolean;
/** Marks the end of an embedded view. */
export declare function embeddedViewEnd(): void;
/**
 * Refreshes the component view.
 *
 * In other words, enters the component's view and processes it to update bindings, queries, etc.
 *
 * @param directiveIndex
 * @param elementIndex
 */
export declare function componentRefresh<T>(directiveIndex: number, elementIndex: number): void;
/**
 * Instruction to distribute projectable nodes among <ng-content> occurrences in a given template.
 * It takes all the selectors from the entire component's template and decides where
 * each projected node belongs (it re-distributes nodes among "buckets" where each "bucket" is
 * backed by a selector).
 *
 * @param selectors
 */
export declare function projectionDef(index: number, selectors?: CssSelector[]): void;
/**
 * Inserts previously re-distributed projected nodes. This instruction must be preceded by a call
 * to the projectionDef instruction.
 *
 * @param nodeIndex
 * @param localIndex - index under which distribution of projected nodes was memorized
 * @param selectorIndex - 0 means <ng-content> without any selector
 * @param attrs - attributes attached to the ng-content node, if present
 */
export declare function projection(nodeIndex: number, localIndex: number, selectorIndex?: number, attrs?: string[]): void;
/**
 * Adds a LView or a LContainer to the end of the current view tree.
 *
 * This structure will be used to traverse through nested views to remove listeners
 * and call onDestroy callbacks.
 *
 * @param state The LView or LContainer to add to the view tree
 * @returns The state passed in
 */
export declare function addToViewTree<T extends LView | LContainer>(state: T): T;
export interface NO_CHANGE {
    brand: 'NO_CHANGE';
}
/** A special value which designates that a value has not changed. */
export declare const NO_CHANGE: NO_CHANGE;
/**
 * Creates a single value binding.
 *
 * @param value Value to diff
 */
export declare function bind<T>(value: T | NO_CHANGE): T | NO_CHANGE;
/**
 * Create interpolation bindings with a variable number of expressions.
 *
 * If there are 1 to 8 expressions `interpolation1()` to `interpolation8()` should be used instead.
 * Those are faster because there is no need to create an array of expressions and iterate over it.
 *
 * `values`:
 * - has static text at even indexes,
 * - has evaluated expressions at odd indexes.
 *
 * Returns the concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export declare function interpolationV(values: any[]): string | NO_CHANGE;
/**
 * Creates an interpolation binding with 1 expression.
 *
 * @param prefix static value used for concatenation only.
 * @param v0 value checked for change.
 * @param suffix static value used for concatenation only.
 */
export declare function interpolation1(prefix: string, v0: any, suffix: string): string | NO_CHANGE;
/** Creates an interpolation binding with 2 expressions. */
export declare function interpolation2(prefix: string, v0: any, i0: string, v1: any, suffix: string): string | NO_CHANGE;
/** Creates an interpolation bindings with 3 expressions. */
export declare function interpolation3(prefix: string, v0: any, i0: string, v1: any, i1: string, v2: any, suffix: string): string | NO_CHANGE;
/** Create an interpolation binding with 4 expressions. */
export declare function interpolation4(prefix: string, v0: any, i0: string, v1: any, i1: string, v2: any, i2: string, v3: any, suffix: string): string | NO_CHANGE;
/** Creates an interpolation binding with 5 expressions. */
export declare function interpolation5(prefix: string, v0: any, i0: string, v1: any, i1: string, v2: any, i2: string, v3: any, i3: string, v4: any, suffix: string): string | NO_CHANGE;
/** Creates an interpolation binding with 6 expressions. */
export declare function interpolation6(prefix: string, v0: any, i0: string, v1: any, i1: string, v2: any, i2: string, v3: any, i3: string, v4: any, i4: string, v5: any, suffix: string): string | NO_CHANGE;
/** Creates an interpolation binding with 7 expressions. */
export declare function interpolation7(prefix: string, v0: any, i0: string, v1: any, i1: string, v2: any, i2: string, v3: any, i3: string, v4: any, i4: string, v5: any, i5: string, v6: any, suffix: string): string | NO_CHANGE;
/** Creates an interpolation binding with 8 expressions. */
export declare function interpolation8(prefix: string, v0: any, i0: string, v1: any, i1: string, v2: any, i2: string, v3: any, i3: string, v4: any, i4: string, v5: any, i5: string, v6: any, i6: string, v7: any, suffix: string): string | NO_CHANGE;
/** Store a value in the `data` at a given `index`. */
export declare function store<T>(index: number, value: T): void;
/** Retrieves a value from the `data`. */
export declare function load<T>(index: number): T;
/** Gets the current binding value and increments the binding index. */
export declare function consumeBinding(): any;
/** Updates binding if changed, then returns whether it was updated. */
export declare function bindingUpdated(value: any): boolean;
/** Updates binding if changed, then returns the latest value. */
export declare function checkAndUpdateBinding(value: any): any;
/** Updates 2 bindings if changed, then returns whether either was updated. */
export declare function bindingUpdated2(exp1: any, exp2: any): boolean;
/** Updates 4 bindings if changed, then returns whether any was updated. */
export declare function bindingUpdated4(exp1: any, exp2: any, exp3: any, exp4: any): boolean;
export declare function getDirectiveInstance<T>(instanceOrArray: T | [T]): T;
export declare function assertPreviousIsParent(): void;
