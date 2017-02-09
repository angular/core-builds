import * as v1 from '../render/api';
import { DebugContext, RendererV2 } from './types';
export declare class DirectDomRenderer implements RendererV2 {
    createElement(name: string): any;
    createComment(value: string): any;
    createText(value: string): any;
    appendChild(parent: any, newChild: any): void;
    insertBefore(parent: any, newChild: any, refChild: any): void;
    removeChild(parent: any, oldChild: any): void;
    selectRootElement(selectorOrNode: string | any, debugInfo?: DebugContext): any;
    parentNode(node: any): any;
    nextSibling(node: any): any;
    setAttribute(el: any, name: string, value: string): void;
    removeAttribute(el: any, name: string): void;
    addClass(el: any, name: string): void;
    removeClass(el: any, name: string): void;
    setStyle(el: any, style: string, value: any): void;
    removeStyle(el: any, style: string): void;
    setProperty(el: any, name: string, value: any): void;
    setText(node: any, value: string): void;
    listen(target: any, eventName: string, callback: (event: any) => boolean): () => void;
}
/**
 * A temporal implementation of `Renderer` until we migrated our current renderer
 * in all packages to the new API.
 *
 * Note that this is not complete, e.g. does not support shadow dom, view encapsulation, ...!
 */
export declare class LegacyRendererAdapter implements RendererV2 {
    private _delegate;
    constructor(rootDelegate: v1.RootRenderer);
    createElement(name: string, debugInfo?: DebugContext): any;
    createComment(value: string, debugInfo?: DebugContext): any;
    createText(value: string, debugInfo?: DebugContext): any;
    appendChild(parent: any, newChild: any): void;
    insertBefore(parent: any, newChild: any, refChild: any): void;
    removeChild(parent: any, oldChild: any): void;
    selectRootElement(selectorOrNode: any, debugInfo?: DebugContext): any;
    parentNode(node: any): any;
    nextSibling(node: any): any;
    setAttribute(el: any, name: string, value: string): void;
    removeAttribute(el: any, name: string): void;
    addClass(el: any, name: string): void;
    removeClass(el: any, name: string): void;
    setStyle(el: any, style: string, value: any): void;
    removeStyle(el: any, style: string): void;
    setProperty(el: any, name: string, value: any): void;
    setText(node: any, value: string): void;
    listen(target: any, eventName: string, callback: (event: any) => boolean): () => void;
}
