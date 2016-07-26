/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Low-level service for loading {@link ComponentFactory}s, which
 * can later be used to create and render a Component instance.
 *
 * @deprecated Use {@link ComponentFactoryResolver} together with {@link
 * NgModule}.precompile}/{@link Component}.precompile or
 * {@link ANALYZE_FOR_PRECOMPILE} provider for dynamic component creation.
 * Use {@link NgModuleFactoryLoader} for lazy loading.
 */
export class ComponentResolver {
}
ComponentResolver.DynamicCompilationDeprecationMsg = 'ComponentResolver is deprecated for dynamic compilation. Use ComponentFactoryResolver together with @NgModule/@Component.precompile or ANALYZE_FOR_PRECOMPILE provider instead. For runtime compile only, you can also use Compiler.compileComponentSync/Async.';
ComponentResolver.LazyLoadingDeprecationMsg = 'ComponentResolver is deprecated for lazy loading. Use NgModuleFactoryLoader instead.';
//# sourceMappingURL=component_resolver.js.map