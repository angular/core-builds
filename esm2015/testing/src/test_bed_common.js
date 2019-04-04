/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '@angular/core';
/**
 * An abstract class for inserting the root test component element in a platform independent way.
 *
 * \@publicApi
 */
export class TestComponentRenderer {
    /**
     * @param {?} rootElementId
     * @return {?}
     */
    insertRootElement(rootElementId) { }
}
/**
 * \@publicApi
 * @type {?}
 */
export const ComponentFixtureAutoDetect = new InjectionToken('ComponentFixtureAutoDetect');
/**
 * \@publicApi
 * @type {?}
 */
export const ComponentFixtureNoNgZone = new InjectionToken('ComponentFixtureNoNgZone');
/**
 * Static methods implemented by the `TestBedViewEngine` and `TestBedRender3`
 *
 * \@publicApi
 * @record
 */
export function TestBedStatic() { }
if (false) {
    /* Skipping unhandled member: new (...args: any[]): TestBed;*/
    /**
     * @param {?} ngModule
     * @param {?} platform
     * @param {?=} aotSummaries
     * @return {?}
     */
    TestBedStatic.prototype.initTestEnvironment = function (ngModule, platform, aotSummaries) { };
    /**
     * Reset the providers for the test injector.
     * @return {?}
     */
    TestBedStatic.prototype.resetTestEnvironment = function () { };
    /**
     * @return {?}
     */
    TestBedStatic.prototype.resetTestingModule = function () { };
    /**
     * Allows overriding default compiler providers and settings
     * which are defined in test_injector.js
     * @param {?} config
     * @return {?}
     */
    TestBedStatic.prototype.configureCompiler = function (config) { };
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     * @param {?} moduleDef
     * @return {?}
     */
    TestBedStatic.prototype.configureTestingModule = function (moduleDef) { };
    /**
     * Compile components with a `templateUrl` for the test's NgModule.
     * It is necessary to call this function
     * as fetching urls is asynchronous.
     * @return {?}
     */
    TestBedStatic.prototype.compileComponents = function () { };
    /**
     * @param {?} ngModule
     * @param {?} override
     * @return {?}
     */
    TestBedStatic.prototype.overrideModule = function (ngModule, override) { };
    /**
     * @param {?} component
     * @param {?} override
     * @return {?}
     */
    TestBedStatic.prototype.overrideComponent = function (component, override) { };
    /**
     * @param {?} directive
     * @param {?} override
     * @return {?}
     */
    TestBedStatic.prototype.overrideDirective = function (directive, override) { };
    /**
     * @param {?} pipe
     * @param {?} override
     * @return {?}
     */
    TestBedStatic.prototype.overridePipe = function (pipe, override) { };
    /**
     * @param {?} component
     * @param {?} template
     * @return {?}
     */
    TestBedStatic.prototype.overrideTemplate = function (component, template) { };
    /**
     * Overrides the template of the given component, compiling the template
     * in the context of the TestingModule.
     *
     * Note: This works for JIT and AOTed components as well.
     * @param {?} component
     * @param {?} template
     * @return {?}
     */
    TestBedStatic.prototype.overrideTemplateUsingTestingModule = function (component, template) { };
    /**
     * Overwrites all providers for the given token with the given provider definition.
     *
     * Note: This works for JIT and AOTed components as well.
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    TestBedStatic.prototype.overrideProvider = function (token, provider) { };
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    TestBedStatic.prototype.overrideProvider = function (token, provider) { };
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    TestBedStatic.prototype.overrideProvider = function (token, provider) { };
    /**
     * Overwrites all providers for the given token with the given provider definition.
     *
     * @deprecated as it makes all NgModules lazy. Introduced only for migrating off of it.
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    TestBedStatic.prototype.deprecatedOverrideProvider = function (token, provider) { };
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    TestBedStatic.prototype.deprecatedOverrideProvider = function (token, provider) { };
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    TestBedStatic.prototype.deprecatedOverrideProvider = function (token, provider) { };
    /**
     * @template T
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} flags
     * @return {?}
     */
    TestBedStatic.prototype.get = function (token, notFoundValue, flags) { };
    /**
     * @deprecated from v8.0.0 use Type<T> or InjectionToken<T>
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    TestBedStatic.prototype.get = function (token, notFoundValue) { };
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    TestBedStatic.prototype.createComponent = function (component) { };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWRfY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy90ZXN0X2JlZF9jb21tb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQW9DLGNBQWMsRUFBb0QsTUFBTSxlQUFlLENBQUM7Ozs7OztBQVduSSxNQUFNLE9BQU8scUJBQXFCOzs7OztJQUNoQyxpQkFBaUIsQ0FBQyxhQUFxQixJQUFHLENBQUM7Q0FDNUM7Ozs7O0FBS0QsTUFBTSxPQUFPLDBCQUEwQixHQUNuQyxJQUFJLGNBQWMsQ0FBWSw0QkFBNEIsQ0FBQzs7Ozs7QUFLL0QsTUFBTSxPQUFPLHdCQUF3QixHQUFHLElBQUksY0FBYyxDQUFZLDBCQUEwQixDQUFDOzs7Ozs7O0FBa0JqRyxtQ0F5RkM7Ozs7Ozs7OztJQXRGQyw4RkFDaUc7Ozs7O0lBS2pHLCtEQUE2Qjs7OztJQUU3Qiw2REFBb0M7Ozs7Ozs7SUFNcEMsa0VBQWlGOzs7Ozs7O0lBTWpGLDBFQUFxRTs7Ozs7OztJQU9yRSw0REFBa0M7Ozs7OztJQUVsQywyRUFBeUY7Ozs7OztJQUV6RiwrRUFBOEY7Ozs7OztJQUU5RiwrRUFBOEY7Ozs7OztJQUU5RixxRUFBK0U7Ozs7OztJQUUvRSw4RUFBd0U7Ozs7Ozs7Ozs7SUFReEUsZ0dBQTBGOzs7Ozs7Ozs7SUFPMUYsMEVBR2tCOzs7Ozs7SUFDbEIsMEVBQXdFOzs7Ozs7SUFDeEUsMEVBSWtCOzs7Ozs7Ozs7SUFPbEIsb0ZBR1M7Ozs7OztJQUNULG9GQUF5RTs7Ozs7O0lBQ3pFLG9GQUlrQjs7Ozs7Ozs7SUFFbEIseUVBQXNGOzs7Ozs7O0lBSXRGLGtFQUEwQzs7Ozs7O0lBRTFDLG1FQUE0RCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21wb25lbnQsIERpcmVjdGl2ZSwgSW5qZWN0RmxhZ3MsIEluamVjdGlvblRva2VuLCBOZ01vZHVsZSwgUGlwZSwgUGxhdGZvcm1SZWYsIFNjaGVtYU1ldGFkYXRhLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlfSBmcm9tICcuL2NvbXBvbmVudF9maXh0dXJlJztcbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge1Rlc3RCZWR9IGZyb20gJy4vdGVzdF9iZWQnO1xuXG4vKipcbiAqIEFuIGFic3RyYWN0IGNsYXNzIGZvciBpbnNlcnRpbmcgdGhlIHJvb3QgdGVzdCBjb21wb25lbnQgZWxlbWVudCBpbiBhIHBsYXRmb3JtIGluZGVwZW5kZW50IHdheS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBUZXN0Q29tcG9uZW50UmVuZGVyZXIge1xuICBpbnNlcnRSb290RWxlbWVudChyb290RWxlbWVudElkOiBzdHJpbmcpIHt9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgQ29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuW10+KCdDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCcpO1xuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSA9IG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuW10+KCdDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUnKTtcblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIFRlc3RNb2R1bGVNZXRhZGF0YSA9IHtcbiAgcHJvdmlkZXJzPzogYW55W10sXG4gIGRlY2xhcmF0aW9ucz86IGFueVtdLFxuICBpbXBvcnRzPzogYW55W10sXG4gIHNjaGVtYXM/OiBBcnJheTxTY2hlbWFNZXRhZGF0YXxhbnlbXT4sXG4gIGFvdFN1bW1hcmllcz86ICgpID0+IGFueVtdLFxufTtcblxuLyoqXG4gKiBTdGF0aWMgbWV0aG9kcyBpbXBsZW1lbnRlZCBieSB0aGUgYFRlc3RCZWRWaWV3RW5naW5lYCBhbmQgYFRlc3RCZWRSZW5kZXIzYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXN0QmVkU3RhdGljIHtcbiAgbmV3ICguLi5hcmdzOiBhbnlbXSk6IFRlc3RCZWQ7XG5cbiAgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICAgIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10sIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiwgYW90U3VtbWFyaWVzPzogKCkgPT4gYW55W10pOiBUZXN0QmVkO1xuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICovXG4gIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQ7XG5cbiAgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IFRlc3RCZWRTdGF0aWM7XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgY29tcGlsZXIgcHJvdmlkZXJzIGFuZCBzZXR0aW5nc1xuICAgKiB3aGljaCBhcmUgZGVmaW5lZCBpbiB0ZXN0X2luamVjdG9yLmpzXG4gICAqL1xuICBjb25maWd1cmVDb21waWxlcihjb25maWc6IHtwcm92aWRlcnM/OiBhbnlbXTsgdXNlSml0PzogYm9vbGVhbjt9KTogVGVzdEJlZFN0YXRpYztcblxuICAvKipcbiAgICogQWxsb3dzIG92ZXJyaWRpbmcgZGVmYXVsdCBwcm92aWRlcnMsIGRpcmVjdGl2ZXMsIHBpcGVzLCBtb2R1bGVzIG9mIHRoZSB0ZXN0IGluamVjdG9yLFxuICAgKiB3aGljaCBhcmUgZGVmaW5lZCBpbiB0ZXN0X2luamVjdG9yLmpzXG4gICAqL1xuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogVGVzdEJlZFN0YXRpYztcblxuICAvKipcbiAgICogQ29tcGlsZSBjb21wb25lbnRzIHdpdGggYSBgdGVtcGxhdGVVcmxgIGZvciB0aGUgdGVzdCdzIE5nTW9kdWxlLlxuICAgKiBJdCBpcyBuZWNlc3NhcnkgdG8gY2FsbCB0aGlzIGZ1bmN0aW9uXG4gICAqIGFzIGZldGNoaW5nIHVybHMgaXMgYXN5bmNocm9ub3VzLlxuICAgKi9cbiAgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+O1xuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IFRlc3RCZWRTdGF0aWM7XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiBUZXN0QmVkU3RhdGljO1xuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogVGVzdEJlZFN0YXRpYztcblxuICBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IFRlc3RCZWRTdGF0aWM7XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWRTdGF0aWM7XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgdGVtcGxhdGUgb2YgdGhlIGdpdmVuIGNvbXBvbmVudCwgY29tcGlsaW5nIHRoZSB0ZW1wbGF0ZVxuICAgKiBpbiB0aGUgY29udGV4dCBvZiB0aGUgVGVzdGluZ01vZHVsZS5cbiAgICpcbiAgICogTm90ZTogVGhpcyB3b3JrcyBmb3IgSklUIGFuZCBBT1RlZCBjb21wb25lbnRzIGFzIHdlbGwuXG4gICAqL1xuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZFN0YXRpYztcblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogTm90ZTogVGhpcyB3b3JrcyBmb3IgSklUIGFuZCBBT1RlZCBjb21wb25lbnRzIGFzIHdlbGwuXG4gICAqL1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljO1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogVGVzdEJlZFN0YXRpYztcbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk/OiBGdW5jdGlvbixcbiAgICB1c2VWYWx1ZT86IGFueSxcbiAgICBkZXBzPzogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljO1xuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBhcyBpdCBtYWtlcyBhbGwgTmdNb2R1bGVzIGxhenkuIEludHJvZHVjZWQgb25seSBmb3IgbWlncmF0aW5nIG9mZiBvZiBpdC5cbiAgICovXG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiB2b2lkO1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IHZvaWQ7XG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IFRlc3RCZWRTdGF0aWM7XG5cbiAgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IGFueTtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIGZyb20gdjguMC4wIHVzZSBUeXBlPFQ+IG9yIEluamVjdGlvblRva2VuPFQ+XG4gICAqL1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcblxuICBjcmVhdGVDb21wb25lbnQ8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPjtcbn1cbiJdfQ==