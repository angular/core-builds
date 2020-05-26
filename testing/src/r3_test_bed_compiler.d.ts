/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Component, Directive, Injector, NgModule, Pipe, PlatformRef, Provider, Type, ɵRender3NgModuleRef as NgModuleRef } from '@angular/core';
import { MetadataOverride } from './metadata_override';
import { TestModuleMetadata } from './test_bed_common';
export declare class R3TestBedCompiler {
    private platform;
    private additionalModuleTypes;
    private originalComponentResolutionQueue;
    private declarations;
    private imports;
    private providers;
    private schemas;
    private pendingComponents;
    private pendingDirectives;
    private pendingPipes;
    private seenComponents;
    private seenDirectives;
    private overriddenModules;
    private existingComponentStyles;
    private resolvers;
    private componentToModuleScope;
    private initialNgDefs;
    private defCleanupOps;
    private _injector;
    private compilerProviders;
    private providerOverrides;
    private rootProviderOverrides;
    private providerOverridesByModule;
    private providerOverridesByToken;
    private moduleProvidersOverridden;
    private testModuleType;
    private testModuleRef;
    constructor(platform: PlatformRef, additionalModuleTypes: Type<any> | Type<any>[]);
    setCompilerProviders(providers: Provider[] | null): void;
    configureTestingModule(moduleDef: TestModuleMetadata): void;
    overrideModule(ngModule: Type<any>, override: MetadataOverride<NgModule>): void;
    overrideComponent(component: Type<any>, override: MetadataOverride<Component>): void;
    overrideDirective(directive: Type<any>, override: MetadataOverride<Directive>): void;
    overridePipe(pipe: Type<any>, override: MetadataOverride<Pipe>): void;
    overrideProvider(token: any, provider: {
        useFactory?: Function;
        useValue?: any;
        deps?: any[];
        multi?: boolean;
    }): void;
    overrideTemplateUsingTestingModule(type: Type<any>, template: string): void;
    compileComponents(): Promise<void>;
    finalize(): NgModuleRef<any>;
    private compileTypesSync;
    private applyTransitiveScopes;
    private applyProviderOverrides;
    private applyProviderOverridesToModule;
    private patchComponentsWithExistingStyles;
    private queueTypeArray;
    private recompileNgModule;
    private queueType;
    private queueTypesFromModulesArray;
    private collectModulesAffectedByOverrides;
    private maybeStoreNgDef;
    private storeFieldOfDefOnType;
    /**
     * Clears current components resolution queue, but stores the state of the queue, so we can
     * restore it later. Clearing the queue is required before we try to compile components (via
     * `TestBed.compileComponents`), so that component defs are in sync with the resolution queue.
     */
    private clearComponentResolutionQueue;
    private restoreComponentResolutionQueue;
    restoreOriginalState(): void;
    private compileTestModule;
    get injector(): Injector;
    private getSingleProviderOverrides;
    private getProviderOverrides;
    private getOverriddenProviders;
    private hasProviderOverrides;
    private patchDefWithProviderOverrides;
}
