/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export var ArgumentType = {};
ArgumentType.Inline = 0;
ArgumentType.Dynamic = 1;
ArgumentType[ArgumentType.Inline] = "Inline";
ArgumentType[ArgumentType.Dynamic] = "Dynamic";
export var ViewFlags = {};
ViewFlags.None = 0;
ViewFlags.OnPush = 2;
ViewFlags[ViewFlags.None] = "None";
ViewFlags[ViewFlags.OnPush] = "OnPush";
export var NodeType = {};
NodeType.Element = 0;
NodeType.Text = 1;
NodeType.Directive = 2;
NodeType.Provider = 3;
NodeType.Pipe = 4;
NodeType.PureExpression = 5;
NodeType.Query = 6;
NodeType.NgContent = 7;
NodeType[NodeType.Element] = "Element";
NodeType[NodeType.Text] = "Text";
NodeType[NodeType.Directive] = "Directive";
NodeType[NodeType.Provider] = "Provider";
NodeType[NodeType.Pipe] = "Pipe";
NodeType[NodeType.PureExpression] = "PureExpression";
NodeType[NodeType.Query] = "Query";
NodeType[NodeType.NgContent] = "NgContent";
export var NodeFlags = {};
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
NodeFlags.HasStaticQuery = 2048;
NodeFlags.HasDynamicQuery = 4096;
NodeFlags.HasViewQuery = 8192;
NodeFlags.LazyProvider = 16384;
NodeFlags.PrivateProvider = 32768;
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
NodeFlags[NodeFlags.HasStaticQuery] = "HasStaticQuery";
NodeFlags[NodeFlags.HasDynamicQuery] = "HasDynamicQuery";
NodeFlags[NodeFlags.HasViewQuery] = "HasViewQuery";
NodeFlags[NodeFlags.LazyProvider] = "LazyProvider";
NodeFlags[NodeFlags.PrivateProvider] = "PrivateProvider";
export var BindingType = {};
BindingType.ElementAttribute = 0;
BindingType.ElementClass = 1;
BindingType.ElementStyle = 2;
BindingType.ElementProperty = 3;
BindingType.DirectiveProperty = 4;
BindingType.TextInterpolation = 5;
BindingType.PureExpressionProperty = 6;
BindingType[BindingType.ElementAttribute] = "ElementAttribute";
BindingType[BindingType.ElementClass] = "ElementClass";
BindingType[BindingType.ElementStyle] = "ElementStyle";
BindingType[BindingType.ElementProperty] = "ElementProperty";
BindingType[BindingType.DirectiveProperty] = "DirectiveProperty";
BindingType[BindingType.TextInterpolation] = "TextInterpolation";
BindingType[BindingType.PureExpressionProperty] = "PureExpressionProperty";
export var QueryValueType = {};
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
export var ProviderType = {};
ProviderType.Value = 0;
ProviderType.Class = 1;
ProviderType.Factory = 2;
ProviderType.UseExisting = 3;
ProviderType[ProviderType.Value] = "Value";
ProviderType[ProviderType.Class] = "Class";
ProviderType[ProviderType.Factory] = "Factory";
ProviderType[ProviderType.UseExisting] = "UseExisting";
export var DepFlags = {};
DepFlags.None = 0;
DepFlags.SkipSelf = 1;
DepFlags.Optional = 2;
DepFlags.Value = 8;
DepFlags[DepFlags.None] = "None";
DepFlags[DepFlags.SkipSelf] = "SkipSelf";
DepFlags[DepFlags.Optional] = "Optional";
DepFlags[DepFlags.Value] = "Value";
export var PureExpressionType = {};
PureExpressionType.Array = 0;
PureExpressionType.Object = 1;
PureExpressionType.Pipe = 2;
PureExpressionType[PureExpressionType.Array] = "Array";
PureExpressionType[PureExpressionType.Object] = "Object";
PureExpressionType[PureExpressionType.Pipe] = "Pipe";
export var QueryBindingType = {};
QueryBindingType.First = 0;
QueryBindingType.All = 1;
QueryBindingType[QueryBindingType.First] = "First";
QueryBindingType[QueryBindingType.All] = "All";
export var ViewState = {};
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
var NodeData = (function () {
    function NodeData() {
    }
    return NodeData;
}());
export { NodeData };
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
/**
 * @abstract
 */
var DebugContext = (function () {
    function DebugContext() {
    }
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.view = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.nodeIndex = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.injector = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.component = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.providerTokens = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.references = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.context = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.source = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.componentRenderElement = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.renderNode = function () { };
    return DebugContext;
}());
export { DebugContext };
/**
 * This object is used to prevent cycles in the source files and to have a place where
 * debug mode can hook it. It is lazily filled when `isDevMode` is known.
 */
export var /** @type {?} */ Services = {
    setCurrentNode: undefined,
    createRootView: undefined,
    createEmbeddedView: undefined,
    checkAndUpdateView: undefined,
    checkNoChangesView: undefined,
    destroyView: undefined,
    attachEmbeddedView: undefined,
    detachEmbeddedView: undefined,
    moveEmbeddedView: undefined,
    resolveDep: undefined,
    createDebugContext: undefined,
    handleEvent: undefined,
    updateDirectives: undefined,
    updateRenderer: undefined,
};
//# sourceMappingURL=types.js.map