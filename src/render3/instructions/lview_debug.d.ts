/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../../di/injector';
import { SchemaMetadata } from '../../metadata/schema';
import { Sanitizer } from '../../sanitization/sanitizer';
import { KeyValueArray } from '../../util/array_utils';
import { LContainer } from '../interfaces/container';
import { ComponentTemplate, DirectiveDefList, PipeDefList, ViewQueriesFunction } from '../interfaces/definition';
import { AttributeMarker, InsertBeforeIndex, PropertyAliases, TConstants, TContainerNode, TElementNode, TNode as ITNode, TNodeFlags, TNodeProviderIndexes, TNodeType } from '../interfaces/node';
import { SelectorFlags } from '../interfaces/projection';
import { LQueries, TQueries } from '../interfaces/query';
import { Renderer3, RendererFactory3 } from '../interfaces/renderer';
import { RComment, RElement, RNode } from '../interfaces/renderer_dom';
import { TStylingKey, TStylingRange } from '../interfaces/styling';
import { DebugNode, DestroyHookData, HookData, HostBindingOpCodes, LContainerDebug as ILContainerDebug, LView, LViewDebug as ILViewDebug, LViewDebugRange, LViewFlags, TData, TView as ITView, TView, TViewType } from '../interfaces/view';
/**
 * This function clones a blueprint and creates LView.
 *
 * Simple slice will keep the same type, and we need it to be LView
 */
export declare function cloneToLViewFromTViewBlueprint(tView: TView): LView;
/**
 * This class is a debug version of Object literal so that we can have constructor name show up
 * in
 * debug tools in ngDevMode.
 */
export declare const TViewConstructor: {
    new (type: TViewType, blueprint: LView, template: ComponentTemplate<{}> | null, queries: TQueries | null, viewQuery: ViewQueriesFunction<{}> | null, declTNode: ITNode | null, data: TData, bindingStartIndex: number, expandoStartIndex: number, hostBindingOpCodes: HostBindingOpCodes | null, firstCreatePass: boolean, firstUpdatePass: boolean, staticViewQueries: boolean, staticContentQueries: boolean, preOrderHooks: HookData | null, preOrderCheckHooks: HookData | null, contentHooks: HookData | null, contentCheckHooks: HookData | null, viewHooks: HookData | null, viewCheckHooks: HookData | null, destroyHooks: DestroyHookData | null, cleanup: any[] | null, contentQueries: number[] | null, components: number[] | null, directiveRegistry: DirectiveDefList | null, pipeRegistry: PipeDefList | null, firstChild: ITNode | null, schemas: SchemaMetadata[] | null, consts: TConstants | null, incompleteFirstPass: boolean, _decls: number, _vars: number): {
        type: TViewType;
        blueprint: LView;
        template: ComponentTemplate<{}> | null;
        queries: TQueries | null;
        viewQuery: ViewQueriesFunction<{}> | null;
        declTNode: ITNode | null;
        data: TData;
        bindingStartIndex: number;
        expandoStartIndex: number;
        hostBindingOpCodes: HostBindingOpCodes | null;
        firstCreatePass: boolean;
        firstUpdatePass: boolean;
        staticViewQueries: boolean;
        staticContentQueries: boolean;
        preOrderHooks: HookData | null;
        preOrderCheckHooks: HookData | null;
        contentHooks: HookData | null;
        contentCheckHooks: HookData | null;
        viewHooks: HookData | null;
        viewCheckHooks: HookData | null;
        destroyHooks: DestroyHookData | null;
        cleanup: any[] | null;
        contentQueries: number[] | null;
        components: number[] | null;
        directiveRegistry: DirectiveDefList | null;
        pipeRegistry: PipeDefList | null;
        firstChild: ITNode | null;
        schemas: SchemaMetadata[] | null;
        consts: TConstants | null;
        incompleteFirstPass: boolean;
        _decls: number;
        _vars: number;
        readonly template_: string;
        readonly type_: string;
    };
};
declare class TNode implements ITNode {
    tView_: TView;
    type: TNodeType;
    index: number;
    insertBeforeIndex: InsertBeforeIndex;
    injectorIndex: number;
    directiveStart: number;
    directiveEnd: number;
    directiveStylingLast: number;
    propertyBindings: number[] | null;
    flags: TNodeFlags;
    providerIndexes: TNodeProviderIndexes;
    value: string | null;
    attrs: (string | AttributeMarker | (string | SelectorFlags)[])[] | null;
    mergedAttrs: (string | AttributeMarker | (string | SelectorFlags)[])[] | null;
    localNames: (string | number)[] | null;
    initialInputs: (string[] | null)[] | null | undefined;
    inputs: PropertyAliases | null;
    outputs: PropertyAliases | null;
    tViews: ITView | ITView[] | null;
    next: ITNode | null;
    projectionNext: ITNode | null;
    child: ITNode | null;
    parent: TElementNode | TContainerNode | null;
    projection: number | (ITNode | RNode[])[] | null;
    styles: string | null;
    stylesWithoutHost: string | null;
    residualStyles: KeyValueArray<any> | undefined | null;
    classes: string | null;
    classesWithoutHost: string | null;
    residualClasses: KeyValueArray<any> | undefined | null;
    classBindings: TStylingRange;
    styleBindings: TStylingRange;
    constructor(tView_: TView, //
    type: TNodeType, //
    index: number, //
    insertBeforeIndex: InsertBeforeIndex, //
    injectorIndex: number, //
    directiveStart: number, //
    directiveEnd: number, //
    directiveStylingLast: number, //
    propertyBindings: number[] | null, //
    flags: TNodeFlags, //
    providerIndexes: TNodeProviderIndexes, //
    value: string | null, //
    attrs: (string | AttributeMarker | (string | SelectorFlags)[])[] | null, //
    mergedAttrs: (string | AttributeMarker | (string | SelectorFlags)[])[] | null, //
    localNames: (string | number)[] | null, //
    initialInputs: (string[] | null)[] | null | undefined, //
    inputs: PropertyAliases | null, //
    outputs: PropertyAliases | null, //
    tViews: ITView | ITView[] | null, //
    next: ITNode | null, //
    projectionNext: ITNode | null, //
    child: ITNode | null, //
    parent: TElementNode | TContainerNode | null, //
    projection: number | (ITNode | RNode[])[] | null, //
    styles: string | null, //
    stylesWithoutHost: string | null, //
    residualStyles: KeyValueArray<any> | undefined | null, //
    classes: string | null, //
    classesWithoutHost: string | null, //
    residualClasses: KeyValueArray<any> | undefined | null, //
    classBindings: TStylingRange, //
    styleBindings: TStylingRange);
    /**
     * Return a human debug version of the set of `NodeInjector`s which will be consulted when
     * resolving tokens from this `TNode`.
     *
     * When debugging applications, it is often difficult to determine which `NodeInjector`s will be
     * consulted. This method shows a list of `DebugNode`s representing the `TNode`s which will be
     * consulted in order when resolving a token starting at this `TNode`.
     *
     * The original data is stored in `LView` and `TView` with a lot of offset indexes, and so it is
     * difficult to reason about.
     *
     * @param lView The `LView` instance for this `TNode`.
     */
    debugNodeInjectorPath(lView: LView): DebugNode[];
    get type_(): string;
    get flags_(): string;
    get template_(): string;
    get styleBindings_(): DebugStyleBindings;
    get classBindings_(): DebugStyleBindings;
    get providerIndexStart_(): number;
    get providerIndexEnd_(): number;
}
export declare const TNodeDebug: typeof TNode;
export declare type TNodeDebug = TNode;
export interface DebugStyleBindings extends Array<KeyValueArray<any> | DebugStyleBinding | string | null> {
}
export interface DebugStyleBinding {
    key: TStylingKey;
    index: number;
    isTemplate: boolean;
    prevDuplicate: boolean;
    nextDuplicate: boolean;
    prevIndex: number;
    nextIndex: number;
}
/**
 * This function clones a blueprint and creates TData.
 *
 * Simple slice will keep the same type, and we need it to be TData
 */
export declare function cloneToTViewData(list: any[]): TData;
export declare const LViewBlueprint: ArrayConstructor;
export declare const MatchesArray: ArrayConstructor;
export declare const TViewComponents: ArrayConstructor;
export declare const TNodeLocalNames: ArrayConstructor;
export declare const TNodeInitialInputs: ArrayConstructor;
export declare const TNodeInitialData: ArrayConstructor;
export declare const LCleanup: ArrayConstructor;
export declare const TCleanup: ArrayConstructor;
export declare function attachLViewDebug(lView: LView): void;
export declare function attachLContainerDebug(lContainer: LContainer): void;
export declare function toDebug(obj: LView): ILViewDebug;
export declare function toDebug(obj: LView | null): ILViewDebug | null;
export declare function toDebug(obj: LView | LContainer | null): ILViewDebug | ILContainerDebug | null;
export declare class LViewDebug implements ILViewDebug {
    private readonly _raw_lView;
    constructor(_raw_lView: LView);
    /**
     * Flags associated with the `LView` unpacked into a more readable state.
     */
    get flags(): {
        __raw__flags__: LViewFlags;
        initPhaseState: number;
        creationMode: boolean;
        firstViewPass: boolean;
        checkAlways: boolean;
        dirty: boolean;
        attached: boolean;
        destroyed: boolean;
        isRoot: boolean;
        indexWithinInitPhase: number;
    };
    get parent(): ILViewDebug | ILContainerDebug | null;
    get hostHTML(): string | null;
    get html(): string;
    get context(): {} | null;
    /**
     * The tree of nodes associated with the current `LView`. The nodes have been normalized into
     * a tree structure with relevant details pulled out for readability.
     */
    get nodes(): DebugNode[];
    get template(): string;
    get tView(): ITView;
    get cleanup(): any[] | null;
    get injector(): Injector | null;
    get rendererFactory(): RendererFactory3;
    get renderer(): Renderer3;
    get sanitizer(): Sanitizer | null;
    get childHead(): ILViewDebug | ILContainerDebug | null;
    get next(): ILViewDebug | ILContainerDebug | null;
    get childTail(): ILViewDebug | ILContainerDebug | null;
    get declarationView(): ILViewDebug | null;
    get queries(): LQueries | null;
    get tHost(): ITNode | null;
    get decls(): LViewDebugRange;
    get vars(): LViewDebugRange;
    get expando(): LViewDebugRange;
    /**
     * Normalized view of child views (and containers) attached at this location.
     */
    get childViews(): Array<ILViewDebug | ILContainerDebug>;
}
/**
 * Turns a flat list of nodes into a tree by walking the associated `TNode` tree.
 *
 * @param tNode
 * @param lView
 */
export declare function toDebugNodes(tNode: ITNode | null, lView: LView): DebugNode[];
export declare function buildDebugNode(tNode: ITNode, lView: LView): DebugNode;
export declare class LContainerDebug implements ILContainerDebug {
    private readonly _raw_lContainer;
    constructor(_raw_lContainer: LContainer);
    get hasTransplantedViews(): boolean;
    get views(): ILViewDebug[];
    get parent(): ILViewDebug | null;
    get movedViews(): LView[] | null;
    get host(): RElement | RComment | LView;
    get native(): RComment;
    get next(): ILViewDebug | ILContainerDebug | null;
}
export {};
