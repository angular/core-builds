/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationEntryMetadata, ComponentFactory, Injector, NgZone, OpaqueToken, ViewMetadata } from '../index';
import { Type } from '../src/facade/lang';
import { ComponentFixture } from './component_fixture';
/**
 * An abstract class for inserting the root test component element in a platform independent way.
 */
export declare class TestComponentRenderer {
    insertRootElement(rootElementId: string): void;
}
export declare var ComponentFixtureAutoDetect: OpaqueToken;
export declare var ComponentFixtureNoNgZone: OpaqueToken;
/**
 * Builds a ComponentFixture for use in component level tests.
 */
export declare class TestComponentBuilder {
    protected _injector: Injector;
    constructor(_injector: Injector);
    /**
     * Overrides only the html of a {@link ComponentMetadata}.
     * All the other properties of the component's {@link ViewMetadata} are preserved.
     */
    overrideTemplate(componentType: Type, template: string): TestComponentBuilder;
    /**
     * Overrides a component's {@link ViewMetadata}.
     */
    overrideView(componentType: Type, view: ViewMetadata): TestComponentBuilder;
    /**
     * Overrides the directives from the component {@link ViewMetadata}.
     */
    overrideDirective(componentType: Type, from: Type, to: Type): TestComponentBuilder;
    /**
     * Overrides one or more injectables configured via `providers` metadata property of a directive
     * or
     * component.
     * Very useful when certain providers need to be mocked out.
     *
     * The providers specified via this method are appended to the existing `providers` causing the
     * duplicated providers to
     * be overridden.
     */
    overrideProviders(type: Type, providers: any[]): TestComponentBuilder;
    /**
     * Overrides one or more injectables configured via `providers` metadata property of a directive
     * or
     * component.
     * Very useful when certain providers need to be mocked out.
     *
     * The providers specified via this method are appended to the existing `providers` causing the
     * duplicated providers to
     * be overridden.
     */
    overrideViewProviders(type: Type, providers: any[]): TestComponentBuilder;
    overrideAnimations(componentType: Type, animations: AnimationEntryMetadata[]): TestComponentBuilder;
    protected createFromFactory<C>(ngZone: NgZone, componentFactory: ComponentFactory<C>): ComponentFixture<C>;
    /**
     * Builds and returns a ComponentFixture.
     */
    createAsync(rootComponentType: Type): Promise<ComponentFixture<any>>;
    createFakeAsync(rootComponentType: Type): ComponentFixture<any>;
    /**
     * @deprecated createSync will be replaced with the ability to precompile components from within
     * the test.
     */
    createSync<C>(componentFactory: ComponentFactory<C>): ComponentFixture<C>;
}
