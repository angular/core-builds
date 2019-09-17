/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AttributeMarker, ComponentTemplate } from '..';
import { SchemaMetadata } from '../../core';
import { LContainer } from '../interfaces/container';
import { ViewQueriesFunction } from '../interfaces/definition';
import { I18nMutateOpCodes, I18nUpdateOpCodes, TIcu } from '../interfaces/i18n';
import { PropertyAliases, TContainerNode, TElementNode, TNode as ITNode, TNode, TNodeFlags, TNodeProviderIndexes, TNodeType, TViewNode } from '../interfaces/node';
import { SelectorFlags } from '../interfaces/projection';
import { TQueries } from '../interfaces/query';
import { RComment, RElement, RNode } from '../interfaces/renderer';
import { ExpandoInstructions, LView, LViewFlags, TData, TView as ITView } from '../interfaces/view';
import { TStylingContext } from '../styling_next/interfaces';
import { DebugStyling as DebugNewStyling } from '../styling_next/styling_debug';
export declare const LViewArray: ArrayConstructor;
/**
 * This function clones a blueprint and creates LView.
 *
 * Simple slice will keep the same type, and we need it to be LView
 */
export declare function cloneToLView(list: any[]): LView;
/**
 * This class is a debug version of Object literal so that we can have constructor name show up in
 * debug tools in ngDevMode.
 */
export declare const TViewConstructor: {
    new (id: number, blueprint: LView, template: ComponentTemplate<{}> | null, queries: TQueries | null, viewQuery: ViewQueriesFunction<{}> | null, node: TElementNode | TViewNode | null, data: (string | number | import("@angular/core/src/core").Type<any> | ITNode | import("@angular/core/src/core").ɵDirectiveDef<any> | import("@angular/core/src/core").ɵComponentDef<any> | import("@angular/core/src/core").ɵPipeDef<any> | I18nUpdateOpCodes | import("@angular/core/src/render3/interfaces/i18n").TI18n | import("@angular/core/src/core").InjectionToken<any> | null)[], bindingStartIndex: number, expandoStartIndex: number, expandoInstructions: ExpandoInstructions | null, firstTemplatePass: boolean, staticViewQueries: boolean, staticContentQueries: boolean, preOrderHooks: (number | (() => void))[] | null, preOrderCheckHooks: (number | (() => void))[] | null, contentHooks: (number | (() => void))[] | null, contentCheckHooks: (number | (() => void))[] | null, viewHooks: (number | (() => void))[] | null, viewCheckHooks: (number | (() => void))[] | null, destroyHooks: (number | (() => void))[] | null, cleanup: any[] | null, contentQueries: number[] | null, components: number[] | null, directiveRegistry: (import("@angular/core/src/core").ɵDirectiveDef<any> | import("@angular/core/src/core").ɵComponentDef<any>)[] | null, pipeRegistry: import("@angular/core/src/core").ɵPipeDef<any>[] | null, firstChild: ITNode | null, schemas: SchemaMetadata[] | null): {
        id: number;
        blueprint: LView;
        template: ComponentTemplate<{}> | null;
        queries: TQueries | null;
        viewQuery: ViewQueriesFunction<{}> | null;
        node: TElementNode | TViewNode | null;
        data: (string | number | import("@angular/core/src/core").Type<any> | ITNode | import("@angular/core/src/core").ɵDirectiveDef<any> | import("@angular/core/src/core").ɵComponentDef<any> | import("@angular/core/src/core").ɵPipeDef<any> | I18nUpdateOpCodes | import("@angular/core/src/render3/interfaces/i18n").TI18n | import("@angular/core/src/core").InjectionToken<any> | null)[];
        bindingStartIndex: number;
        expandoStartIndex: number;
        expandoInstructions: ExpandoInstructions | null;
        firstTemplatePass: boolean;
        staticViewQueries: boolean;
        staticContentQueries: boolean;
        preOrderHooks: (number | (() => void))[] | null;
        preOrderCheckHooks: (number | (() => void))[] | null;
        contentHooks: (number | (() => void))[] | null;
        contentCheckHooks: (number | (() => void))[] | null;
        viewHooks: (number | (() => void))[] | null;
        viewCheckHooks: (number | (() => void))[] | null;
        destroyHooks: (number | (() => void))[] | null;
        cleanup: any[] | null;
        contentQueries: number[] | null;
        components: number[] | null;
        directiveRegistry: (import("@angular/core/src/core").ɵDirectiveDef<any> | import("@angular/core/src/core").ɵComponentDef<any>)[] | null;
        pipeRegistry: import("@angular/core/src/core").ɵPipeDef<any>[] | null;
        firstChild: ITNode | null;
        schemas: SchemaMetadata[] | null;
        readonly template_: string;
    };
};
export declare const TNodeConstructor: {
    new (tView_: ITView, type: TNodeType, index: number, injectorIndex: number, directiveStart: number, directiveEnd: number, propertyBindings: number[] | null, flags: TNodeFlags, providerIndexes: TNodeProviderIndexes, tagName: string | null, attrs: (string | (string | SelectorFlags)[] | AttributeMarker)[] | null, localNames: (string | number)[] | null, initialInputs: (string[] | null)[] | null | undefined, inputs: PropertyAliases | null | undefined, outputs: PropertyAliases | null | undefined, tViews: ITView | ITView[] | null, next: ITNode | null, projectionNext: ITNode | null, child: ITNode | null, parent: TElementNode | TContainerNode | null, projection: number | (ITNode | RNode[])[] | null, styles: TStylingContext | null, classes: TStylingContext | null): {
        tView_: ITView;
        type: TNodeType;
        index: number;
        injectorIndex: number;
        directiveStart: number;
        directiveEnd: number;
        propertyBindings: number[] | null;
        flags: TNodeFlags;
        providerIndexes: TNodeProviderIndexes;
        tagName: string | null;
        attrs: (string | (string | SelectorFlags)[] | AttributeMarker)[] | null;
        localNames: (string | number)[] | null;
        initialInputs: (string[] | null)[] | null | undefined;
        inputs: PropertyAliases | null | undefined;
        outputs: PropertyAliases | null | undefined;
        tViews: ITView | ITView[] | null;
        next: ITNode | null;
        projectionNext: ITNode | null;
        child: ITNode | null;
        parent: TElementNode | TContainerNode | null;
        projection: number | (ITNode | RNode[])[] | null;
        styles: TStylingContext | null;
        classes: TStylingContext | null;
        readonly type_: string;
        readonly flags_: string;
        readonly template_: string;
    };
};
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
    readonly flags: {
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
    readonly parent: LViewDebug | LContainerDebug | null;
    readonly host: string | null;
    readonly html: string;
    readonly context: {} | null;
    /**
     * The tree of nodes associated with the current `LView`. The nodes have been normalized into a
     * tree structure with relevant details pulled out for readability.
     */
    readonly nodes: DebugNode[] | null;
    readonly tView: ITView;
    readonly cleanup: any[] | null;
    readonly injector: import("@angular/core/src/core").Injector | null;
    readonly rendererFactory: import("@angular/core/src/render3/interfaces/renderer").RendererFactory3;
    readonly renderer: import("@angular/core/src/render3/interfaces/renderer").ObjectOrientedRenderer3 | import("@angular/core/src/render3/interfaces/renderer").ProceduralRenderer3;
    readonly sanitizer: import("@angular/core/src/core").Sanitizer | null;
    readonly childHead: LViewDebug | LContainerDebug | null;
    readonly next: LViewDebug | LContainerDebug | null;
    readonly childTail: LViewDebug | LContainerDebug | null;
    readonly declarationView: LViewDebug | null;
    readonly queries: import("@angular/core/src/render3/interfaces/query").LQueries | null;
    readonly tHost: TElementNode | TViewNode | null;
    readonly bindingIndex: number;
    /**
     * Normalized view of child views (and containers) attached at this location.
     */
    readonly childViews: Array<LViewDebug | LContainerDebug>;
}
export interface DebugNode {
    html: string | null;
    native: Node;
    styles: DebugNewStyling | null;
    classes: DebugNewStyling | null;
    nodes: DebugNode[] | null;
    component: LViewDebug | null;
}
/**
 * Turns a flat list of nodes into a tree by walking the associated `TNode` tree.
 *
 * @param tNode
 * @param lView
 */
export declare function toDebugNodes(tNode: TNode | null, lView: LView): DebugNode[] | null;
export declare function buildDebugNode(tNode: TNode, lView: LView): DebugNode;
export declare class LContainerDebug {
    private readonly _raw_lContainer;
    constructor(_raw_lContainer: LContainer);
    readonly activeIndex: number;
    readonly views: LViewDebug[];
    readonly parent: LViewDebug | LContainerDebug | null;
    readonly movedViews: LView[] | null;
    readonly host: RElement | RComment | LView;
    readonly native: RComment;
    readonly next: LViewDebug | LContainerDebug | null;
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
    readonly tNode: ITNode;
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
    readonly operations: any[];
}
export declare class I18nUpdateOpCodesDebug implements I18nOpCodesDebug {
    private readonly __raw_opCodes;
    private readonly icus;
    private readonly __lView;
    constructor(__raw_opCodes: I18nUpdateOpCodes, icus: TIcu[] | null, __lView: LView);
    /**
     * A list of operation information about how the OpCodes will act on the view.
     */
    readonly operations: any[];
}
export interface I18nOpCodesDebug {
    operations: any[];
}
