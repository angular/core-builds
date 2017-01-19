/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { unimplemented } from '../facade/errors';
import { isPresent } from '../facade/lang';
import { wtfCreateScope, wtfLeave } from '../profile/profile';
/**
 * Represents a container where one or more Views can be attached.
 *
 * The container can contain two kinds of Views. Host Views, created by instantiating a
 * {\@link Component} via {\@link #createComponent}, and Embedded Views, created by instantiating an
 * {\@link TemplateRef Embedded Template} via {\@link #createEmbeddedView}.
 *
 * The location of the View Container within the containing View is specified by the Anchor
 * `element`. Each View Container can have only one Anchor Element and each Anchor Element can only
 * have a single View Container.
 *
 * Root elements of Views attached to this container become siblings of the Anchor Element in
 * the Rendered View.
 *
 * To access a `ViewContainerRef` of an Element, you can either place a {\@link Directive} injected
 * with `ViewContainerRef` on the Element, or you obtain it via a {\@link ViewChild} query.
 * \@stable
 * @abstract
 */
export class ViewContainerRef {
    /**
     * Anchor element that specifies the location of this container in the containing View.
     * <!-- TODO: rename to anchorElement -->
     * @return {?}
     */
    get element() { return (unimplemented()); }
    /**
     * @return {?}
     */
    get injector() { return (unimplemented()); }
    /**
     * @return {?}
     */
    get parentInjector() { return (unimplemented()); }
    /**
     * Destroys all Views in this container.
     * @abstract
     * @return {?}
     */
    clear() { }
    /**
     * Returns the {\@link ViewRef} for the View located in this container at the specified index.
     * @abstract
     * @param {?} index
     * @return {?}
     */
    get(index) { }
    /**
     * Returns the number of Views currently attached to this container.
     * @return {?}
     */
    get length() { return (unimplemented()); }
    ;
    /**
     * Instantiates an Embedded View based on the {\@link TemplateRef `templateRef`} and inserts it
     * into this container at the specified `index`.
     *
     * If `index` is not specified, the new View will be inserted as the last View in the container.
     *
     * Returns the {\@link ViewRef} for the newly created View.
     * @abstract
     * @param {?} templateRef
     * @param {?=} context
     * @param {?=} index
     * @return {?}
     */
    createEmbeddedView(templateRef, context, index) { }
    /**
     * Instantiates a single {\@link Component} and inserts its Host View into this container at the
     * specified `index`.
     *
     * The component is instantiated using its {\@link ComponentFactory} which can be
     * obtained via {\@link ComponentFactoryResolver#resolveComponentFactory}.
     *
     * If `index` is not specified, the new View will be inserted as the last View in the container.
     *
     * You can optionally specify the {\@link Injector} that will be used as parent for the Component.
     *
     * Returns the {\@link ComponentRef} of the Host View created for the newly instantiated Component.
     * @abstract
     * @param {?} componentFactory
     * @param {?=} index
     * @param {?=} injector
     * @param {?=} projectableNodes
     * @return {?}
     */
    createComponent(componentFactory, index, injector, projectableNodes) { }
    /**
     * Inserts a View identified by a {\@link ViewRef} into the container at the specified `index`.
     *
     * If `index` is not specified, the new View will be inserted as the last View in the container.
     *
     * Returns the inserted {\@link ViewRef}.
     * @abstract
     * @param {?} viewRef
     * @param {?=} index
     * @return {?}
     */
    insert(viewRef, index) { }
    /**
     * Moves a View identified by a {\@link ViewRef} into the container at the specified `index`.
     *
     * Returns the inserted {\@link ViewRef}.
     * @abstract
     * @param {?} viewRef
     * @param {?} currentIndex
     * @return {?}
     */
    move(viewRef, currentIndex) { }
    /**
     * Returns the index of the View, specified via {\@link ViewRef}, within the current container or
     * `-1` if this container doesn't contain the View.
     * @abstract
     * @param {?} viewRef
     * @return {?}
     */
    indexOf(viewRef) { }
    /**
     * Destroys a View attached to this container at the specified `index`.
     *
     * If `index` is not specified, the last View in the container will be removed.
     * @abstract
     * @param {?=} index
     * @return {?}
     */
    remove(index) { }
    /**
     * Use along with {\@link #insert} to move a View within the current container.
     *
     * If the `index` param is omitted, the last {\@link ViewRef} is detached.
     * @abstract
     * @param {?=} index
     * @return {?}
     */
    detach(index) { }
}
export class ViewContainerRef_ {
    /**
     * @param {?} _element
     */
    constructor(_element) {
        this._element = _element;
        /** @internal */
        this._createComponentInContainerScope = wtfCreateScope('ViewContainerRef#createComponent()');
        /** @internal */
        this._insertScope = wtfCreateScope('ViewContainerRef#insert()');
        /** @internal */
        this._removeScope = wtfCreateScope('ViewContainerRef#remove()');
        /** @internal */
        this._detachScope = wtfCreateScope('ViewContainerRef#detach()');
    }
    /**
     * @param {?} index
     * @return {?}
     */
    get(index) { return this._element.nestedViews[index].ref; }
    /**
     * @return {?}
     */
    get length() {
        const /** @type {?} */ views = this._element.nestedViews;
        return isPresent(views) ? views.length : 0;
    }
    /**
     * @return {?}
     */
    get element() { return this._element.elementRef; }
    /**
     * @return {?}
     */
    get injector() { return this._element.injector; }
    /**
     * @return {?}
     */
    get parentInjector() { return this._element.parentInjector; }
    /**
     * @param {?} templateRef
     * @param {?=} context
     * @param {?=} index
     * @return {?}
     */
    createEmbeddedView(templateRef, context = null, index = -1) {
        const /** @type {?} */ viewRef = templateRef.createEmbeddedView(context);
        this.insert(viewRef, index);
        return viewRef;
    }
    /**
     * @param {?} componentFactory
     * @param {?=} index
     * @param {?=} injector
     * @param {?=} projectableNodes
     * @return {?}
     */
    createComponent(componentFactory, index = -1, injector = null, projectableNodes = null) {
        const /** @type {?} */ s = this._createComponentInContainerScope();
        const /** @type {?} */ contextInjector = injector || this._element.parentInjector;
        const /** @type {?} */ componentRef = componentFactory.create(contextInjector, projectableNodes);
        this.insert(componentRef.hostView, index);
        return wtfLeave(s, componentRef);
    }
    /**
     * @param {?} viewRef
     * @param {?=} index
     * @return {?}
     */
    insert(viewRef, index = -1) {
        const /** @type {?} */ s = this._insertScope();
        if (index == -1)
            index = this.length;
        const /** @type {?} */ viewRef_ = (viewRef);
        this._element.attachView(viewRef_.internalView, index);
        return wtfLeave(s, viewRef_);
    }
    /**
     * @param {?} viewRef
     * @param {?} currentIndex
     * @return {?}
     */
    move(viewRef, currentIndex) {
        const /** @type {?} */ s = this._insertScope();
        if (currentIndex == -1)
            return;
        const /** @type {?} */ viewRef_ = (viewRef);
        this._element.moveView(viewRef_.internalView, currentIndex);
        return wtfLeave(s, viewRef_);
    }
    /**
     * @param {?} viewRef
     * @return {?}
     */
    indexOf(viewRef) {
        return this._element.nestedViews.indexOf(((viewRef)).internalView);
    }
    /**
     * @param {?=} index
     * @return {?}
     */
    remove(index = -1) {
        const /** @type {?} */ s = this._removeScope();
        if (index == -1)
            index = this.length - 1;
        const /** @type {?} */ view = this._element.detachView(index);
        view.destroy();
        // view is intentionally not returned to the client.
        wtfLeave(s);
    }
    /**
     * @param {?=} index
     * @return {?}
     */
    detach(index = -1) {
        const /** @type {?} */ s = this._detachScope();
        if (index == -1)
            index = this.length - 1;
        const /** @type {?} */ view = this._element.detachView(index);
        return wtfLeave(s, view.ref);
    }
    /**
     * @return {?}
     */
    clear() {
        for (let /** @type {?} */ i = this.length - 1; i >= 0; i--) {
            this.remove(i);
        }
    }
}
function ViewContainerRef__tsickle_Closure_declarations() {
    /**
     * \@internal
     * @type {?}
     */
    ViewContainerRef_.prototype._createComponentInContainerScope;
    /**
     * \@internal
     * @type {?}
     */
    ViewContainerRef_.prototype._insertScope;
    /**
     * \@internal
     * @type {?}
     */
    ViewContainerRef_.prototype._removeScope;
    /**
     * \@internal
     * @type {?}
     */
    ViewContainerRef_.prototype._detachScope;
    /** @type {?} */
    ViewContainerRef_.prototype._element;
}
//# sourceMappingURL=view_container_ref.js.map