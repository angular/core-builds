/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TNode } from '../render3/interfaces/node';
import { LView } from '../render3/interfaces/view';
import { ElementRef } from './element_ref';
import { EmbeddedViewRef } from './view_ref';
export declare const SWITCH_TEMPLATE_REF_FACTORY__POST_R3__: typeof injectTemplateRef;
/**
 * Represents an embedded template that can be used to instantiate embedded views.
 * To instantiate embedded views based on a template, use the `ViewContainerRef`
 * method `createEmbeddedView()`.
 *
 * Access a `TemplateRef` instance by placing a directive on an `<ng-template>`
 * element (or directive prefixed with `*`). The `TemplateRef` for the embedded view
 * is injected into the constructor of the directive,
 * using the `TemplateRef` token.
 *
 * You can also use a `Query` to find a `TemplateRef` associated with
 * a component or a directive.
 *
 * @see `ViewContainerRef`
 * @see [Navigate the Component Tree with DI](guide/dependency-injection-navtree)
 *
 * @publicApi
 */
export declare abstract class TemplateRef<C> {
    /**
     * The anchor element in the parent view for this embedded view.
     *
     * The data-binding and injection contexts of embedded views created from this `TemplateRef`
     * inherit from the contexts of this location.
     *
     * Typically new embedded views are attached to the view container of this location, but in
     * advanced use-cases, the view can be attached to a different container while keeping the
     * data-binding and injection context from the original location.
     *
     */
    abstract get elementRef(): ElementRef;
    /**
     * Instantiates an embedded view based on this template,
     * and attaches it to the view container.
     * @param context The data-binding context of the embedded view, as declared
     * in the `<ng-template>` usage.
     * @returns The new embedded view object.
     */
    abstract createEmbeddedView(context: C): EmbeddedViewRef<C>;
}
/**
 * Creates a TemplateRef given a node.
 *
 * @returns The TemplateRef instance to use
 */
export declare function injectTemplateRef<T>(): TemplateRef<T> | null;
/**
 * Creates a TemplateRef and stores it on the injector.
 *
 * @param hostTNode The node on which a TemplateRef is requested
 * @param hostLView The `LView` to which the node belongs
 * @returns The TemplateRef instance or null if we can't create a TemplateRef on a given node type
 */
export declare function createTemplateRef<T>(hostTNode: TNode, hostLView: LView): TemplateRef<T> | null;
