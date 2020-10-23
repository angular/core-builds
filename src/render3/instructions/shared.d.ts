/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../../di';
import { SchemaMetadata } from '../../metadata/schema';
import { ViewEncapsulation } from '../../metadata/view';
import { Sanitizer } from '../../sanitization/sanitizer';
import { LContainer } from '../interfaces/container';
import { ComponentDef, ComponentTemplate, DirectiveDef, DirectiveDefListOrFactory, PipeDefListOrFactory, ViewQueriesFunction } from '../interfaces/definition';
import { LocalRefExtractor, PropertyAliasValue, TAttributes, TConstantsOrFactory, TContainerNode, TDirectiveHostNode, TElementContainerNode, TElementNode, TIcuContainerNode, TNode, TNodeType, TProjectionNode } from '../interfaces/node';
import { RComment, RElement, Renderer3, RendererFactory3 } from '../interfaces/renderer';
import { SanitizerFn } from '../interfaces/sanitization';
import { LView, LViewFlags, RootContext, RootContextFlags, TData, TView, TViewType } from '../interfaces/view';
/**
 * Invoke `HostBindingsFunction`s for view.
 *
 * This methods executes `TView.hostBindingOpCodes`. It is used to execute the
 * `HostBindingsFunction`s associated with the current `LView`.
 *
 * @param tView Current `TView`.
 * @param lView Current `LView`.
 */
export declare function processHostBindingOpCodes(tView: TView, lView: LView): void;
export declare function createLView<T>(parentLView: LView | null, tView: TView, context: T | null, flags: LViewFlags, host: RElement | null, tHostNode: TNode | null, rendererFactory: RendererFactory3 | null, renderer: Renderer3 | null, sanitizer: Sanitizer | null, injector: Injector | null): LView;
/**
 * Create and stores the TNode, and hooks it up to the tree.
 *
 * @param tView The current `TView`.
 * @param index The index at which the TNode should be saved (null if view, since they are not
 * saved).
 * @param type The type of TNode to create
 * @param native The native element for this node, if applicable
 * @param name The tag name of the associated native element, if applicable
 * @param attrs Any attrs for the native element, if applicable
 */
export declare function getOrCreateTNode(tView: TView, index: number, type: TNodeType.Element | TNodeType.Text, name: string | null, attrs: TAttributes | null): TElementNode;
export declare function getOrCreateTNode(tView: TView, index: number, type: TNodeType.Container, name: string | null, attrs: TAttributes | null): TContainerNode;
export declare function getOrCreateTNode(tView: TView, index: number, type: TNodeType.Projection, name: null, attrs: TAttributes | null): TProjectionNode;
export declare function getOrCreateTNode(tView: TView, index: number, type: TNodeType.ElementContainer, name: string | null, attrs: TAttributes | null): TElementContainerNode;
export declare function getOrCreateTNode(tView: TView, index: number, type: TNodeType.Icu, name: null, attrs: TAttributes | null): TElementContainerNode;
export declare function createTNodeAtIndex(tView: TView, index: number, type: TNodeType, name: string | null, attrs: TAttributes | null): TNode;
/**
 * When elements are created dynamically after a view blueprint is created (e.g. through
 * i18nApply()), we need to adjust the blueprint for future
 * template passes.
 *
 * @param tView `TView` associated with `LView`
 * @param lView The `LView` containing the blueprint to adjust
 * @param numSlotsToAlloc The number of slots to alloc in the LView, should be >0
 * @param initialValue Initial value to store in blueprint
 */
export declare function allocExpando(tView: TView, lView: LView, numSlotsToAlloc: number, initialValue: any): number;
/**
 * Processes a view in the creation mode. This includes a number of steps in a specific order:
 * - creating view query functions (if any);
 * - executing a template function in the creation mode;
 * - updating static queries (if any);
 * - creating child components defined in a given view.
 */
export declare function renderView<T>(tView: TView, lView: LView, context: T): void;
/**
 * Processes a view in update mode. This includes a number of steps in a specific order:
 * - executing a template function in update mode;
 * - executing hooks;
 * - refreshing queries;
 * - setting host bindings;
 * - refreshing child (embedded and component) views.
 */
export declare function refreshView<T>(tView: TView, lView: LView, templateFn: ComponentTemplate<{}> | null, context: T): void;
export declare function renderComponentOrTemplate<T>(tView: TView, lView: LView, templateFn: ComponentTemplate<{}> | null, context: T): void;
export declare function executeContentQueries(tView: TView, tNode: TNode, lView: LView): void;
/**
 * Creates directive instances.
 */
export declare function createDirectivesInstances(tView: TView, lView: LView, tNode: TDirectiveHostNode): void;
/**
 * Takes a list of local names and indices and pushes the resolved local variable values
 * to LView in the same order as they are loaded in the template with load().
 */
export declare function saveResolvedLocalsInData(viewData: LView, tNode: TDirectiveHostNode, localRefExtractor?: LocalRefExtractor): void;
/**
 * Gets TView from a template function or creates a new TView
 * if it doesn't already exist.
 *
 * @param def ComponentDef
 * @returns TView
 */
export declare function getOrCreateTComponentView(def: ComponentDef<any>): TView;
/**
 * Creates a TView instance
 *
 * @param type Type of `TView`.
 * @param declTNode Declaration location of this `TView`.
 * @param templateFn Template function
 * @param decls The number of nodes, local refs, and pipes in this template
 * @param directives Registry of directives for this view
 * @param pipes Registry of pipes for this view
 * @param viewQuery View queries for this view
 * @param schemas Schemas for this view
 * @param consts Constants for this view
 */
export declare function createTView(type: TViewType, declTNode: TNode | null, templateFn: ComponentTemplate<any> | null, decls: number, vars: number, directives: DirectiveDefListOrFactory | null, pipes: PipeDefListOrFactory | null, viewQuery: ViewQueriesFunction<any> | null, schemas: SchemaMetadata[] | null, constsOrFactory: TConstantsOrFactory | null): TView;
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param rendererFactory Factory function to create renderer instance.
 * @param elementOrSelector Render element or CSS selector to locate the element.
 * @param encapsulation View Encapsulation defined for component that requests host element.
 */
export declare function locateHostElement(renderer: Renderer3, elementOrSelector: RElement | string, encapsulation: ViewEncapsulation): RElement;
/**
 * Saves context for this cleanup function in LView.cleanupInstances.
 *
 * On the first template pass, saves in TView:
 * - Cleanup function
 * - Index of context we just saved in LView.cleanupInstances
 */
export declare function storeCleanupWithContext(tView: TView, lView: LView, context: any, cleanupFn: Function): void;
/**
 * Constructs a TNode object from the arguments.
 *
 * @param tView `TView` to which this `TNode` belongs (used only in `ngDevMode`)
 * @param tParent Parent `TNode`
 * @param type The type of the node
 * @param index The index of the TNode in TView.data, adjusted for HEADER_OFFSET
 * @param tagName The tag name of the node
 * @param attrs The attributes defined on this node
 * @param tViews Any TViews attached to this node
 * @returns the TNode object
 */
export declare function createTNode(tView: TView, tParent: TElementNode | TContainerNode | null, type: TNodeType.Container, index: number, tagName: string | null, attrs: TAttributes | null): TContainerNode;
export declare function createTNode(tView: TView, tParent: TElementNode | TContainerNode | null, type: TNodeType.Element | TNodeType.Text, index: number, tagName: string | null, attrs: TAttributes | null): TElementNode;
export declare function createTNode(tView: TView, tParent: TElementNode | TContainerNode | null, type: TNodeType.ElementContainer, index: number, tagName: string | null, attrs: TAttributes | null): TElementContainerNode;
export declare function createTNode(tView: TView, tParent: TElementNode | TContainerNode | null, type: TNodeType.Icu, index: number, tagName: string | null, attrs: TAttributes | null): TIcuContainerNode;
export declare function createTNode(tView: TView, tParent: TElementNode | TContainerNode | null, type: TNodeType.Projection, index: number, tagName: string | null, attrs: TAttributes | null): TProjectionNode;
export declare function createTNode(tView: TView, tParent: TElementNode | TContainerNode | null, type: TNodeType, index: number, tagName: string | null, attrs: TAttributes | null): TNode;
export declare function elementPropertyInternal<T>(tView: TView, tNode: TNode, lView: LView, propName: string, value: T, renderer: Renderer3, sanitizer: SanitizerFn | null | undefined, nativeOnly: boolean): void;
export declare function setNgReflectProperties(lView: LView, element: RElement | RComment, type: TNodeType, dataValue: PropertyAliasValue, value: any): void;
export declare function matchingSchemas(tView: TView, tagName: string | null): boolean;
/**
 * Instantiate a root component.
 */
export declare function instantiateRootComponent<T>(tView: TView, lView: LView, def: ComponentDef<T>): T;
/**
 * Resolve the matched directives on a node.
 */
export declare function resolveDirectives(tView: TView, lView: LView, tNode: TElementNode | TContainerNode | TElementContainerNode, localRefs: string[] | null): boolean;
/**
 * Add `hostBindings` to the `TView.hostBindingOpCodes`.
 *
 * @param tView `TView` to which the `hostBindings` should be added.
 * @param tNode `TNode` the element which contains the directive
 * @param lView `LView` current `LView`
 * @param directiveIdx Directive index in view.
 * @param directiveVarsIdx Where will the directive's vars be stored
 * @param def `ComponentDef`/`DirectiveDef`, which contains the `hostVars`/`hostBindings` to add.
 */
export declare function registerHostBindingOpCodes(tView: TView, tNode: TNode, lView: LView, directiveIdx: number, directiveVarsIdx: number, def: ComponentDef<any> | DirectiveDef<any>): void;
/**
 * Invoke the host bindings in creation mode.
 *
 * @param def `DirectiveDef` which may contain the `hostBindings` function.
 * @param directive Instance of directive.
 */
export declare function invokeHostBindingsInCreationMode(def: DirectiveDef<any>, directive: any): void;
/**
 * Marks a given TNode as a component's host. This consists of:
 * - setting appropriate TNode flags;
 * - storing index of component's host element so it will be queued for view refresh during CD.
 */
export declare function markAsComponentHost(tView: TView, hostTNode: TNode): void;
/**
 * Initializes the flags on the current node, setting all indices to the initial index,
 * the directive count to 0, and adding the isComponent flag.
 * @param index the initial index
 */
export declare function initTNodeFlags(tNode: TNode, index: number, numberOfDirectives: number): void;
export declare function elementAttributeInternal(tNode: TNode, lView: LView, name: string, value: any, sanitizer: SanitizerFn | null | undefined, namespace: string | null | undefined): void;
export declare function setElementAttribute(renderer: Renderer3, element: RElement, namespace: string | null | undefined, tagName: string | null, name: string, value: any, sanitizer: SanitizerFn | null | undefined): void;
/**
 * Creates a LContainer, either from a container instruction, or for a ViewContainerRef.
 *
 * @param hostNative The host element for the LContainer
 * @param hostTNode The host TNode for the LContainer
 * @param currentView The parent view of the LContainer
 * @param native The native comment element
 * @param isForViewContainerRef Optional a flag indicating the ViewContainerRef case
 * @returns LContainer
 */
export declare function createLContainer(hostNative: RElement | RComment | LView, currentView: LView, native: RComment, tNode: TNode): LContainer;
/**
 * Adds LView or LContainer to the end of the current view tree.
 *
 * This structure will be used to traverse through nested views to remove listeners
 * and call onDestroy callbacks.
 *
 * @param lView The view where LView or LContainer should be added
 * @param adjustedHostIndex Index of the view's host node in LView[], adjusted for header
 * @param lViewOrLContainer The LView or LContainer to add to the view tree
 * @returns The state passed in
 */
export declare function addToViewTree<T extends LView | LContainer>(lView: LView, lViewOrLContainer: T): T;
/**
 * Marks current view and all ancestors dirty.
 *
 * Returns the root view because it is found as a byproduct of marking the view tree
 * dirty, and can be used by methods that consume markViewDirty() to easily schedule
 * change detection. Otherwise, such methods would need to traverse up the view tree
 * an additional time to get the root view and schedule a tick on it.
 *
 * @param lView The starting LView to mark dirty
 * @returns the root LView
 */
export declare function markViewDirty(lView: LView): LView | null;
/**
 * Used to schedule change detection on the whole application.
 *
 * Unlike `tick`, `scheduleTick` coalesces multiple calls into one change detection run.
 * It is usually called indirectly by calling `markDirty` when the view needs to be
 * re-rendered.
 *
 * Typically `scheduleTick` uses `requestAnimationFrame` to coalesce multiple
 * `scheduleTick` requests. The scheduling function can be overridden in
 * `renderComponent`'s `scheduler` option.
 */
export declare function scheduleTick(rootContext: RootContext, flags: RootContextFlags): void;
export declare function tickRootContext(rootContext: RootContext): void;
export declare function detectChangesInternal<T>(tView: TView, lView: LView, context: T): void;
/**
 * Synchronously perform change detection on a root view and its components.
 *
 * @param lView The view which the change detection should be performed on.
 */
export declare function detectChangesInRootView(lView: LView): void;
export declare function checkNoChangesInternal<T>(tView: TView, view: LView, context: T): void;
/**
 * Checks the change detector on a root view and its components, and throws if any changes are
 * detected.
 *
 * This is used in development mode to verify that running change detection doesn't
 * introduce other changes.
 *
 * @param lView The view which the change detection should be checked on.
 */
export declare function checkNoChangesInRootView(lView: LView): void;
/**
 * Stores meta-data for a property binding to be used by TestBed's `DebugElement.properties`.
 *
 * In order to support TestBed's `DebugElement.properties` we need to save, for each binding:
 * - a bound property name;
 * - a static parts of interpolated strings;
 *
 * A given property metadata is saved at the binding's index in the `TView.data` (in other words, a
 * property binding metadata will be stored in `TView.data` at the same index as a bound value in
 * `LView`). Metadata are represented as `INTERPOLATION_DELIMITER`-delimited string with the
 * following format:
 * - `propertyName` for bound properties;
 * - `propertyName�prefix�interpolation_static_part1�..interpolation_static_partN�suffix` for
 * interpolated properties.
 *
 * @param tData `TData` where meta-data will be saved;
 * @param tNode `TNode` that is a target of the binding;
 * @param propertyName bound property name;
 * @param bindingIndex binding index in `LView`
 * @param interpolationParts static interpolation parts (for property interpolations)
 */
export declare function storePropertyBindingMetadata(tData: TData, tNode: TNode, propertyName: string, bindingIndex: number, ...interpolationParts: string[]): void;
export declare const CLEAN_PROMISE: Promise<null>;
export declare function getLCleanup(view: LView): any[];
/**
 * There are cases where the sub component's renderer needs to be included
 * instead of the current renderer (see the componentSyntheticHost* instructions).
 */
export declare function loadComponentRenderer(currentDef: DirectiveDef<any> | null, tNode: TNode, lView: LView): Renderer3;
/** Handles an error thrown in an LView. */
export declare function handleError(lView: LView, error: any): void;
/**
 * Set the inputs of directives at the current node to corresponding value.
 *
 * @param tView The current TView
 * @param lView the `LView` which contains the directives.
 * @param inputs mapping between the public "input" name and privately-known,
 *        possibly minified, property names to write to.
 * @param value Value to set.
 */
export declare function setInputsForProperty(tView: TView, lView: LView, inputs: PropertyAliasValue, publicName: string, value: any): void;
/**
 * Updates a text binding at a given index in a given LView.
 */
export declare function textBindingInternal(lView: LView, index: number, value: string): void;
