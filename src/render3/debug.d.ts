/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LContainer } from './interfaces/container';
import { I18nMutateOpCodes, I18nUpdateOpCodes, TIcu } from './interfaces/i18n';
import { TNode } from './interfaces/node';
import { LQueries } from './interfaces/query';
import { RComment, RElement } from './interfaces/renderer';
import { StylingContext } from './interfaces/styling';
import { LView, LViewFlags } from './interfaces/view';
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
    readonly context: {} | null;
    /**
     * The tree of nodes associated with the current `LView`. The nodes have been normalized into a
     * tree structure with relevant details pulled out for readability.
     */
    readonly nodes: DebugNode[] | null;
    /**
     * Additional information which is hidden behind a property. The extra level of indirection is
     * done so that the debug view would not be cluttered with properties which are only rarely
     * relevant to the developer.
     */
    readonly __other__: {
        tView: import("@angular/core/src/render3/interfaces/view").TView;
        cleanup: any[] | null;
        injector: import("@angular/core").Injector | null;
        rendererFactory: import("@angular/core/src/render3/interfaces/renderer").RendererFactory3;
        renderer: import("@angular/core/src/render3/interfaces/renderer").Renderer3;
        sanitizer: import("@angular/core").Sanitizer | null;
        childHead: LViewDebug | LContainerDebug | null;
        next: LViewDebug | LContainerDebug | null;
        childTail: LViewDebug | LContainerDebug | null;
        declarationView: LViewDebug | null;
        contentQueries: import("@angular/core").QueryList<any>[] | null;
        queries: LQueries | null;
        tHost: import("@angular/core/src/render3/interfaces/node").TElementNode | import("@angular/core/src/render3/interfaces/node").TViewNode | null;
        bindingIndex: number;
    };
    /**
     * Normalized view of child views (and containers) attached at this location.
     */
    readonly childViews: Array<LViewDebug | LContainerDebug>;
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
export declare function toDebugNodes(tNode: TNode | null, lView: LView): DebugNode[] | null;
export declare class LContainerDebug {
    private readonly _raw_lContainer;
    constructor(_raw_lContainer: LContainer);
    readonly activeIndex: number;
    readonly views: LViewDebug[];
    readonly parent: LViewDebug | LContainerDebug | null;
    readonly queries: LQueries | null;
    readonly host: RElement | RComment | StylingContext | LView;
    readonly native: RComment;
    readonly __other__: {
        next: LViewDebug | LContainerDebug | null;
    };
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
    readonly tNode: TNode;
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
