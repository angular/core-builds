/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export let ViewFlags = {};
ViewFlags.None = 0;
ViewFlags.DirectDom = 2;
ViewFlags.OnPush = 4;
ViewFlags[ViewFlags.None] = "None";
ViewFlags[ViewFlags.DirectDom] = "DirectDom";
ViewFlags[ViewFlags.OnPush] = "OnPush";
export let NodeType = {};
NodeType.Element = 0;
NodeType.Text = 1;
NodeType.Provider = 2;
NodeType.PureExpression = 3;
NodeType.Query = 4;
NodeType.NgContent = 5;
NodeType[NodeType.Element] = "Element";
NodeType[NodeType.Text] = "Text";
NodeType[NodeType.Provider] = "Provider";
NodeType[NodeType.PureExpression] = "PureExpression";
NodeType[NodeType.Query] = "Query";
NodeType[NodeType.NgContent] = "NgContent";
export let NodeFlags = {};
NodeFlags.None = 0;
NodeFlags.OnInit = 1;
NodeFlags.OnDestroy = 2;
NodeFlags.DoCheck = 4;
NodeFlags.OnChanges = 8;
NodeFlags.AfterContentInit = 16;
NodeFlags.AfterContentChecked = 32;
NodeFlags.AfterViewInit = 64;
NodeFlags.AfterViewChecked = 128;
NodeFlags.HasEmbeddedViews = 256;
NodeFlags.HasComponent = 512;
NodeFlags.HasContentQuery = 1024;
NodeFlags.HasViewQuery = 2048;
NodeFlags.LazyProvider = 4096;
NodeFlags[NodeFlags.None] = "None";
NodeFlags[NodeFlags.OnInit] = "OnInit";
NodeFlags[NodeFlags.OnDestroy] = "OnDestroy";
NodeFlags[NodeFlags.DoCheck] = "DoCheck";
NodeFlags[NodeFlags.OnChanges] = "OnChanges";
NodeFlags[NodeFlags.AfterContentInit] = "AfterContentInit";
NodeFlags[NodeFlags.AfterContentChecked] = "AfterContentChecked";
NodeFlags[NodeFlags.AfterViewInit] = "AfterViewInit";
NodeFlags[NodeFlags.AfterViewChecked] = "AfterViewChecked";
NodeFlags[NodeFlags.HasEmbeddedViews] = "HasEmbeddedViews";
NodeFlags[NodeFlags.HasComponent] = "HasComponent";
NodeFlags[NodeFlags.HasContentQuery] = "HasContentQuery";
NodeFlags[NodeFlags.HasViewQuery] = "HasViewQuery";
NodeFlags[NodeFlags.LazyProvider] = "LazyProvider";
export let BindingType = {};
BindingType.ElementAttribute = 0;
BindingType.ElementClass = 1;
BindingType.ElementStyle = 2;
BindingType.ElementProperty = 3;
BindingType.ProviderProperty = 4;
BindingType.Interpolation = 5;
BindingType.PureExpressionProperty = 6;
BindingType[BindingType.ElementAttribute] = "ElementAttribute";
BindingType[BindingType.ElementClass] = "ElementClass";
BindingType[BindingType.ElementStyle] = "ElementStyle";
BindingType[BindingType.ElementProperty] = "ElementProperty";
BindingType[BindingType.ProviderProperty] = "ProviderProperty";
BindingType[BindingType.Interpolation] = "Interpolation";
BindingType[BindingType.PureExpressionProperty] = "PureExpressionProperty";
export let QueryValueType = {};
QueryValueType.ElementRef = 0;
QueryValueType.RenderElement = 1;
QueryValueType.TemplateRef = 2;
QueryValueType.ViewContainerRef = 3;
QueryValueType.Provider = 4;
QueryValueType[QueryValueType.ElementRef] = "ElementRef";
QueryValueType[QueryValueType.RenderElement] = "RenderElement";
QueryValueType[QueryValueType.TemplateRef] = "TemplateRef";
QueryValueType[QueryValueType.ViewContainerRef] = "ViewContainerRef";
QueryValueType[QueryValueType.Provider] = "Provider";
export let ProviderType = {};
ProviderType.Value = 0;
ProviderType.Class = 1;
ProviderType.Factory = 2;
ProviderType.UseExisting = 3;
ProviderType[ProviderType.Value] = "Value";
ProviderType[ProviderType.Class] = "Class";
ProviderType[ProviderType.Factory] = "Factory";
ProviderType[ProviderType.UseExisting] = "UseExisting";
export let DepFlags = {};
DepFlags.None = 0;
DepFlags.SkipSelf = 1;
DepFlags.Optional = 2;
DepFlags[DepFlags.None] = "None";
DepFlags[DepFlags.SkipSelf] = "SkipSelf";
DepFlags[DepFlags.Optional] = "Optional";
export let PureExpressionType = {};
PureExpressionType.Array = 0;
PureExpressionType.Object = 1;
PureExpressionType.Pipe = 2;
PureExpressionType[PureExpressionType.Array] = "Array";
PureExpressionType[PureExpressionType.Object] = "Object";
PureExpressionType[PureExpressionType.Pipe] = "Pipe";
export let QueryBindingType = {};
QueryBindingType.First = 0;
QueryBindingType.All = 1;
QueryBindingType[QueryBindingType.First] = "First";
QueryBindingType[QueryBindingType.All] = "All";
export let ViewState = {};
ViewState.FirstCheck = 1;
ViewState.ChecksEnabled = 2;
ViewState.Errored = 4;
ViewState.Destroyed = 8;
ViewState[ViewState.FirstCheck] = "FirstCheck";
ViewState[ViewState.ChecksEnabled] = "ChecksEnabled";
ViewState[ViewState.Errored] = "Errored";
ViewState[ViewState.Destroyed] = "Destroyed";
/**
 * Node instance data.
 *
 * We have a separate type per NodeType to save memory
 * (TextData | ElementData | ProviderData | PureExpressionData | QueryList<any>)
 *
 * To keep our code monomorphic,
 * we prohibit using `NodeData` directly but enforce the use of accessors (`asElementData`, ...).
 * This way, no usage site can get a `NodeData` from view.nodes and then use it for different
 * purposes.
 */
export class NodeData {
}
function NodeData_tsickle_Closure_declarations() {
    /** @type {?} */
    NodeData.prototype.__brand;
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asTextData(view, index) {
    return (view.nodes[index]);
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asElementData(view, index) {
    return (view.nodes[index]);
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asProviderData(view, index) {
    return (view.nodes[index]);
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asPureExpressionData(view, index) {
    return (view.nodes[index]);
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asQueryList(view, index) {
    return (view.nodes[index]);
}
export let EntryAction = {};
EntryAction.CheckAndUpdate = 0;
EntryAction.CheckNoChanges = 1;
EntryAction.Create = 2;
EntryAction.Destroy = 3;
EntryAction.HandleEvent = 4;
EntryAction[EntryAction.CheckAndUpdate] = "CheckAndUpdate";
EntryAction[EntryAction.CheckNoChanges] = "CheckNoChanges";
EntryAction[EntryAction.Create] = "Create";
EntryAction[EntryAction.Destroy] = "Destroy";
EntryAction[EntryAction.HandleEvent] = "HandleEvent";
/**
 * This class is used to prevent cycles in the source files.
 * @abstract
 */
export class Refs {
    /**
     * @param {?} instance
     * @return {?}
     */
    static setInstance(instance) { Refs.instance = instance; }
    /**
     * @param {?} selector
     * @param {?} viewDefFactory
     * @return {?}
     */
    static createComponentFactory(selector, viewDefFactory) {
        return Refs.instance.createComponentFactory(selector, viewDefFactory);
    }
    /**
     * @param {?} data
     * @return {?}
     */
    static createViewRef(data) { return Refs.instance.createViewRef(data); }
    /**
     * @param {?} view
     * @param {?} elIndex
     * @return {?}
     */
    static createViewContainerRef(view, elIndex) {
        return Refs.instance.createViewContainerRef(view, elIndex);
    }
    /**
     * @param {?} parentView
     * @param {?} def
     * @return {?}
     */
    static createTemplateRef(parentView, def) {
        return Refs.instance.createTemplateRef(parentView, def);
    }
    /**
     * @param {?} view
     * @param {?} elIndex
     * @return {?}
     */
    static createInjector(view, elIndex) {
        return Refs.instance.createInjector(view, elIndex);
    }
    /**
     * @param {?} view
     * @param {?} nodeIndex
     * @return {?}
     */
    static createDebugContext(view, nodeIndex) {
        return Refs.instance.createDebugContext(view, nodeIndex);
    }
    /**
     * @abstract
     * @param {?} selector
     * @param {?} viewDefFactory
     * @return {?}
     */
    createComponentFactory(selector, viewDefFactory) { }
    /**
     * @abstract
     * @param {?} data
     * @return {?}
     */
    createViewRef(data) { }
    /**
     * @abstract
     * @param {?} view
     * @param {?} elIndex
     * @return {?}
     */
    createViewContainerRef(view, elIndex) { }
    /**
     * @abstract
     * @param {?} parentView
     * @param {?} def
     * @return {?}
     */
    createTemplateRef(parentView, def) { }
    /**
     * @abstract
     * @param {?} view
     * @param {?} elIndex
     * @return {?}
     */
    createInjector(view, elIndex) { }
    /**
     * @abstract
     * @param {?} view
     * @param {?} nodeIndex
     * @return {?}
     */
    createDebugContext(view, nodeIndex) { }
}
function Refs_tsickle_Closure_declarations() {
    /** @type {?} */
    Refs.instance;
}
//# sourceMappingURL=types.js.map