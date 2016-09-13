/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OpaqueToken } from '../di/opaque_token';
import { makeParamDecorator, makePropDecorator } from '../util/decorators';
/**
 * This token can be used to create a virtual provider that will populate the
 * `entryComponents` fields of components and ng modules based on its `useValue`.
 * All components that are referenced in the `useValue` value (either directly
 * or in a nested array or map) will be added to the `entryComponents` property.
 *
 * ### Example
 * The following example shows how the router can populate the `entryComponents`
 * field of an NgModule based on the router configuration which refers
 * to components.
 *
 * ```typescript
 * // helper function inside the router
 * function provideRoutes(routes) {
 *   return [
 *     {provide: ROUTES, useValue: routes},
 *     {provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: routes, multi: true}
 *   ];
 * }
 *
 * // user code
 * let routes = [
 *   {path: '/root', component: RootComp},
 *   {path: '/teams', component: TeamsComp}
 * ];
 *
 * @NgModule({
 *   providers: [provideRoutes(routes)]
 * })
 * class ModuleWithRoutes {}
 * ```
 *
 * @experimental
 */
export var ANALYZE_FOR_ENTRY_COMPONENTS = new OpaqueToken('AnalyzeForEntryComponents');
/**
 * Attribute decorator and metadata.
 *
 * @stable
 * @Annotation
 */
export var Attribute = makeParamDecorator('Attribute', [['attributeName', undefined]]);
/**
 * Base class for query metadata.
 *
 * See {@link ContentChildren}, {@link ContentChild}, {@link ViewChildren}, {@link ViewChild} for
 * more information.
 *
 * @stable
 */
export var Query = (function () {
    function Query() {
    }
    return Query;
}());
/**
 * @whatItDoes Configures a content query.
 *
 * @howToUse
 *
 * ```
 * import {Directive, QueryList, ContentChildren} from '@angular/core';
 *
 * @Directive({
 *   selector: 'someDir'
 * })
 * class SomeDir {
 *   @ContentChildren(ChildDirective) contentChildren: QueryList<ChildDirective>;
 *
 *   ngAfterContentInit() {
 *     // contentChildren is set
 *   }
 * }
 * ```
 *
 * @description
 *
 * You can use ContentChildren to get the {@link QueryList} of elements or directives from the
 * content DOM. Any time a child element is added, removed, or moved, the query list will be
 * updated,
 * and the changes observable of the query list will emit a new value.
 *
 * Content queries are set before the `ngAfterContentInit` callback is called.
 *
 * **Metadata Properties**:
 *
 * * **selector** - the directive type or the name used for querying.
 * * **descendants** - include only direct children or all descendants.
 * * **read** - read a different token from the queried elements.
 *
 * Let's look at an example:
 *
 * {@example core/di/ts/contentChildren/content_children_example.ts region='Component'}
 *
 * **npm package**: `@angular/core`
 *
 * @stable
 * @Annotation
 */
export var ContentChildren = makePropDecorator('ContentChildren', [
    ['selector', undefined],
    { first: false, isViewQuery: false, descendants: false, read: undefined }
], Query);
/**
 * @whatItDoes Configures a content query.
 *
 * @howToUse
 *
 * ```
 * import {Directive, ContentChild} from '@angular/core';
 *
 * @Directive({
 *   selector: 'someDir'
 * })
 * class SomeDir {
 *   @ContentChild(ChildDirective) contentChild;
 *
 *   ngAfterContentInit() {
 *     // contentChild is set
 *   }
 * }
 * ```
 *
 * @description
 *
 * You can use ContentChild to get the first element or the directive matching the selector from the
 * content DOM. If the content DOM changes, and a new child matches the selector,
 * the property will be updated.
 *
 * Content queries are set before the `ngAfterContentInit` callback is called.
 *
 * **Metadata Properties**:
 *
 * * **selector** - the directive type or the name used for querying.
 * * **read** - read a different token from the queried element.
 *
 * Let's look at an example:
 *
 * {@example core/di/ts/contentChild/content_child_example.ts region='Component'}
 *
 * **npm package**: `@angular/core`
 *
 * @stable
 * @Annotation
 */
export var ContentChild = makePropDecorator('ContentChild', [
    ['selector', undefined], {
        first: true,
        isViewQuery: false,
        descendants: false,
        read: undefined,
    }
], Query);
/**
 * @whatItDoes Configures a view query.
 *
 * @howToUse
 *
 * ```
 * import {Component, QueryList, ViewChildren} from '@angular/core';
 *
 * @Component({
 *   selector: 'someCmp',
 *   templateUrl: 'someCmp.html'
 * })
 * class SomeCmp {
 *   @ViewChildren(ChildDirective) viewChildren: QueryList<ChildDirective>;
 *
 *   ngAfterViewInit() {
 *     // viewChildren is set
 *   }
 * }
 * ```
 *
 * @description
 *
 * You can use ViewChildren to get the {@link QueryList} of elements or directives from the
 * view DOM. Any time a child element is added, removed, or moved, the query list will be updated,
 * and the changes observable of the query list will emit a new value.
 *
 * View queries are set before the `ngAfterViewInit` callback is called.
 *
 * **Metadata Properties**:
 *
 * * **selector** - the directive type or the name used for querying.
 * * **read** - read a different token from the queried elements.
 *
 * Let's look at an example:
 *
 * {@example core/di/ts/viewChildren/view_children_example.ts region='Component'}
 *
 * **npm package**: `@angular/core`
 *
 * @stable
 * @Annotation
 */
export var ViewChildren = makePropDecorator('ViewChildren', [
    ['selector', undefined], {
        first: false,
        isViewQuery: true,
        descendants: true,
        read: undefined,
    }
], Query);
/**
 * @whatItDoes Configures a view query.
 *
 * @howToUse
 *
 * ```
 * import {Component, QueryList, ViewChild} from '@angular/core';
 *
 * @Component({
 *   selector: 'someCmp',
 *   templateUrl: 'someCmp.html'
 * })
 * class SomeCmp {
 *   @ViewChild(ChildDirective) child: ChildDirective;
 *
 *   ngAfterViewInit() {
 *     // child is set
 *   }
 * }
 * ```
 *
 * @description
 *
 * You can use ViewChild to get the first element or the directive matching the selector from the
 * view DOM. If the view DOM changes, and a new child matches the selector,
 * the property will be updated.
 *
 * View queries are set before the `ngAfterViewInit` callback is called.
 *
 * **Metadata Properties**:
 *
 * * **selector** - the directive type or the name used for querying.
 * * **read** - read a different token from the queried elements.
 *
 * Let's look at an example:
 *
 * {@example core/di/ts/viewChild/view_child_example.ts region='Component'}
 *
 * **npm package**: `@angular/core`
 *
 * @stable
 * @Annotation
 */
export var ViewChild = makePropDecorator('ViewChild', [
    ['selector', undefined], {
        first: true,
        isViewQuery: true,
        descendants: true,
        read: undefined,
    }
], Query);
//# sourceMappingURL=di.js.map