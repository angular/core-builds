import { Injector } from '../di';
import { QueryList } from '../linker/query_list';
import { Renderer2, RendererFactory2, RendererType2 } from '../render/api';
import { Sanitizer, SecurityContext } from '../security';
export interface ViewDefinition {
    flags: ViewFlags;
    updateDirectives: ViewUpdateFn;
    updateRenderer: ViewUpdateFn;
    handleEvent: ViewHandleEventFn;
    /**
     * Order: Depth first.
     * Especially providers are before elements / anchors.
     */
    nodes: NodeDef[];
    /** aggregated NodeFlags for all nodes **/
    nodeFlags: NodeFlags;
    rootNodeFlags: NodeFlags;
    lastRenderRootNode: NodeDef;
    bindingCount: number;
    outputCount: number;
    /**
     * Binary or of all query ids that are matched by one of the nodes.
     * This includes query ids from templates as well.
     * Used as a bloom filter.
     */
    nodeMatchedQueries: number;
}
export declare type ViewDefinitionFactory = () => ViewDefinition;
export declare type ViewUpdateFn = (check: NodeCheckFn, view: ViewData) => void;
export interface NodeCheckFn {
    (view: ViewData, nodeIndex: number, argStyle: ArgumentType.Dynamic, values: any[]): any;
    (view: ViewData, nodeIndex: number, argStyle: ArgumentType.Inline, v0?: any, v1?: any, v2?: any, v3?: any, v4?: any, v5?: any, v6?: any, v7?: any, v8?: any, v9?: any): any;
}
export declare type ViewHandleEventFn = (view: ViewData, nodeIndex: number, eventName: string, event: any) => boolean;
export declare const enum ArgumentType {
    Inline = 0,
    Dynamic = 1,
}
/**
 * Bitmask for ViewDefintion.flags.
 */
export declare const enum ViewFlags {
    None = 0,
    OnPush = 2,
}
/**
 * A node definition in the view.
 *
 * Note: We use one type for all nodes so that loops that loop over all nodes
 * of a ViewDefinition stay monomorphic!
 */
export interface NodeDef {
    flags: NodeFlags;
    index: number;
    parent: NodeDef;
    renderParent: NodeDef;
    /** this is checked against NgContentDef.index to find matched nodes */
    ngContentIndex: number;
    /** number of transitive children */
    childCount: number;
    /** aggregated NodeFlags for all transitive children (does not include self) **/
    childFlags: NodeFlags;
    /** aggregated NodeFlags for all direct children (does not include self) **/
    directChildFlags: NodeFlags;
    bindingIndex: number;
    bindings: BindingDef[];
    outputIndex: number;
    outputs: OutputDef[];
    /**
     * references that the user placed on the element
     */
    references: {
        [refId: string]: QueryValueType;
    };
    /**
     * ids and value types of all queries that are matched by this node.
     */
    matchedQueries: {
        [queryId: number]: QueryValueType;
    };
    /** Binary or of all matched query ids of this node. */
    matchedQueryIds: number;
    /**
     * Binary or of all query ids that are matched by one of the children.
     * This includes query ids from templates as well.
     * Used as a bloom filter.
     */
    childMatchedQueries: number;
    element: ElementDef;
    provider: ProviderDef;
    text: TextDef;
    query: QueryDef;
    ngContent: NgContentDef;
}
/**
 * Bitmask for NodeDef.flags.
 * Naming convention:
 * - `Type...`: flags that are mutually exclusive
 * - `Cat...`: union of multiple `Type...` (short for category).
 */
export declare const enum NodeFlags {
    None = 0,
    TypeElement = 1,
    TypeText = 2,
    CatRenderNode = 3,
    TypeNgContent = 4,
    TypePipe = 8,
    TypePureArray = 16,
    TypePureObject = 32,
    TypePurePipe = 64,
    CatPureExpression = 112,
    TypeValueProvider = 128,
    TypeClassProvider = 256,
    TypeFactoryProvider = 512,
    TypeUseExistingProvider = 1024,
    LazyProvider = 2048,
    PrivateProvider = 4096,
    TypeDirective = 8192,
    Component = 16384,
    CatProvider = 10112,
    OnInit = 32768,
    OnDestroy = 65536,
    DoCheck = 131072,
    OnChanges = 262144,
    AfterContentInit = 524288,
    AfterContentChecked = 1048576,
    AfterViewInit = 2097152,
    AfterViewChecked = 4194304,
    EmbeddedViews = 8388608,
    ComponentView = 16777216,
    TypeContentQuery = 33554432,
    TypeViewQuery = 67108864,
    StaticQuery = 134217728,
    DynamicQuery = 268435456,
    CatQuery = 100663296,
    Types = 100673535,
}
export interface BindingDef {
    type: BindingType;
    ns: string;
    name: string;
    nonMinifiedName: string;
    securityContext: SecurityContext;
    suffix: string;
}
export declare const enum BindingType {
    ElementAttribute = 0,
    ElementClass = 1,
    ElementStyle = 2,
    ElementProperty = 3,
    ComponentHostProperty = 4,
    DirectiveProperty = 5,
    TextInterpolation = 6,
    PureExpressionProperty = 7,
}
export interface OutputDef {
    type: OutputType;
    target: 'window' | 'document' | 'body' | 'component';
    eventName: string;
    propName: string;
}
export declare const enum OutputType {
    ElementOutput = 0,
    DirectiveOutput = 1,
}
export declare const enum QueryValueType {
    ElementRef = 0,
    RenderElement = 1,
    TemplateRef = 2,
    ViewContainerRef = 3,
    Provider = 4,
}
export interface ElementDef {
    name: string;
    ns: string;
    /** ns, name, value */
    attrs: [string, string, string][];
    template: ViewDefinition;
    componentProvider: NodeDef;
    componentRendererType: RendererType2;
    componentView: ViewDefinitionFactory;
    /**
     * visible public providers for DI in the view,
     * as see from this element. This does not include private providers.
     */
    publicProviders: {
        [tokenKey: string]: NodeDef;
    };
    /**
     * same as visiblePublicProviders, but also includes private providers
     * that are located on this element.
     */
    allProviders: {
        [tokenKey: string]: NodeDef;
    };
    source: string;
    handleEvent: ElementHandleEventFn;
}
export declare type ElementHandleEventFn = (view: ViewData, eventName: string, event: any) => boolean;
export interface ProviderDef {
    token: any;
    tokenKey: string;
    value: any;
    deps: DepDef[];
}
export interface DepDef {
    flags: DepFlags;
    token: any;
    tokenKey: string;
}
/**
 * Bitmask for DI flags
 */
export declare const enum DepFlags {
    None = 0,
    SkipSelf = 1,
    Optional = 2,
    Value = 8,
}
export interface TextDef {
    prefix: string;
    source: string;
}
export interface QueryDef {
    id: number;
    filterId: number;
    bindings: QueryBindingDef[];
}
export interface QueryBindingDef {
    propName: string;
    bindingType: QueryBindingType;
}
export declare const enum QueryBindingType {
    First = 0,
    All = 1,
}
export interface NgContentDef {
    /**
     * this index is checked against NodeDef.ngContentIndex to find the nodes
     * that are matched by this ng-content.
     * Note that a NodeDef with an ng-content can be reprojected, i.e.
     * have a ngContentIndex on its own.
     */
    index: number;
}
/**
 * View instance data.
 * Attention: Adding fields to this is performance sensitive!
 */
export interface ViewData {
    def: ViewDefinition;
    root: RootData;
    renderer: Renderer2;
    parentNodeDef: NodeDef;
    parent: ViewData;
    viewContainerParent: ViewData;
    component: any;
    context: any;
    nodes: {
        [key: number]: NodeData;
    };
    state: ViewState;
    oldValues: any[];
    disposables: DisposableFn[];
}
/**
 * Bitmask of states
 */
export declare const enum ViewState {
    FirstCheck = 1,
    ChecksEnabled = 2,
    Errored = 4,
    Destroyed = 8,
}
export declare type DisposableFn = () => void;
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
export declare class NodeData {
    private __brand;
}
/**
 * Data for an instantiated NodeType.Text.
 *
 * Attention: Adding fields to this is performance sensitive!
 */
export interface TextData {
    renderText: any;
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 */
export declare function asTextData(view: ViewData, index: number): TextData;
/**
 * Data for an instantiated NodeType.Element.
 *
 * Attention: Adding fields to this is performance sensitive!
 */
export interface ElementData {
    renderElement: any;
    componentView: ViewData;
    embeddedViews: ViewData[];
    projectedViews: ViewData[];
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 */
export declare function asElementData(view: ViewData, index: number): ElementData;
/**
 * Data for an instantiated NodeType.Provider.
 *
 * Attention: Adding fields to this is performance sensitive!
 */
export interface ProviderData {
    instance: any;
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 */
export declare function asProviderData(view: ViewData, index: number): ProviderData;
/**
 * Data for an instantiated NodeType.PureExpression.
 *
 * Attention: Adding fields to this is performance sensitive!
 */
export interface PureExpressionData {
    value: any;
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 */
export declare function asPureExpressionData(view: ViewData, index: number): PureExpressionData;
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 */
export declare function asQueryList(view: ViewData, index: number): QueryList<any>;
export interface RootData {
    injector: Injector;
    projectableNodes: any[][];
    selectorOrNode: any;
    renderer: Renderer2;
    rendererFactory: RendererFactory2;
    sanitizer: Sanitizer;
}
export declare abstract class DebugContext {
    readonly abstract view: ViewData;
    readonly abstract nodeIndex: number;
    readonly abstract injector: Injector;
    readonly abstract component: any;
    readonly abstract providerTokens: any[];
    readonly abstract references: {
        [key: string]: any;
    };
    readonly abstract context: any;
    readonly abstract source: string;
    readonly abstract componentRenderElement: any;
    readonly abstract renderNode: any;
}
export declare const enum CheckType {
    CheckAndUpdate = 0,
    CheckNoChanges = 1,
}
export interface Services {
    setCurrentNode(view: ViewData, nodeIndex: number): void;
    createRootView(injector: Injector, projectableNodes: any[][], rootSelectorOrNode: string | any, def: ViewDefinition, context?: any): ViewData;
    createEmbeddedView(parent: ViewData, anchorDef: NodeDef, context?: any): ViewData;
    checkAndUpdateView(view: ViewData): void;
    checkNoChangesView(view: ViewData): void;
    destroyView(view: ViewData): void;
    resolveDep(view: ViewData, elDef: NodeDef, allowPrivateServices: boolean, depDef: DepDef, notFoundValue?: any): any;
    createDebugContext(view: ViewData, nodeIndex: number): DebugContext;
    handleEvent: ViewHandleEventFn;
    updateDirectives: (view: ViewData, checkType: CheckType) => void;
    updateRenderer: (view: ViewData, checkType: CheckType) => void;
    dirtyParentQueries: (view: ViewData) => void;
}
/**
 * This object is used to prevent cycles in the source files and to have a place where
 * debug mode can hook it. It is lazily filled when `isDevMode` is known.
 */
export declare const Services: Services;
