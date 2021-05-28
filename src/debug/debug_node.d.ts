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
    /**
     * The callbacks attached to the component's @Output properties and/or the element's event
     * properties.
     */
    readonly listeners: DebugEventListener[];
    /**
     * The `DebugElement` parent. Will be `null` if this is the root element.
     */
    readonly parent: DebugElement | null;
    /**
     * The underlying DOM node.
     */
    readonly nativeNode: any;
    /**
     * The host dependency injector. For example, the root element's component instance injector.
     */
    readonly injector: Injector;
    /**
     * The element's own component instance, if it has one.
     */
    readonly componentInstance: any;
    /**
     * An object that provides parent context for this element. Often an ancestor component instance
     * that governs this element.
     *
     * When an element is repeated within *ngFor, the context is an `NgForOf` whose `$implicit`
     * property is the value of the row instance value. For example, the `hero` in `*ngFor="let hero
     * of heroes"`.
     */
    readonly context: any;
    /**
     * Dictionary of objects associated with template local variables (e.g. #foo), keyed by the local
     * variable name.
     */
    readonly references: {
        [key: string]: any;
    };
    /**
     * This component's injector lookup tokens. Includes the component itself plus the tokens that the
     * component lists in its providers metadata.
     */
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
 *
 * @see [Component testing scenarios](guide/testing-components-scenarios)
 * @see [Basics of testing components](guide/testing-components-basics)
 * @see [Testing utility APIs](guide/testing-utility-apis)
 */
export interface DebugElement extends DebugNode {
    /**
     * The element tag name, if it is an element.
     */
    readonly name: string;
    /**
     *  A map of property names to property values for an element.
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
    readonly properties: {
        [key: string]: any;
    };
    /**
     *  A map of attribute names to attribute values for an element.
     */
    readonly attributes: {
        [key: string]: string | null;
    };
    /**
     * A map containing the class names on the element as keys.
     *
     * This map is derived from the `className` property of the DOM element.
     *
     * Note: The values of this object will always be `true`. The class key will not appear in the KV
     * object if it does not exist on the element.
     *
     * @see [Element.className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className)
     */
    readonly classes: {
        [key: string]: boolean;
    };
    /**
     * The inline styles of the DOM element.
     *
     * Will be `null` if there is no `style` property on the underlying DOM element.
     *
     * @see [ElementCSSInlineStyle](https://developer.mozilla.org/en-US/docs/Web/API/ElementCSSInlineStyle/style)
     */
    readonly styles: {
        [key: string]: string | null;
    };
    /**
     * The `childNodes` of the DOM element as a `DebugNode` array.
     *
     * @see [Node.childNodes](https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes)
     */
    readonly childNodes: DebugNode[];
    /**
     * The underlying DOM element at the root of the component.
     */
    readonly nativeElement: any;
    /**
     * The immediate `DebugElement` children. Walk the tree by descending through `children`.
     */
    readonly children: DebugElement[];
    /**
     * @returns the first `DebugElement` that matches the predicate at any depth in the subtree.
     */
    query(predicate: Predicate<DebugElement>): DebugElement;
    /**
     * @returns All `DebugElement` matches for the predicate at any depth in the subtree.
     */
    queryAll(predicate: Predicate<DebugElement>): DebugElement[];
    /**
     * @returns All `DebugNode` matches for the predicate at any depth in the subtree.
     */
    queryAllNodes(predicate: Predicate<DebugNode>): DebugNode[];
    /**
     * Triggers the event by its name if there is a corresponding listener in the element's
     * `listeners` collection.
     *
     * If the event lacks a listener or there's some other problem, consider
     * calling `nativeElement.dispatchEvent(eventObject)`.
     *
     * @param eventName The name of the event to trigger
     * @param eventObj The _event object_ expected by the handler
     *
     * @see [Testing components scenarios](guide/testing-components-scenarios#trigger-event-handler)
     */
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
