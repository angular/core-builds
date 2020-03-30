/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AttributeMarker, ComponentTemplate } from '..';
import { SchemaMetadata } from '../../core';
import { KeyValueArray } from '../../util/array_utils';
import { LContainer } from '../interfaces/container';
import { DirectiveDefList, PipeDefList, ViewQueriesFunction } from '../interfaces/definition';
import { I18nMutateOpCodes, I18nUpdateOpCodes, TIcu } from '../interfaces/i18n';
import { PropertyAliases, TConstants, TContainerNode, TElementNode, TNode as ITNode, TNodeFlags, TNodeProviderIndexes, TNodeType, TViewNode } from '../interfaces/node';
import { SelectorFlags } from '../interfaces/projection';
import { TQueries } from '../interfaces/query';
import { RComment, RElement, RNode } from '../interfaces/renderer';
import { TStylingKey, TStylingRange } from '../interfaces/styling';
import { ExpandoInstructions, HookData, LView, LViewFlags, TData, TView as ITView, TView, TViewType } from '../interfaces/view';
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
    new (type: TViewType, id: number, blueprint: LView, template: ComponentTemplate<{}> | null, queries: TQueries | null, viewQuery: ViewQueriesFunction<{}> | null, node: TViewNode | TElementNode | null, data: TData, bindingStartIndex: number, expandoStartIndex: number, expandoInstructions: ExpandoInstructions | null, firstCreatePass: boolean, firstUpdatePass: boolean, staticViewQueries: boolean, staticContentQueries: boolean, preOrderHooks: HookData | null, preOrderCheckHooks: HookData | null, contentHooks: HookData | null, contentCheckHooks: HookData | null, viewHooks: HookData | null, viewCheckHooks: HookData | null, destroyHooks: HookData | null, cleanup: any[] | null, contentQueries: number[] | null, components: number[] | null, directiveRegistry: DirectiveDefList | null, pipeRegistry: PipeDefList | null, firstChild: ITNode | null, schemas: SchemaMetadata[] | null, consts: TConstants | null): {
        type: TViewType;
        id: number;
        blueprint: LView;
        template: ComponentTemplate<{}> | null;
        queries: TQueries | null;
        viewQuery: ViewQueriesFunction<{}> | null;
        node: TViewNode | TElementNode | null;
        data: TData;
        bindingStartIndex: number;
        expandoStartIndex: number;
        expandoInstructions: ExpandoInstructions | null;
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
        destroyHooks: HookData | null;
        cleanup: any[] | null;
        contentQueries: number[] | null;
        components: number[] | null;
        directiveRegistry: DirectiveDefList | null;
        pipeRegistry: PipeDefList | null;
        firstChild: ITNode | null;
        schemas: SchemaMetadata[] | null;
        consts: TConstants | null;
        readonly template_: string;
    };
};
declare class TNode implements ITNode {
    tView_: TView;
    type: TNodeType;
    index: number;
    injectorIndex: number;
    directiveStart: number;
    directiveEnd: number;
    directiveStylingLast: number;
    propertyBindings: number[] | null;
    flags: TNodeFlags;
    providerIndexes: TNodeProviderIndexes;
    tagName: string | null;
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
    residualStyles: KeyValueArray<any> | undefined | null;
    classes: string | null;
    residualClasses: KeyValueArray<any> | undefined | null;
    classBindings: TStylingRange;
    styleBindings: TStylingRange;
    constructor(tView_: TView, //
    type: TNodeType, //
    index: number, //
    injectorIndex: number, //
    directiveStart: number, //
    directiveEnd: number, //
    directiveStylingLast: number, //
    propertyBindings: number[] | null, //
    flags: TNodeFlags, //
    providerIndexes: TNodeProviderIndexes, //
    tagName: string | null, //
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
    residualStyles: KeyValueArray<any> | undefined | null, //
    classes: string | null, //
    residualClasses: KeyValueArray<any> | undefined | null, //
    classBindings: TStylingRange, //
    styleBindings: TStylingRange);
    get type_(): string;
    get flags_(): string;
    get template_(): string;
    get styleBindings_(): DebugStyleBindings;
    get classBindings_(): DebugStyleBindings;
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
export declare function toDebug(obj: LView): LViewDebug;
export declare function toDebug(obj: LView | null): LViewDebug | null;
export declare function toDebug(obj: LView | LContainer | null): LViewDebug | LContainerDebug | null;
export declare class LViewDebug {
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
    get parent(): LViewDebug | LContainerDebug | null;
    get host(): string | null;
    get html(): string;
    get context(): {} | null;
    /**
     * The tree of nodes associated with the current `LView`. The nodes have been normalized into
     * a
     * tree structure with relevant details pulled out for readability.
     */
    get nodes(): DebugNode[] | null;
    get tView(): ITView;
    get cleanup(): any[] | null;
    get injector(): import("@angular/core/src/core").Injector | null;
    get rendererFactory(): import("@angular/core/src/render3/interfaces/renderer").RendererFactory3;
    get renderer(): import("@angular/core/src/render3/interfaces/renderer").ObjectOrientedRenderer3 | import("@angular/core/src/render3/interfaces/renderer").ProceduralRenderer3;
    get sanitizer(): import("@angular/core/src/core").Sanitizer | null;
    get childHead(): LViewDebug | LContainerDebug | null;
    get next(): LViewDebug | LContainerDebug | null;
    get childTail(): LViewDebug | LContainerDebug | null;
    get declarationView(): LViewDebug | null;
    get queries(): import("@angular/core/src/render3/interfaces/query").LQueries | null;
    get tHost(): TViewNode | TElementNode | null;
    /**
     * Normalized view of child views (and containers) attached at this location.
     */
    get childViews(): Array<LViewDebug | LContainerDebug>;
}
export interface DebugNode {
    html: string | null;
    native: Node;
    nodes: DebugNode[] | null;
    component: LViewDebug | null;
}
/**
 * Turns a flat list of nodes into a tree by walking the associated `TNode` tree.
 *
 * @param tNode
 * @param lView
 */
export declare function toDebugNodes(tNode: ITNode | null, lView: LView): DebugNode[] | null;
export declare function buildDebugNode(tNode: ITNode, lView: LView, nodeIndex: number): DebugNode;
export declare class LContainerDebug {
    private readonly _raw_lContainer;
    constructor(_raw_lContainer: LContainer);
    get activeIndex(): number;
    get hasTransplantedViews(): boolean;
    get views(): LViewDebug[];
    get parent(): LViewDebug | LContainerDebug | null;
    get movedViews(): LView[] | null;
    get host(): RElement | RComment | LView;
    get native(): RComment;
    get next(): LViewDebug | LContainerDebug | null;
}
/**
 * Return an `LView` value if found.
 *
 * @param value `LView` if any
 */
export declare function readLViewValue(value: any): LView | null;
export declare class I18NDebugItem {
    __raw_opCode: any;
    private _lView;
    nodeIndex: number;
    type: string;
    [key: string]: any;
    get tNode(): ITNode;
    constructor(__raw_opCode: any, _lView: LView, nodeIndex: number, type: string);
}
/**
 * Turns a list of "Create" & "Update" OpCodes into a human-readable list of operations for
 * debugging purposes.
 * @param mutateOpCodes mutation opCodes to read
 * @param updateOpCodes update opCodes to read
 * @param icus list of ICU expressions
 * @param lView The view the opCodes are acting on
 */
export declare function attachI18nOpCodesDebug(mutateOpCodes: I18nMutateOpCodes, updateOpCodes: I18nUpdateOpCodes, icus: TIcu[] | null, lView: LView): void;
export declare class I18nMutateOpCodesDebug implements I18nOpCodesDebug {
    private readonly __raw_opCodes;
    private readonly __lView;
    constructor(__raw_opCodes: I18nMutateOpCodes, __lView: LView);
    /**
     * A list of operation information about how the OpCodes will act on the view.
     */
    get operations(): any[];
}
export declare class I18nUpdateOpCodesDebug implements I18nOpCodesDebug {
    private readonly __raw_opCodes;
    private readonly icus;
    private readonly __lView;
    constructor(__raw_opCodes: I18nUpdateOpCodes, icus: TIcu[] | null, __lView: LView);
    /**
     * A list of operation information about how the OpCodes will act on the view.
     */
    get operations(): any[];
}
export interface I18nOpCodesDebug {
    operations: any[];
}
export {};
