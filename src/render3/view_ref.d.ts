/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EmbeddedViewRef as viewEngine_EmbeddedViewRef } from '../linker/view_ref';
import { ComponentTemplate } from './interfaces/definition';
import { LViewNode } from './interfaces/node';
export declare class ViewRef<T> implements viewEngine_EmbeddedViewRef<T> {
    context: T;
    rootNodes: any[];
    constructor(context: T | null);
    destroy(): void;
    destroyed: boolean;
    onDestroy(callback: Function): void;
    markForCheck(): void;
    detach(): void;
    detectChanges(): void;
    checkNoChanges(): void;
    reattach(): void;
}
export declare class EmbeddedViewRef<T> extends ViewRef<T> {
    constructor(viewNode: LViewNode, template: ComponentTemplate<T>, context: T);
}
/**
 * Creates a ViewRef bundled with destroy functionality.
 *
 * @param context The context for this view
 * @returns The ViewRef
 */
export declare function createViewRef<T>(context: T): ViewRef<T>;
/** Interface for destroy logic. Implemented by addDestroyable. */
export interface DestroyRef<T> {
    /** Whether or not this object has been destroyed */
    destroyed: boolean;
    /** Destroy the instance and call all onDestroy callbacks. */
    destroy(): void;
    /** Register callbacks that should be called onDestroy */
    onDestroy(cb: Function): void;
}
/**
 * Decorates an object with destroy logic (implementing the DestroyRef interface)
 * and returns the enhanced object.
 *
 * @param obj The object to decorate
 * @returns The object with destroy logic
 */
export declare function addDestroyable<T, C>(obj: any): T & DestroyRef<C>;
