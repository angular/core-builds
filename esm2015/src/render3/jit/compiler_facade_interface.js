/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * A set of interfaces which are shared between `@angular/core` and `@angular/compiler` to allow
 * for late binding of `@angular/compiler` for JIT purposes.
 *
 * This file has two copies. Please ensure that they are in sync:
 *  - packages/compiler/src/compiler_facade_interface.ts             (master)
 *  - packages/core/src/render3/jit/compiler_facade_interface.ts     (copy)
 *
 * Please ensure that the two files are in sync using this command:
 * ```
 * cp packages/compiler/src/compiler_facade_interface.ts \
 *    packages/core/src/render3/jit/compiler_facade_interface.ts
 * ```
 */
/**
 * @record
 */
export function ExportedCompilerFacade() { }
if (false) {
    /** @type {?} */
    ExportedCompilerFacade.prototype.ɵcompilerFacade;
}
/**
 * @record
 */
export function CompilerFacade() { }
if (false) {
    /** @type {?} */
    CompilerFacade.prototype.R3ResolvedDependencyType;
    /**
     * @param {?} angularCoreEnv
     * @param {?} sourceMapUrl
     * @param {?} meta
     * @return {?}
     */
    CompilerFacade.prototype.compilePipe = function (angularCoreEnv, sourceMapUrl, meta) { };
    /**
     * @param {?} angularCoreEnv
     * @param {?} sourceMapUrl
     * @param {?} meta
     * @return {?}
     */
    CompilerFacade.prototype.compileInjectable = function (angularCoreEnv, sourceMapUrl, meta) { };
    /**
     * @param {?} angularCoreEnv
     * @param {?} sourceMapUrl
     * @param {?} meta
     * @return {?}
     */
    CompilerFacade.prototype.compileInjector = function (angularCoreEnv, sourceMapUrl, meta) { };
    /**
     * @param {?} angularCoreEnv
     * @param {?} sourceMapUrl
     * @param {?} meta
     * @return {?}
     */
    CompilerFacade.prototype.compileNgModule = function (angularCoreEnv, sourceMapUrl, meta) { };
    /**
     * @param {?} angularCoreEnv
     * @param {?} sourceMapUrl
     * @param {?} meta
     * @return {?}
     */
    CompilerFacade.prototype.compileDirective = function (angularCoreEnv, sourceMapUrl, meta) { };
    /**
     * @param {?} angularCoreEnv
     * @param {?} sourceMapUrl
     * @param {?} meta
     * @return {?}
     */
    CompilerFacade.prototype.compileComponent = function (angularCoreEnv, sourceMapUrl, meta) { };
}
/**
 * @record
 */
export function CoreEnvironment() { }
/** @enum {number} */
const R3ResolvedDependencyType = {
    Token: 0,
    Attribute: 1,
};
export { R3ResolvedDependencyType };
R3ResolvedDependencyType[R3ResolvedDependencyType.Token] = 'Token';
R3ResolvedDependencyType[R3ResolvedDependencyType.Attribute] = 'Attribute';
/**
 * @record
 */
export function R3DependencyMetadataFacade() { }
if (false) {
    /** @type {?} */
    R3DependencyMetadataFacade.prototype.token;
    /** @type {?} */
    R3DependencyMetadataFacade.prototype.resolved;
    /** @type {?} */
    R3DependencyMetadataFacade.prototype.host;
    /** @type {?} */
    R3DependencyMetadataFacade.prototype.optional;
    /** @type {?} */
    R3DependencyMetadataFacade.prototype.self;
    /** @type {?} */
    R3DependencyMetadataFacade.prototype.skipSelf;
}
/**
 * @record
 */
export function R3PipeMetadataFacade() { }
if (false) {
    /** @type {?} */
    R3PipeMetadataFacade.prototype.name;
    /** @type {?} */
    R3PipeMetadataFacade.prototype.type;
    /** @type {?} */
    R3PipeMetadataFacade.prototype.pipeName;
    /** @type {?} */
    R3PipeMetadataFacade.prototype.deps;
    /** @type {?} */
    R3PipeMetadataFacade.prototype.pure;
}
/**
 * @record
 */
export function R3InjectableMetadataFacade() { }
if (false) {
    /** @type {?} */
    R3InjectableMetadataFacade.prototype.name;
    /** @type {?} */
    R3InjectableMetadataFacade.prototype.type;
    /** @type {?} */
    R3InjectableMetadataFacade.prototype.typeArgumentCount;
    /** @type {?} */
    R3InjectableMetadataFacade.prototype.ctorDeps;
    /** @type {?} */
    R3InjectableMetadataFacade.prototype.providedIn;
    /** @type {?|undefined} */
    R3InjectableMetadataFacade.prototype.useClass;
    /** @type {?|undefined} */
    R3InjectableMetadataFacade.prototype.useFactory;
    /** @type {?|undefined} */
    R3InjectableMetadataFacade.prototype.useExisting;
    /** @type {?|undefined} */
    R3InjectableMetadataFacade.prototype.useValue;
    /** @type {?|undefined} */
    R3InjectableMetadataFacade.prototype.userDeps;
}
/**
 * @record
 */
export function R3NgModuleMetadataFacade() { }
if (false) {
    /** @type {?} */
    R3NgModuleMetadataFacade.prototype.type;
    /** @type {?} */
    R3NgModuleMetadataFacade.prototype.bootstrap;
    /** @type {?} */
    R3NgModuleMetadataFacade.prototype.declarations;
    /** @type {?} */
    R3NgModuleMetadataFacade.prototype.imports;
    /** @type {?} */
    R3NgModuleMetadataFacade.prototype.exports;
    /** @type {?} */
    R3NgModuleMetadataFacade.prototype.emitInline;
}
/**
 * @record
 */
export function R3InjectorMetadataFacade() { }
if (false) {
    /** @type {?} */
    R3InjectorMetadataFacade.prototype.name;
    /** @type {?} */
    R3InjectorMetadataFacade.prototype.type;
    /** @type {?} */
    R3InjectorMetadataFacade.prototype.deps;
    /** @type {?} */
    R3InjectorMetadataFacade.prototype.providers;
    /** @type {?} */
    R3InjectorMetadataFacade.prototype.imports;
}
/**
 * @record
 */
export function R3DirectiveMetadataFacade() { }
if (false) {
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.name;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.type;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.typeArgumentCount;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.typeSourceSpan;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.deps;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.selector;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.queries;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.host;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.propMetadata;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.lifecycle;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.inputs;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.outputs;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.usesInheritance;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.exportAs;
    /** @type {?} */
    R3DirectiveMetadataFacade.prototype.providers;
}
/**
 * @record
 */
export function R3ComponentMetadataFacade() { }
if (false) {
    /** @type {?} */
    R3ComponentMetadataFacade.prototype.template;
    /** @type {?} */
    R3ComponentMetadataFacade.prototype.preserveWhitespaces;
    /** @type {?} */
    R3ComponentMetadataFacade.prototype.animations;
    /** @type {?} */
    R3ComponentMetadataFacade.prototype.viewQueries;
    /** @type {?} */
    R3ComponentMetadataFacade.prototype.pipes;
    /** @type {?} */
    R3ComponentMetadataFacade.prototype.directives;
    /** @type {?} */
    R3ComponentMetadataFacade.prototype.styles;
    /** @type {?} */
    R3ComponentMetadataFacade.prototype.encapsulation;
    /** @type {?} */
    R3ComponentMetadataFacade.prototype.viewProviders;
    /** @type {?|undefined} */
    R3ComponentMetadataFacade.prototype.interpolation;
}
/**
 * @record
 */
export function R3QueryMetadataFacade() { }
if (false) {
    /** @type {?} */
    R3QueryMetadataFacade.prototype.propertyName;
    /** @type {?} */
    R3QueryMetadataFacade.prototype.first;
    /** @type {?} */
    R3QueryMetadataFacade.prototype.predicate;
    /** @type {?} */
    R3QueryMetadataFacade.prototype.descendants;
    /** @type {?} */
    R3QueryMetadataFacade.prototype.read;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXJfZmFjYWRlX2ludGVyZmFjZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L2NvbXBpbGVyX2ZhY2FkZV9pbnRlcmZhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCQSw0Q0FBNEU7OztJQUFsQyxpREFBZ0M7Ozs7O0FBRTFFLG9DQWVDOzs7SUFEQyxrREFBMEQ7Ozs7Ozs7SUFiMUQseUZBQ1E7Ozs7Ozs7SUFDUiwrRkFDa0c7Ozs7Ozs7SUFDbEcsNkZBQ2dHOzs7Ozs7O0lBQ2hHLDZGQUNnRzs7Ozs7OztJQUNoRyw4RkFDaUc7Ozs7Ozs7SUFDakcsOEZBQ2lHOzs7OztBQUtuRyxxQ0FBOEQ7OztJQWE1RCxRQUFTO0lBQ1QsWUFBYTs7Ozs7Ozs7QUFHZixnREFPQzs7O0lBTkMsMkNBQVc7O0lBQ1gsOENBQW1DOztJQUNuQywwQ0FBYzs7SUFDZCw4Q0FBa0I7O0lBQ2xCLDBDQUFjOztJQUNkLDhDQUFrQjs7Ozs7QUFHcEIsMENBTUM7OztJQUxDLG9DQUFhOztJQUNiLG9DQUFVOztJQUNWLHdDQUFpQjs7SUFDakIsb0NBQXdDOztJQUN4QyxvQ0FBYzs7Ozs7QUFHaEIsZ0RBV0M7OztJQVZDLDBDQUFhOztJQUNiLDBDQUFVOztJQUNWLHVEQUEwQjs7SUFDMUIsOENBQTRDOztJQUM1QyxnREFBZ0I7O0lBQ2hCLDhDQUFlOztJQUNmLGdEQUFpQjs7SUFDakIsaURBQWtCOztJQUNsQiw4Q0FBZTs7SUFDZiw4Q0FBd0M7Ozs7O0FBRzFDLDhDQU9DOzs7SUFOQyx3Q0FBVTs7SUFDViw2Q0FBc0I7O0lBQ3RCLGdEQUF5Qjs7SUFDekIsMkNBQW9COztJQUNwQiwyQ0FBb0I7O0lBQ3BCLDhDQUFvQjs7Ozs7QUFHdEIsOENBTUM7OztJQUxDLHdDQUFhOztJQUNiLHdDQUFVOztJQUNWLHdDQUF3Qzs7SUFDeEMsNkNBQWlCOztJQUNqQiwyQ0FBZTs7Ozs7QUFHakIsK0NBZ0JDOzs7SUFmQyx5Q0FBYTs7SUFDYix5Q0FBVTs7SUFDVixzREFBMEI7O0lBQzFCLG1EQUFxQjs7SUFDckIseUNBQXdDOztJQUN4Qyw2Q0FBc0I7O0lBQ3RCLDRDQUFpQzs7SUFDakMseUNBQThCOztJQUM5QixpREFBcUM7O0lBQ3JDLDhDQUFxQzs7SUFDckMsMkNBQWlCOztJQUNqQiw0Q0FBa0I7O0lBQ2xCLG9EQUF5Qjs7SUFDekIsNkNBQXNCOztJQUN0Qiw4Q0FBMkI7Ozs7O0FBRzdCLCtDQVdDOzs7SUFWQyw2Q0FBaUI7O0lBQ2pCLHdEQUE2Qjs7SUFDN0IsK0NBQTRCOztJQUM1QixnREFBcUM7O0lBQ3JDLDBDQUF3Qjs7SUFDeEIsK0NBQWtEOztJQUNsRCwyQ0FBaUI7O0lBQ2pCLGtEQUFpQzs7SUFDakMsa0RBQStCOztJQUMvQixrREFBaUM7Ozs7O0FBS25DLDJDQU1DOzs7SUFMQyw2Q0FBcUI7O0lBQ3JCLHNDQUFlOztJQUNmLDBDQUF3Qjs7SUFDeEIsNENBQXFCOztJQUNyQixxQ0FBZSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG4vKipcbiAqIEEgc2V0IG9mIGludGVyZmFjZXMgd2hpY2ggYXJlIHNoYXJlZCBiZXR3ZWVuIGBAYW5ndWxhci9jb3JlYCBhbmQgYEBhbmd1bGFyL2NvbXBpbGVyYCB0byBhbGxvd1xuICogZm9yIGxhdGUgYmluZGluZyBvZiBgQGFuZ3VsYXIvY29tcGlsZXJgIGZvciBKSVQgcHVycG9zZXMuXG4gKlxuICogVGhpcyBmaWxlIGhhcyB0d28gY29waWVzLiBQbGVhc2UgZW5zdXJlIHRoYXQgdGhleSBhcmUgaW4gc3luYzpcbiAqICAtIHBhY2thZ2VzL2NvbXBpbGVyL3NyYy9jb21waWxlcl9mYWNhZGVfaW50ZXJmYWNlLnRzICAgICAgICAgICAgIChtYXN0ZXIpXG4gKiAgLSBwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ppdC9jb21waWxlcl9mYWNhZGVfaW50ZXJmYWNlLnRzICAgICAoY29weSlcbiAqXG4gKiBQbGVhc2UgZW5zdXJlIHRoYXQgdGhlIHR3byBmaWxlcyBhcmUgaW4gc3luYyB1c2luZyB0aGlzIGNvbW1hbmQ6XG4gKiBgYGBcbiAqIGNwIHBhY2thZ2VzL2NvbXBpbGVyL3NyYy9jb21waWxlcl9mYWNhZGVfaW50ZXJmYWNlLnRzIFxcXG4gKiAgICBwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ppdC9jb21waWxlcl9mYWNhZGVfaW50ZXJmYWNlLnRzXG4gKiBgYGBcbiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIEV4cG9ydGVkQ29tcGlsZXJGYWNhZGUgeyDJtWNvbXBpbGVyRmFjYWRlOiBDb21waWxlckZhY2FkZTsgfVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBpbGVyRmFjYWRlIHtcbiAgY29tcGlsZVBpcGUoYW5ndWxhckNvcmVFbnY6IENvcmVFbnZpcm9ubWVudCwgc291cmNlTWFwVXJsOiBzdHJpbmcsIG1ldGE6IFIzUGlwZU1ldGFkYXRhRmFjYWRlKTpcbiAgICAgIGFueTtcbiAgY29tcGlsZUluamVjdGFibGUoXG4gICAgICBhbmd1bGFyQ29yZUVudjogQ29yZUVudmlyb25tZW50LCBzb3VyY2VNYXBVcmw6IHN0cmluZywgbWV0YTogUjNJbmplY3RhYmxlTWV0YWRhdGFGYWNhZGUpOiBhbnk7XG4gIGNvbXBpbGVJbmplY3RvcihcbiAgICAgIGFuZ3VsYXJDb3JlRW52OiBDb3JlRW52aXJvbm1lbnQsIHNvdXJjZU1hcFVybDogc3RyaW5nLCBtZXRhOiBSM0luamVjdG9yTWV0YWRhdGFGYWNhZGUpOiBhbnk7XG4gIGNvbXBpbGVOZ01vZHVsZShcbiAgICAgIGFuZ3VsYXJDb3JlRW52OiBDb3JlRW52aXJvbm1lbnQsIHNvdXJjZU1hcFVybDogc3RyaW5nLCBtZXRhOiBSM05nTW9kdWxlTWV0YWRhdGFGYWNhZGUpOiBhbnk7XG4gIGNvbXBpbGVEaXJlY3RpdmUoXG4gICAgICBhbmd1bGFyQ29yZUVudjogQ29yZUVudmlyb25tZW50LCBzb3VyY2VNYXBVcmw6IHN0cmluZywgbWV0YTogUjNEaXJlY3RpdmVNZXRhZGF0YUZhY2FkZSk6IGFueTtcbiAgY29tcGlsZUNvbXBvbmVudChcbiAgICAgIGFuZ3VsYXJDb3JlRW52OiBDb3JlRW52aXJvbm1lbnQsIHNvdXJjZU1hcFVybDogc3RyaW5nLCBtZXRhOiBSM0NvbXBvbmVudE1ldGFkYXRhRmFjYWRlKTogYW55O1xuXG4gIFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZTogdHlwZW9mIFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb3JlRW52aXJvbm1lbnQgeyBbbmFtZTogc3RyaW5nXTogRnVuY3Rpb247IH1cblxuZXhwb3J0IHR5cGUgU3RyaW5nTWFwID0ge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmc7XG59O1xuXG5leHBvcnQgdHlwZSBTdHJpbmdNYXBXaXRoUmVuYW1lID0ge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBbc3RyaW5nLCBzdHJpbmddO1xufTtcblxuZXhwb3J0IHR5cGUgUHJvdmlkZXIgPSBhbnk7XG5cbmV4cG9ydCBlbnVtIFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZSB7XG4gIFRva2VuID0gMCxcbiAgQXR0cmlidXRlID0gMSxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSM0RlcGVuZGVuY3lNZXRhZGF0YUZhY2FkZSB7XG4gIHRva2VuOiBhbnk7XG4gIHJlc29sdmVkOiBSM1Jlc29sdmVkRGVwZW5kZW5jeVR5cGU7XG4gIGhvc3Q6IGJvb2xlYW47XG4gIG9wdGlvbmFsOiBib29sZWFuO1xuICBzZWxmOiBib29sZWFuO1xuICBza2lwU2VsZjogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSM1BpcGVNZXRhZGF0YUZhY2FkZSB7XG4gIG5hbWU6IHN0cmluZztcbiAgdHlwZTogYW55O1xuICBwaXBlTmFtZTogc3RyaW5nO1xuICBkZXBzOiBSM0RlcGVuZGVuY3lNZXRhZGF0YUZhY2FkZVtdfG51bGw7XG4gIHB1cmU6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUjNJbmplY3RhYmxlTWV0YWRhdGFGYWNhZGUge1xuICBuYW1lOiBzdHJpbmc7XG4gIHR5cGU6IGFueTtcbiAgdHlwZUFyZ3VtZW50Q291bnQ6IG51bWJlcjtcbiAgY3RvckRlcHM6IFIzRGVwZW5kZW5jeU1ldGFkYXRhRmFjYWRlW118bnVsbDtcbiAgcHJvdmlkZWRJbjogYW55O1xuICB1c2VDbGFzcz86IGFueTtcbiAgdXNlRmFjdG9yeT86IGFueTtcbiAgdXNlRXhpc3Rpbmc/OiBhbnk7XG4gIHVzZVZhbHVlPzogYW55O1xuICB1c2VyRGVwcz86IFIzRGVwZW5kZW5jeU1ldGFkYXRhRmFjYWRlW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUjNOZ01vZHVsZU1ldGFkYXRhRmFjYWRlIHtcbiAgdHlwZTogYW55O1xuICBib290c3RyYXA6IEZ1bmN0aW9uW107XG4gIGRlY2xhcmF0aW9uczogRnVuY3Rpb25bXTtcbiAgaW1wb3J0czogRnVuY3Rpb25bXTtcbiAgZXhwb3J0czogRnVuY3Rpb25bXTtcbiAgZW1pdElubGluZTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSM0luamVjdG9yTWV0YWRhdGFGYWNhZGUge1xuICBuYW1lOiBzdHJpbmc7XG4gIHR5cGU6IGFueTtcbiAgZGVwczogUjNEZXBlbmRlbmN5TWV0YWRhdGFGYWNhZGVbXXxudWxsO1xuICBwcm92aWRlcnM6IGFueVtdO1xuICBpbXBvcnRzOiBhbnlbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSM0RpcmVjdGl2ZU1ldGFkYXRhRmFjYWRlIHtcbiAgbmFtZTogc3RyaW5nO1xuICB0eXBlOiBhbnk7XG4gIHR5cGVBcmd1bWVudENvdW50OiBudW1iZXI7XG4gIHR5cGVTb3VyY2VTcGFuOiBudWxsO1xuICBkZXBzOiBSM0RlcGVuZGVuY3lNZXRhZGF0YUZhY2FkZVtdfG51bGw7XG4gIHNlbGVjdG9yOiBzdHJpbmd8bnVsbDtcbiAgcXVlcmllczogUjNRdWVyeU1ldGFkYXRhRmFjYWRlW107XG4gIGhvc3Q6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9O1xuICBwcm9wTWV0YWRhdGE6IHtba2V5OiBzdHJpbmddOiBhbnlbXX07XG4gIGxpZmVjeWNsZToge3VzZXNPbkNoYW5nZXM6IGJvb2xlYW47fTtcbiAgaW5wdXRzOiBzdHJpbmdbXTtcbiAgb3V0cHV0czogc3RyaW5nW107XG4gIHVzZXNJbmhlcml0YW5jZTogYm9vbGVhbjtcbiAgZXhwb3J0QXM6IHN0cmluZ3xudWxsO1xuICBwcm92aWRlcnM6IFByb3ZpZGVyW118bnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSM0NvbXBvbmVudE1ldGFkYXRhRmFjYWRlIGV4dGVuZHMgUjNEaXJlY3RpdmVNZXRhZGF0YUZhY2FkZSB7XG4gIHRlbXBsYXRlOiBzdHJpbmc7XG4gIHByZXNlcnZlV2hpdGVzcGFjZXM6IGJvb2xlYW47XG4gIGFuaW1hdGlvbnM6IGFueVtdfHVuZGVmaW5lZDtcbiAgdmlld1F1ZXJpZXM6IFIzUXVlcnlNZXRhZGF0YUZhY2FkZVtdO1xuICBwaXBlczogTWFwPHN0cmluZywgYW55PjtcbiAgZGlyZWN0aXZlczoge3NlbGVjdG9yOiBzdHJpbmcsIGV4cHJlc3Npb246IGFueX1bXTtcbiAgc3R5bGVzOiBzdHJpbmdbXTtcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb247XG4gIHZpZXdQcm92aWRlcnM6IFByb3ZpZGVyW118bnVsbDtcbiAgaW50ZXJwb2xhdGlvbj86IFtzdHJpbmcsIHN0cmluZ107XG59XG5cbmV4cG9ydCB0eXBlIFZpZXdFbmNhcHN1bGF0aW9uID0gbnVtYmVyO1xuXG5leHBvcnQgaW50ZXJmYWNlIFIzUXVlcnlNZXRhZGF0YUZhY2FkZSB7XG4gIHByb3BlcnR5TmFtZTogc3RyaW5nO1xuICBmaXJzdDogYm9vbGVhbjtcbiAgcHJlZGljYXRlOiBhbnl8c3RyaW5nW107XG4gIGRlc2NlbmRhbnRzOiBib29sZWFuO1xuICByZWFkOiBhbnl8bnVsbDtcbn1cbiJdfQ==