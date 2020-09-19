/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di/injector';
import { DebugContext } from '../view/types';
/**
 * @publicApi
 */
export declare class DebugEventListener {
    name: string;
    callback: Function;
    constructor(name: string, callback: Function);
}
/**
 * @publicApi
 */
export interface DebugNode {
    readonly listeners: DebugEventListener[];
    readonly parent: DebugElement | null;
    readonly nativeNode: any;
    readonly injector: Injector;
    readonly componentInstance: any;
    readonly context: any;
    readonly references: {
        [key: string]: any;
    };
    readonly providerTokens: any[];
}
export declare class DebugNode__PRE_R3__ {
    readonly listeners: DebugEventListener[];
    readonly parent: DebugElement | null;
    readonly nativeNode: any;
    private readonly _debugContext;
    constructor(nativeNode: any, parent: DebugNode | null, _debugContext: DebugContext);
    get injector(): Injector;
    get componentInstance(): any;
    get context(): any;
    get references(): {
        [key: string]: any;
    };
    get providerTokens(): any[];
}
/**
 * @publicApi
 */
export interface DebugElement extends DebugNode {
    readonly name: string;
    readonly properties: {
        [key: string]: any;
    };
    readonly attributes: {
        [key: string]: string | null;
    };
    readonly classes: {
        [key: string]: boolean;
    };
    readonly styles: {
        [key: string]: string | null;
    };
    readonly childNodes: DebugNode[];
    readonly nativeElement: any;
    readonly children: DebugElement[];
    query(predicate: Predicate<DebugElement>): DebugElement;
    queryAll(predicate: Predicate<DebugElement>): DebugElement[];
    queryAllNodes(predicate: Predicate<DebugNode>): DebugNode[];
    triggerEventHandler(eventName: string, eventObj: any): void;
}
export declare class DebugElement__PRE_R3__ extends DebugNode__PRE_R3__ implements DebugElement {
    readonly name: string;
    readonly properties: {
        [key: string]: any;
    };
    readonly attributes: {
        [key: string]: string | null;
    };
    readonly classes: {
        [key: string]: boolean;
    };
    readonly styles: {
        [key: string]: string | null;
    };
    readonly childNodes: DebugNode[];
    readonly nativeElement: any;
    constructor(nativeNode: any, parent: any, _debugContext: DebugContext);
    addChild(child: DebugNode): void;
    removeChild(child: DebugNode): void;
    insertChildrenAfter(child: DebugNode, newChildren: DebugNode[]): void;
    insertBefore(refChild: DebugNode, newChild: DebugNode): void;
    query(predicate: Predicate<DebugElement>): DebugElement;
    queryAll(predicate: Predicate<DebugElement>): DebugElement[];
    queryAllNodes(predicate: Predicate<DebugNode>): DebugNode[];
    get children(): DebugElement[];
    triggerEventHandler(eventName: string, eventObj: any): void;
}
/**
 * @publicApi
 */
export declare function asNativeElements(debugEls: DebugElement[]): any;
declare class DebugNode__POST_R3__ implements DebugNode {
    readonly nativeNode: Node;
    constructor(nativeNode: Node);
    get parent(): DebugElement | null;
    get injector(): Injector;
    get componentInstance(): any;
    get context(): any;
    get listeners(): DebugEventListener[];
    get references(): {
        [key: string]: any;
    };
    get providerTokens(): any[];
}
declare class DebugElement__POST_R3__ extends DebugNode__POST_R3__ implements DebugElement {
    constructor(nativeNode: Element);
    get nativeElement(): Element | null;
    get name(): string;
    /**
     *  Gets a map of property names to property values for an element.
     *
     *  This map includes:
     *  - Regular property bindings (e.g. `[id]="id"`)
     *  - Host property bindings (e.g. `host: { '[id]': "id" }`)
     *  - Interpolated property bindings (e.g. `id="{{ value }}")
     *
     *  It does not include:
     *  - input property bindings (e.g. `[myCustomInput]="value"`)
     *  - attribute bindings (e.g. `[attr.role]="menu"`)
     */
    get properties(): {
        [key: string]: any;
    };
    get attributes(): {
        [key: string]: string | null;
    };
    get styles(): {
        [key: string]: string | null;
    };
    get classes(): {
        [key: string]: boolean;
    };
    get childNodes(): DebugNode[];
    get children(): DebugElement[];
    query(predicate: Predicate<DebugElement>): DebugElement;
    queryAll(predicate: Predicate<DebugElement>): DebugElement[];
    queryAllNodes(predicate: Predicate<DebugNode>): DebugNode[];
    triggerEventHandler(eventName: string, eventObj: any): void;
}
export declare function getDebugNode__POST_R3__(nativeNode: Element): DebugElement__POST_R3__;
export declare function getDebugNode__POST_R3__(nativeNode: Node): DebugNode__POST_R3__;
export declare function getDebugNode__POST_R3__(nativeNode: null): null;
/**
 * @publicApi
 */
export declare const getDebugNode: (nativeNode: any) => DebugNode | null;
export declare function getDebugNodeR2__PRE_R3__(nativeNode: any): DebugNode | null;
export declare function getDebugNodeR2__POST_R3__(_nativeNode: any): DebugNode | null;
export declare const getDebugNodeR2: (nativeNode: any) => DebugNode | null;
export declare function getAllDebugNodes(): DebugNode[];
export declare function indexDebugNode(node: DebugNode): void;
export declare function removeDebugNodeFromIndex(node: DebugNode): void;
/**
 * A boolean-valued function over a value, possibly including context information
 * regarding that value's position in an array.
 *
 * @publicApi
 */
export interface Predicate<T> {
    (value: T): boolean;
}
/**
 * @publicApi
 */
export declare const DebugNode: {
    new (...args: any[]): DebugNode;
};
/**
 * @publicApi
 */
export declare const DebugElement: {
    new (...args: any[]): DebugElement;
};
export {};
