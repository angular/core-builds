/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../di/injection_token';
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
 * \@NgModule({
 *   providers: [provideRoutes(routes)]
 * })
 * class ModuleWithRoutes {}
 * ```
 *
 * \@experimental
 */
export const /** @type {?} */ ANALYZE_FOR_ENTRY_COMPONENTS = new InjectionToken('AnalyzeForEntryComponents');
/**
 * Type of the Attribute decorator / constructor function.
 *
 *
 * @record
 */
export function AttributeDecorator() { }
function AttributeDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (name: string): any;
    */
    /* TODO: handle strange member:
    new (name: string): Attribute;
    */
}
/**
 * Attribute decorator and metadata.
 *
 *
 * \@Annotation
 */
export const /** @type {?} */ Attribute = makeParamDecorator('Attribute', (attributeName) => ({ attributeName }));
/**
 * Base class for query metadata.
 *
 * See {\@link ContentChildren}, {\@link ContentChild}, {\@link ViewChildren}, {\@link ViewChild} for
 * more information.
 *
 *
 * @abstract
 */
export class Query {
}
/**
 * Type of the ContentChildren decorator / constructor function.
 *
 * See {\@link ContentChildren}.
 *
 *
 * @record
 */
export function ContentChildrenDecorator() { }
function ContentChildrenDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (selector: Type<any>|Function|string, opts?: {descendants?: boolean, read?: any}): any;
    */
    /* TODO: handle strange member:
    new (selector: Type<any>|Function|string, opts?: {descendants?: boolean, read?: any}): Query;
    */
}
/**
 * ContentChildren decorator and metadata.
 *
 *
 *  \@Annotation
 */
export const /** @type {?} */ ContentChildren = makePropDecorator('ContentChildren', (selector, data = {}) => (Object.assign({ selector, first: false, isViewQuery: false, descendants: false }, data)), Query);
/**
 * Type of the ContentChild decorator / constructor function.
 *
 *
 *
 * @record
 */
export function ContentChildDecorator() { }
function ContentChildDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (selector: Type<any>|Function|string, opts?: {read?: any}): any;
    */
    /* TODO: handle strange member:
    new (selector: Type<any>|Function|string, opts?: {read?: any}): ContentChild;
    */
}
/**
 * ContentChild decorator and metadata.
 *
 *
 * \@Annotation
 */
export const /** @type {?} */ ContentChild = makePropDecorator('ContentChild', (selector, data = {}) => (Object.assign({ selector, first: true, isViewQuery: false, descendants: true }, data)), Query);
/**
 * Type of the ViewChildren decorator / constructor function.
 *
 * See {\@link ViewChildren}.
 *
 *
 * @record
 */
export function ViewChildrenDecorator() { }
function ViewChildrenDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (selector: Type<any>|Function|string, opts?: {read?: any}): any;
    */
    /* TODO: handle strange member:
    new (selector: Type<any>|Function|string, opts?: {read?: any}): ViewChildren;
    */
}
/**
 * ViewChildren decorator and metadata.
 *
 *
 * \@Annotation
 */
export const /** @type {?} */ ViewChildren = makePropDecorator('ViewChildren', (selector, data = {}) => (Object.assign({ selector, first: false, isViewQuery: true, descendants: true }, data)), Query);
/**
 * Type of the ViewChild decorator / constructor function.
 *
 * See {\@link ViewChild}
 *
 *
 * @record
 */
export function ViewChildDecorator() { }
function ViewChildDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (selector: Type<any>|Function|string, opts?: {read?: any}): any;
    */
    /* TODO: handle strange member:
    new (selector: Type<any>|Function|string, opts?: {read?: any}): ViewChild;
    */
}
/**
 * ViewChild decorator and metadata.
 *
 *
 * \@Annotation
 */
export const /** @type {?} */ ViewChild = makePropDecorator('ViewChild', (selector, data) => (Object.assign({ selector, first: true, isViewQuery: true, descendants: true }, data)), Query);
//# sourceMappingURL=di.js.map