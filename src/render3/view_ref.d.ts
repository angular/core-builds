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
import { LView } from './interfaces/view';
export declare class ViewRef<T> implements viewEngine_EmbeddedViewRef<T> {
    private _view;
    context: T;
    rootNodes: any[];
    constructor(_view: LView, context: T | null);
    destroy(): void;
    destroyed: boolean;
    onDestroy(callback: Function): void;
    markForCheck(): void;
    /**
     * Detaches a view from the change detection tree.
     *
     * Detached views will not be checked during change detection runs, even if the view
     * is dirty. This can be used in combination with detectChanges to implement local
     * change detection checks.
     */
    detach(): void;
    /**
     * Re-attaches a view to the change detection tree.
     *
     * This can be used to re-attach views that were previously detached from the tree
     * using detach(). Views are attached to the tree by default.
     */
    reattach(): void;
    detectChanges(): void;
    checkNoChanges(): void;
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
export declare function createViewRef<T>(view: LView, context: T): ViewRef<T>;
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
