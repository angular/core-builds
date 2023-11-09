/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getInjectorDef } from '../../di/interface/defs';
import { NullInjector } from '../../di/null_injector';
import { walkProviderTree } from '../../di/provider_collection';
import { EnvironmentInjector, R3Injector } from '../../di/r3_injector';
import { NgModuleRef as viewEngine_NgModuleRef } from '../../linker/ng_module_factory';
import { deepForEach } from '../../util/array_utils';
import { throwError } from '../../util/assert';
import { getComponentDef } from '../definition';
import { getNodeInjectorLView, getNodeInjectorTNode, getParentInjectorLocation, NodeInjector } from '../di';
import { getFrameworkDIDebugData } from '../debug/framework_injector_profiler';
import { INJECTOR, TVIEW } from '../interfaces/view';
import { getParentInjectorIndex, getParentInjectorView, hasParentInjector } from './injector_utils';
import { assertTNodeForLView, assertTNode } from '../assert';
import { getNativeByTNode } from './view_utils';
import { INJECTOR_DEF_TYPES } from '../../di/internal_tokens';
import { ENVIRONMENT_INITIALIZER } from '../../di/initializer_token';
/**
 * Discovers the dependencies of an injectable instance. Provides DI information about each
 * dependency that the injectable was instantiated with, including where they were provided from.
 *
 * @param injector An injector instance
 * @param token a DI token that was constructed by the given injector instance
 * @returns an object that contains the created instance of token as well as all of the dependencies
 * that it was instantiated with OR undefined if the token was not created within the given
 * injector.
 */
export function getDependenciesFromInjectable(injector, token) {
    // First we check to see if the token given maps to an actual instance in the injector given.
    // We use `self: true` because we only want to look at the injector we were given.
    // We use `optional: true` because it's possible that the token we were given was never
    // constructed by the injector we were given.
    const instance = injector.get(token, null, { self: true, optional: true });
    if (instance === null) {
        throw new Error(`Unable to determine instance of ${token} in given injector`);
    }
    const unformattedDependencies = getDependenciesForTokenInInjector(token, injector);
    const resolutionPath = getInjectorResolutionPath(injector);
    const dependencies = unformattedDependencies.map(dep => {
        // injectedIn contains private fields, so we omit it from the response
        const formattedDependency = {
            value: dep.value,
        };
        // convert injection flags to booleans
        const flags = dep.flags;
        formattedDependency.flags = {
            optional: (8 /* InternalInjectFlags.Optional */ & flags) === 8 /* InternalInjectFlags.Optional */,
            host: (1 /* InternalInjectFlags.Host */ & flags) === 1 /* InternalInjectFlags.Host */,
            self: (2 /* InternalInjectFlags.Self */ & flags) === 2 /* InternalInjectFlags.Self */,
            skipSelf: (4 /* InternalInjectFlags.SkipSelf */ & flags) === 4 /* InternalInjectFlags.SkipSelf */,
        };
        // find the injector that provided the dependency
        for (let i = 0; i < resolutionPath.length; i++) {
            const injectorToCheck = resolutionPath[i];
            // if skipSelf is true we skip the first injector
            if (i === 0 && formattedDependency.flags.skipSelf) {
                continue;
            }
            // host only applies to NodeInjectors
            if (formattedDependency.flags.host && injectorToCheck instanceof EnvironmentInjector) {
                break;
            }
            const instance = injectorToCheck.get(dep.token, null, { self: true, optional: true });
            if (instance !== null) {
                // if host flag is true we double check that we can get the service from the first element
                // in the resolution path by using the host flag. This is done to make sure that we've found
                // the correct providing injector, and not a node injector that is connected to our path via
                // a router outlet.
                if (formattedDependency.flags.host) {
                    const firstInjector = resolutionPath[0];
                    const lookupFromFirstInjector = firstInjector.get(dep.token, null, { ...formattedDependency.flags, optional: true });
                    if (lookupFromFirstInjector !== null) {
                        formattedDependency.providedIn = injectorToCheck;
                    }
                    break;
                }
                formattedDependency.providedIn = injectorToCheck;
                break;
            }
            // if self is true we stop after the first injector
            if (i === 0 && formattedDependency.flags.self) {
                break;
            }
        }
        if (dep.token)
            formattedDependency.token = dep.token;
        return formattedDependency;
    });
    return { instance, dependencies };
}
function getDependenciesForTokenInInjector(token, injector) {
    const { resolverToTokenToDependencies } = getFrameworkDIDebugData();
    if (!(injector instanceof NodeInjector)) {
        return resolverToTokenToDependencies.get(injector)?.get?.(token) ?? [];
    }
    const lView = getNodeInjectorLView(injector);
    const tokenDependencyMap = resolverToTokenToDependencies.get(lView);
    const dependencies = tokenDependencyMap?.get(token) ?? [];
    // In the NodeInjector case, all injections for every node are stored in the same lView.
    // We use the injectedIn field of the dependency to filter out the dependencies that
    // do not come from the same node as the instance we're looking at.
    return dependencies.filter(dependency => {
        const dependencyNode = dependency.injectedIn?.tNode;
        if (dependencyNode === undefined) {
            return false;
        }
        const instanceNode = getNodeInjectorTNode(injector);
        assertTNode(dependencyNode);
        assertTNode(instanceNode);
        return dependencyNode === instanceNode;
    });
}
/**
 * Gets the class associated with an injector that contains a provider `imports` array in it's
 * definition
 *
 * For Module Injectors this returns the NgModule constructor.
 *
 * For Standalone injectors this returns the standalone component constructor.
 *
 * @param injector Injector an injector instance
 * @returns the constructor where the `imports` array that configures this injector is located
 */
function getProviderImportsContainer(injector) {
    const { standaloneInjectorToComponent } = getFrameworkDIDebugData();
    // standalone components configure providers through a component def, so we have to
    // use the standalone component associated with this injector if Injector represents
    // a standalone components EnvironmentInjector
    if (standaloneInjectorToComponent.has(injector)) {
        return standaloneInjectorToComponent.get(injector);
    }
    // Module injectors configure providers through their NgModule def, so we use the
    // injector to lookup its NgModuleRef and through that grab its instance
    const defTypeRef = injector.get(viewEngine_NgModuleRef, null, { self: true, optional: true });
    // If we can't find an associated imports container, return null.
    // This could be the case if this function is called with an R3Injector that does not represent
    // a standalone component or NgModule.
    if (defTypeRef === null) {
        return null;
    }
    // In standalone applications, the root environment injector created by bootstrapApplication
    // may have no associated "instance".
    if (defTypeRef.instance === null) {
        return null;
    }
    return defTypeRef.instance.constructor;
}
/**
 * Gets the providers configured on a NodeInjector
 *
 * @param injector A NodeInjector instance
 * @returns ProviderRecord[] an array of objects representing the providers configured on this
 *     injector
 */
function getNodeInjectorProviders(injector) {
    const diResolver = getNodeInjectorTNode(injector);
    const { resolverToProviders } = getFrameworkDIDebugData();
    return resolverToProviders.get(diResolver) ?? [];
}
/**
 * Gets a mapping of providers configured on an injector to their import paths
 *
 * ModuleA -> imports ModuleB
 * ModuleB -> imports ModuleC
 * ModuleB -> provides MyServiceA
 * ModuleC -> provides MyServiceB
 *
 * getProviderImportPaths(ModuleA)
 * > Map(2) {
 *   MyServiceA => [ModuleA, ModuleB]
 *   MyServiceB => [ModuleA, ModuleB, ModuleC]
 *  }
 *
 * @param providerImportsContainer constructor of class that contains an `imports` array in it's
 *     definition
 * @returns A Map object that maps providers to an array of constructors representing it's import
 *     path
 *
 */
function getProviderImportPaths(providerImportsContainer) {
    const providerToPath = new Map();
    const visitedContainers = new Set();
    const visitor = walkProviderTreeToDiscoverImportPaths(providerToPath, visitedContainers);
    walkProviderTree(providerImportsContainer, visitor, [], new Set());
    return providerToPath;
}
/**
 *
 * Higher order function that returns a visitor for WalkProviderTree
 *
 * Takes in a Map and Set to keep track of the providers and containers
 * visited, so that we can discover the import paths of these providers
 * during the traversal.
 *
 * This visitor takes advantage of the fact that walkProviderTree performs a
 * postorder traversal of the provider tree for the passed in container. Because postorder
 * traversal recursively processes subtrees from leaf nodes until the traversal reaches the root,
 * we write a visitor that constructs provider import paths in reverse.
 *
 *
 * We use the visitedContainers set defined outside this visitor
 * because we want to run some logic only once for
 * each container in the tree. That logic can be described as:
 *
 *
 * 1. for each discovered_provider and discovered_path in the incomplete provider paths we've
 * already discovered
 * 2. get the first container in discovered_path
 * 3. if that first container is in the imports array of the container we're visiting
 *    Then the container we're visiting is also in the import path of discovered_provider, so we
 *    unshift discovered_path with the container we're currently visiting
 *
 *
 * Example Run:
 * ```
 *                 ┌──────────┐
 *                 │containerA│
 *      ┌─imports-─┤          ├──imports─┐
 *      │          │  provA   │          │
 *      │          │  provB   │          │
 *      │          └──────────┘          │
 *      │                                │
 *     ┌▼─────────┐             ┌────────▼─┐
 *     │containerB│             │containerC│
 *     │          │             │          │
 *     │  provD   │             │  provF   │
 *     │  provE   │             │  provG   │
 *     └──────────┘             └──────────┘
 * ```
 *
 * Each step of the traversal,
 *
 * ```
 * visitor(provD, containerB)
 * providerToPath === Map { provD => [containerB] }
 * visitedContainers === Set { containerB }
 *
 * visitor(provE, containerB)
 * providerToPath === Map { provD => [containerB], provE => [containerB] }
 * visitedContainers === Set { containerB }
 *
 * visitor(provF, containerC)
 * providerToPath === Map { provD => [containerB], provE => [containerB], provF => [containerC] }
 * visitedContainers === Set { containerB, containerC }
 *
 * visitor(provG, containerC)
 * providerToPath === Map {
 *   provD => [containerB], provE => [containerB], provF => [containerC], provG => [containerC]
 * }
 * visitedContainers === Set { containerB, containerC }
 *
 * visitor(provA, containerA)
 * providerToPath === Map {
 *   provD => [containerA, containerB],
 *   provE => [containerA, containerB],
 *   provF => [containerA, containerC],
 *   provG => [containerA, containerC],
 *   provA => [containerA]
 * }
 * visitedContainers === Set { containerB, containerC, containerA }
 *
 * visitor(provB, containerA)
 * providerToPath === Map {
 *   provD => [containerA, containerB],
 *   provE => [containerA, containerB],
 *   provF => [containerA, containerC],
 *   provG => [containerA, containerC],
 *   provA => [containerA]
 *   provB => [containerA]
 * }
 * visitedContainers === Set { containerB, containerC, containerA }
 * ```
 *
 * @param providerToPath Map map of providers to paths that this function fills
 * @param visitedContainers Set a set to keep track of the containers we've already visited
 * @return function(provider SingleProvider, container: Type<unknown> | InjectorType<unknown>) =>
 *     void
 */
function walkProviderTreeToDiscoverImportPaths(providerToPath, visitedContainers) {
    return (provider, container) => {
        // If the provider is not already in the providerToPath map,
        // add an entry with the provider as the key and an array containing the current container as
        // the value
        if (!providerToPath.has(provider)) {
            providerToPath.set(provider, [container]);
        }
        // This block will run exactly once for each container in the import tree.
        // This is where we run the logic to check the imports array of the current
        // container to see if it's the next container in the path for our currently
        // discovered providers.
        if (!visitedContainers.has(container)) {
            // Iterate through the providers we've already seen
            for (const prov of providerToPath.keys()) {
                const existingImportPath = providerToPath.get(prov);
                let containerDef = getInjectorDef(container);
                if (!containerDef) {
                    const ngModule = container.ngModule;
                    containerDef = getInjectorDef(ngModule);
                }
                if (!containerDef) {
                    return;
                }
                const lastContainerAddedToPath = existingImportPath[0];
                let isNextStepInPath = false;
                deepForEach(containerDef.imports, (moduleImport) => {
                    if (isNextStepInPath) {
                        return;
                    }
                    isNextStepInPath = moduleImport.ngModule === lastContainerAddedToPath ||
                        moduleImport === lastContainerAddedToPath;
                    if (isNextStepInPath) {
                        providerToPath.get(prov)?.unshift(container);
                    }
                });
            }
        }
        visitedContainers.add(container);
    };
}
/**
 * Gets the providers configured on an EnvironmentInjector
 *
 * @param injector EnvironmentInjector
 * @returns an array of objects representing the providers of the given injector
 */
function getEnvironmentInjectorProviders(injector) {
    const providerRecordsWithoutImportPaths = getFrameworkDIDebugData().resolverToProviders.get(injector) ?? [];
    // platform injector has no provider imports container so can we skip trying to
    // find import paths
    if (isPlatformInjector(injector)) {
        return providerRecordsWithoutImportPaths;
    }
    const providerImportsContainer = getProviderImportsContainer(injector);
    if (providerImportsContainer === null) {
        // There is a special case where the bootstrapped component does not
        // import any NgModules. In this case the environment injector connected to
        // that component is the root injector, which does not have a provider imports
        // container (and thus no concept of module import paths). Therefore we simply
        // return the provider records as is.
        if (isRootInjector(injector)) {
            return providerRecordsWithoutImportPaths;
        }
        throwError('Could not determine where injector providers were configured.');
    }
    const providerToPath = getProviderImportPaths(providerImportsContainer);
    const providerRecords = [];
    for (const providerRecord of providerRecordsWithoutImportPaths) {
        const provider = providerRecord.provider;
        // Ignore these special providers for now until we have a cleaner way of
        // determing when they are provided by the framework vs provided by the user.
        const token = provider.provide;
        if (token === ENVIRONMENT_INITIALIZER || token === INJECTOR_DEF_TYPES) {
            continue;
        }
        let importPath = providerToPath.get(provider) ?? [];
        const def = getComponentDef(providerImportsContainer);
        const isStandaloneComponent = !!def?.standalone;
        // We prepend the component constructor in the standalone case
        // because walkProviderTree does not visit this constructor during it's traversal
        if (isStandaloneComponent) {
            importPath = [providerImportsContainer, ...importPath];
        }
        providerRecords.push({ ...providerRecord, importPath });
    }
    return providerRecords;
}
function isPlatformInjector(injector) {
    return injector instanceof R3Injector && injector.scopes.has('platform');
}
function isRootInjector(injector) {
    return injector instanceof R3Injector && injector.scopes.has('root');
}
/**
 * Gets the providers configured on an injector.
 *
 * @param injector the injector to lookup the providers of
 * @returns ProviderRecord[] an array of objects representing the providers of the given injector
 */
export function getInjectorProviders(injector) {
    if (injector instanceof NodeInjector) {
        return getNodeInjectorProviders(injector);
    }
    else if (injector instanceof EnvironmentInjector) {
        return getEnvironmentInjectorProviders(injector);
    }
    throwError('getInjectorProviders only supports NodeInjector and EnvironmentInjector');
}
/**
 *
 * Given an injector, this function will return
 * an object containing the type and source of the injector.
 *
 * |              | type        | source                                                      |
 * |--------------|-------------|-------------------------------------------------------------|
 * | NodeInjector | element     | DOM element that created this injector                      |
 * | R3Injector   | environment | `injector.source`                                           |
 * | NullInjector | null        | null                                                        |
 *
 * @param injector the Injector to get metadata for
 * @returns an object containing the type and source of the given injector. If the injector metadata
 *     cannot be determined, returns null.
 */
export function getInjectorMetadata(injector) {
    if (injector instanceof NodeInjector) {
        const lView = getNodeInjectorLView(injector);
        const tNode = getNodeInjectorTNode(injector);
        assertTNodeForLView(tNode, lView);
        return { type: 'element', source: getNativeByTNode(tNode, lView) };
    }
    if (injector instanceof R3Injector) {
        return { type: 'environment', source: injector.source ?? null };
    }
    if (injector instanceof NullInjector) {
        return { type: 'null', source: null };
    }
    return null;
}
export function getInjectorResolutionPath(injector) {
    const resolutionPath = [injector];
    getInjectorResolutionPathHelper(injector, resolutionPath);
    return resolutionPath;
}
function getInjectorResolutionPathHelper(injector, resolutionPath) {
    const parent = getInjectorParent(injector);
    // if getInjectorParent can't find a parent, then we've either reached the end
    // of the path, or we need to move from the Element Injector tree to the
    // module injector tree using the first injector in our path as the connection point.
    if (parent === null) {
        if (injector instanceof NodeInjector) {
            const firstInjector = resolutionPath[0];
            if (firstInjector instanceof NodeInjector) {
                const moduleInjector = getModuleInjectorOfNodeInjector(firstInjector);
                if (moduleInjector === null) {
                    throwError('NodeInjector must have some connection to the module injector tree');
                }
                resolutionPath.push(moduleInjector);
                getInjectorResolutionPathHelper(moduleInjector, resolutionPath);
            }
            return resolutionPath;
        }
    }
    else {
        resolutionPath.push(parent);
        getInjectorResolutionPathHelper(parent, resolutionPath);
    }
    return resolutionPath;
}
/**
 * Gets the parent of an injector.
 *
 * This function is not able to make the jump from the Element Injector Tree to the Module
 * injector tree. This is because the "parent" (the next step in the reoslution path)
 * of a root NodeInjector is dependent on which NodeInjector ancestor initiated
 * the DI lookup. See getInjectorResolutionPath for a function that can make this jump.
 *
 * In the below diagram:
 * ```ts
 * getInjectorParent(NodeInjectorB)
 *  > NodeInjectorA
 * getInjectorParent(NodeInjectorA) // or getInjectorParent(getInjectorParent(NodeInjectorB))
 *  > null // cannot jump to ModuleInjector tree
 * ```
 *
 * ```
 *                ┌───────┐                ┌───────────────────┐
 *    ┌───────────┤ModuleA├───Injector────►│EnvironmentInjector│
 *    │           └───┬───┘                └───────────────────┘
 *    │               │
 *    │           bootstraps
 *    │               │
 *    │               │
 *    │          ┌────▼─────┐                 ┌─────────────┐
 * declares      │ComponentA├────Injector────►│NodeInjectorA│
 *    │          └────┬─────┘                 └─────▲───────┘
 *    │               │                             │
 *    │            renders                        parent
 *    │               │                             │
 *    │          ┌────▼─────┐                 ┌─────┴───────┐
 *    └─────────►│ComponentB├────Injector────►│NodeInjectorB│
 *               └──────────┘                 └─────────────┘
 *```
 *
 * @param injector an Injector to get the parent of
 * @returns Injector the parent of the given injector
 */
function getInjectorParent(injector) {
    if (injector instanceof R3Injector) {
        return injector.parent;
    }
    let tNode;
    let lView;
    if (injector instanceof NodeInjector) {
        tNode = getNodeInjectorTNode(injector);
        lView = getNodeInjectorLView(injector);
    }
    else if (injector instanceof NullInjector) {
        return null;
    }
    else {
        throwError('getInjectorParent only support injectors of type R3Injector, NodeInjector, NullInjector');
    }
    const parentLocation = getParentInjectorLocation(tNode, lView);
    if (hasParentInjector(parentLocation)) {
        const parentInjectorIndex = getParentInjectorIndex(parentLocation);
        const parentLView = getParentInjectorView(parentLocation, lView);
        const parentTView = parentLView[TVIEW];
        const parentTNode = parentTView.data[parentInjectorIndex + 8 /* NodeInjectorOffset.TNODE */];
        return new NodeInjector(parentTNode, parentLView);
    }
    else {
        const chainedInjector = lView[INJECTOR];
        // Case where chainedInjector.injector is an OutletInjector and chainedInjector.injector.parent
        // is a NodeInjector.
        // todo(aleksanderbodurri): ideally nothing in packages/core should deal
        // directly with router concerns. Refactor this so that we can make the jump from
        // NodeInjector -> OutletInjector -> NodeInjector
        // without explictly relying on types contracts from packages/router
        const injectorParent = chainedInjector.injector?.parent;
        if (injectorParent instanceof NodeInjector) {
            return injectorParent;
        }
    }
    return null;
}
/**
 * Gets the module injector of a NodeInjector.
 *
 * @param injector NodeInjector to get module injector of
 * @returns Injector representing module injector of the given NodeInjector
 */
function getModuleInjectorOfNodeInjector(injector) {
    let lView;
    if (injector instanceof NodeInjector) {
        lView = getNodeInjectorLView(injector);
    }
    else {
        throwError('getModuleInjectorOfNodeInjector must be called with a NodeInjector');
    }
    const chainedInjector = lView[INJECTOR];
    const moduleInjector = chainedInjector.parentInjector;
    if (!moduleInjector) {
        throwError('NodeInjector must have some connection to the module injector tree');
    }
    return moduleInjector;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3JfZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy91dGlsL2luamVjdG9yX2Rpc2NvdmVyeV91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsY0FBYyxFQUFlLE1BQU0seUJBQXlCLENBQUM7QUFFckUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3BELE9BQU8sRUFBaUIsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RSxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsVUFBVSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFckUsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ3JGLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNuRCxPQUFPLEVBQWdCLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDOUMsT0FBTyxFQUFDLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLHlCQUF5QixFQUFFLFlBQVksRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUMxRyxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUk3RSxPQUFPLEVBQUMsUUFBUSxFQUFTLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRTFELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2xHLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFM0QsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0s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QUMsb0VBQW9FLENBQUMsQ0FBQztJQUNuRixDQUFDO0lBRUQsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBb0IsQ0FBQztJQUMzRCxNQUFNLGNBQWMsR0FBRyxlQUFlLENBQUMsY0FBYyxDQUFDO0lBQ3RELElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNwQixVQUFVLENBQUMsb0VBQW9FLENBQUMsQ0FBQztJQUNuRixDQUFDO0lBRUQsT0FBTyxjQUFjLENBQUM7QUFDeEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi8uLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtnZXRJbmplY3RvckRlZiwgSW5qZWN0b3JUeXBlfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0luamVjdEZsYWdzLCBJbnRlcm5hbEluamVjdEZsYWdzfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtOdWxsSW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL251bGxfaW5qZWN0b3InO1xuaW1wb3J0IHtTaW5nbGVQcm92aWRlciwgd2Fsa1Byb3ZpZGVyVHJlZX0gZnJvbSAnLi4vLi4vZGkvcHJvdmlkZXJfY29sbGVjdGlvbic7XG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3IsIFIzSW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL3IzX2luamVjdG9yJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi8uLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtkZWVwRm9yRWFjaH0gZnJvbSAnLi4vLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIHRocm93RXJyb3J9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB0eXBlIHtDaGFpbmVkSW5qZWN0b3J9IGZyb20gJy4uL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtnZXROb2RlSW5qZWN0b3JMVmlldywgZ2V0Tm9kZUluamVjdG9yVE5vZGUsIGdldFBhcmVudEluamVjdG9yTG9jYXRpb24sIE5vZGVJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtnZXRGcmFtZXdvcmtESURlYnVnRGF0YX0gZnJvbSAnLi4vZGVidWcvZnJhbWV3b3JrX2luamVjdG9yX3Byb2ZpbGVyJztcbmltcG9ydCB7SW5qZWN0ZWRTZXJ2aWNlLCBQcm92aWRlclJlY29yZH0gZnJvbSAnLi4vZGVidWcvaW5qZWN0b3JfcHJvZmlsZXInO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JPZmZzZXR9IGZyb20gJy4uL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtJTkpFQ1RPUiwgTFZpZXcsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5pbXBvcnQge2dldFBhcmVudEluamVjdG9ySW5kZXgsIGdldFBhcmVudEluamVjdG9yVmlldywgaGFzUGFyZW50SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3JfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnRUTm9kZUZvckxWaWV3LCBhc3NlcnRUTm9kZX0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlUTm9kZX0gZnJvbSAnLi92aWV3X3V0aWxzJztcbmltcG9ydCB7SU5KRUNUT1JfREVGX1RZUEVTfSBmcm9tICcuLi8uLi9kaS9pbnRlcm5hbF90b2tlbnMnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUn0gZnJvbSAnLi4vLi4vZGkvaW5pdGlhbGl6ZXJfdG9rZW4nO1xuaW1wb3J0IHtWYWx1ZVByb3ZpZGVyfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuXG4vKipcbiAqIERpc2NvdmVycyB0aGUgZGVwZW5kZW5jaWVzIG9mIGFuIGluamVjdGFibGUgaW5zdGFuY2UuIFByb3ZpZGVzIERJIGluZm9ybWF0aW9uIGFib3V0IGVhY2hcbiAqIGRlcGVuZGVuY3kgdGhhdCB0aGUgaW5qZWN0YWJsZSB3YXMgaW5zdGFudGlhdGVkIHdpdGgsIGluY2x1ZGluZyB3aGVyZSB0aGV5IHdlcmUgcHJvdmlkZWQgZnJvbS5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgQW4gaW5qZWN0b3IgaW5zdGFuY2VcbiAqIEBwYXJhbSB0b2tlbiBhIERJIHRva2VuIHRoYXQgd2FzIGNvbnN0cnVjdGVkIGJ5IHRoZSBnaXZlbiBpbmplY3RvciBpbnN0YW5jZVxuICogQHJldHVybnMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIGNyZWF0ZWQgaW5zdGFuY2Ugb2YgdG9rZW4gYXMgd2VsbCBhcyBhbGwgb2YgdGhlIGRlcGVuZGVuY2llc1xuICogdGhhdCBpdCB3YXMgaW5zdGFudGlhdGVkIHdpdGggT1IgdW5kZWZpbmVkIGlmIHRoZSB0b2tlbiB3YXMgbm90IGNyZWF0ZWQgd2l0aGluIHRoZSBnaXZlblxuICogaW5qZWN0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZXBlbmRlbmNpZXNGcm9tSW5qZWN0YWJsZTxUPihcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsIHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+KTpcbiAgICB7aW5zdGFuY2U6IFQ7IGRlcGVuZGVuY2llczogT21pdDxJbmplY3RlZFNlcnZpY2UsICdpbmplY3RlZEluJz5bXX18dW5kZWZpbmVkIHtcbiAgLy8gRmlyc3Qgd2UgY2hlY2sgdG8gc2VlIGlmIHRoZSB0b2tlbiBnaXZlbiBtYXBzIHRvIGFuIGFjdHVhbCBpbnN0YW5jZSBpbiB0aGUgaW5qZWN0b3IgZ2l2ZW4uXG4gIC8vIFdlIHVzZSBgc2VsZjogdHJ1ZWAgYmVjYXVzZSB3ZSBvbmx5IHdhbnQgdG8gbG9vayBhdCB0aGUgaW5qZWN0b3Igd2Ugd2VyZSBnaXZlbi5cbiAgLy8gV2UgdXNlIGBvcHRpb25hbDogdHJ1ZWAgYmVjYXVzZSBpdCdzIHBvc3NpYmxlIHRoYXQgdGhlIHRva2VuIHdlIHdlcmUgZ2l2ZW4gd2FzIG5ldmVyXG4gIC8vIGNvbnN0cnVjdGVkIGJ5IHRoZSBpbmplY3RvciB3ZSB3ZXJlIGdpdmVuLlxuICBjb25zdCBpbnN0YW5jZSA9IGluamVjdG9yLmdldCh0b2tlbiwgbnVsbCwge3NlbGY6IHRydWUsIG9wdGlvbmFsOiB0cnVlfSk7XG4gIGlmIChpbnN0YW5jZSA9PT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGRldGVybWluZSBpbnN0YW5jZSBvZiAke3Rva2VufSBpbiBnaXZlbiBpbmplY3RvcmApO1xuICB9XG5cbiAgY29uc3QgdW5mb3JtYXR0ZWREZXBlbmRlbmNpZXMgPSBnZXREZXBlbmRlbmNpZXNGb3JUb2tlbkluSW5qZWN0b3IodG9rZW4sIGluamVjdG9yKTtcbiAgY29uc3QgcmVzb2x1dGlvblBhdGggPSBnZXRJbmplY3RvclJlc29sdXRpb25QYXRoKGluamVjdG9yKTtcblxuICBjb25zdCBkZXBlbmRlbmNpZXMgPSB1bmZvcm1hdHRlZERlcGVuZGVuY2llcy5tYXAoZGVwID0+IHtcbiAgICAvLyBpbmplY3RlZEluIGNvbnRhaW5zIHByaXZhdGUgZmllbGRzLCBzbyB3ZSBvbWl0IGl0IGZyb20gdGhlIHJlc3BvbnNlXG4gICAgY29uc3QgZm9ybWF0dGVkRGVwZW5kZW5jeTogT21pdDxJbmplY3RlZFNlcnZpY2UsICdpbmplY3RlZEluJz4gPSB7XG4gICAgICB2YWx1ZTogZGVwLnZhbHVlLFxuICAgIH07XG5cbiAgICAvLyBjb252ZXJ0IGluamVjdGlvbiBmbGFncyB0byBib29sZWFuc1xuICAgIGNvbnN0IGZsYWdzID0gZGVwLmZsYWdzIGFzIEludGVybmFsSW5qZWN0RmxhZ3M7XG4gICAgZm9ybWF0dGVkRGVwZW5kZW5jeS5mbGFncyA9IHtcbiAgICAgIG9wdGlvbmFsOiAoSW50ZXJuYWxJbmplY3RGbGFncy5PcHRpb25hbCAmIGZsYWdzKSA9PT0gSW50ZXJuYWxJbmplY3RGbGFncy5PcHRpb25hbCxcbiAgICAgIGhvc3Q6IChJbnRlcm5hbEluamVjdEZsYWdzLkhvc3QgJiBmbGFncykgPT09IEludGVybmFsSW5qZWN0RmxhZ3MuSG9zdCxcbiAgICAgIHNlbGY6IChJbnRlcm5hbEluamVjdEZsYWdzLlNlbGYgJiBmbGFncykgPT09IEludGVybmFsSW5qZWN0RmxhZ3MuU2VsZixcbiAgICAgIHNraXBTZWxmOiAoSW50ZXJuYWxJbmplY3RGbGFncy5Ta2lwU2VsZiAmIGZsYWdzKSA9PT0gSW50ZXJuYWxJbmplY3RGbGFncy5Ta2lwU2VsZixcbiAgICB9O1xuXG5cbiAgICAvLyBmaW5kIHRoZSBpbmplY3RvciB0aGF0IHByb3ZpZGVkIHRoZSBkZXBlbmRlbmN5XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXNvbHV0aW9uUGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5qZWN0b3JUb0NoZWNrID0gcmVzb2x1dGlvblBhdGhbaV07XG5cbiAgICAgIC8vIGlmIHNraXBTZWxmIGlzIHRydWUgd2Ugc2tpcCB0aGUgZmlyc3QgaW5qZWN0b3JcbiAgICAgIGlmIChpID09PSAwICYmIGZvcm1hdHRlZERlcGVuZGVuY3kuZmxhZ3Muc2tpcFNlbGYpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIGhvc3Qgb25seSBhcHBsaWVzIHRvIE5vZGVJbmplY3RvcnNcbiAgICAgIGlmIChmb3JtYXR0ZWREZXBlbmRlbmN5LmZsYWdzLmhvc3QgJiYgaW5qZWN0b3JUb0NoZWNrIGluc3RhbmNlb2YgRW52aXJvbm1lbnRJbmplY3Rvcikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY29uc3QgaW5zdGFuY2UgPVxuICAgICAgICAgIGluamVjdG9yVG9DaGVjay5nZXQoZGVwLnRva2VuIGFzIFR5cGU8dW5rbm93bj4sIG51bGwsIHtzZWxmOiB0cnVlLCBvcHRpb25hbDogdHJ1ZX0pO1xuXG4gICAgICBpZiAoaW5zdGFuY2UgIT09IG51bGwpIHtcbiAgICAgICAgLy8gaWYgaG9zdCBmbGFnIGlzIHRydWUgd2UgZG91YmxlIGNoZWNrIHRoYXQgd2UgY2FuIGdldCB0aGUgc2VydmljZSBmcm9tIHRoZSBmaXJzdCBlbGVtZW50XG4gICAgICAgIC8vIGluIHRoZSByZXNvbHV0aW9uIHBhdGggYnkgdXNpbmcgdGhlIGhvc3QgZmxhZy4gVGhpcyBpcyBkb25lIHRvIG1ha2Ugc3VyZSB0aGF0IHdlJ3ZlIGZvdW5kXG4gICAgICAgIC8vIHRoZSBjb3JyZWN0IHByb3ZpZGluZyBpbmplY3RvciwgYW5kIG5vdCBhIG5vZGUgaW5qZWN0b3IgdGhhdCBpcyBjb25uZWN0ZWQgdG8gb3VyIHBhdGggdmlhXG4gICAgICAgIC8vIGEgcm91dGVyIG91dGxldC5cbiAgICAgICAgaWYgKGZvcm1hdHRlZERlcGVuZGVuY3kuZmxhZ3MuaG9zdCkge1xuICAgICAgICAgIGNvbnN0IGZpcnN0SW5qZWN0b3IgPSByZXNvbHV0aW9uUGF0aFswXTtcbiAgICAgICAgICBjb25zdCBsb29rdXBGcm9tRmlyc3RJbmplY3RvciA9IGZpcnN0SW5qZWN0b3IuZ2V0KFxuICAgICAgICAgICAgICBkZXAudG9rZW4gYXMgVHlwZTx1bmtub3duPiwgbnVsbCwgey4uLmZvcm1hdHRlZERlcGVuZGVuY3kuZmxhZ3MsIG9wdGlvbmFsOiB0cnVlfSk7XG5cbiAgICAgICAgICBpZiAobG9va3VwRnJvbUZpcnN0SW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZERlcGVuZGVuY3kucHJvdmlkZWRJbiA9IGluamVjdG9yVG9DaGVjaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcm1hdHRlZERlcGVuZGVuY3kucHJvdmlkZWRJbiA9IGluamVjdG9yVG9DaGVjaztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHNlbGYgaXMgdHJ1ZSB3ZSBzdG9wIGFmdGVyIHRoZSBmaXJzdCBpbmplY3RvclxuICAgICAgaWYgKGkgPT09IDAgJiYgZm9ybWF0dGVkRGVwZW5kZW5jeS5mbGFncy5zZWxmKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkZXAudG9rZW4pIGZvcm1hdHRlZERlcGVuZGVuY3kudG9rZW4gPSBkZXAudG9rZW47XG5cbiAgICByZXR1cm4gZm9ybWF0dGVkRGVwZW5kZW5jeTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtpbnN0YW5jZSwgZGVwZW5kZW5jaWVzfTtcbn1cblxuZnVuY3Rpb24gZ2V0RGVwZW5kZW5jaWVzRm9yVG9rZW5JbkluamVjdG9yPFQ+KFxuICAgIHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBpbmplY3RvcjogSW5qZWN0b3IpOiBJbmplY3RlZFNlcnZpY2VbXSB7XG4gIGNvbnN0IHtyZXNvbHZlclRvVG9rZW5Ub0RlcGVuZGVuY2llc30gPSBnZXRGcmFtZXdvcmtESURlYnVnRGF0YSgpO1xuXG4gIGlmICghKGluamVjdG9yIGluc3RhbmNlb2YgTm9kZUluamVjdG9yKSkge1xuICAgIHJldHVybiByZXNvbHZlclRvVG9rZW5Ub0RlcGVuZGVuY2llcy5nZXQoaW5qZWN0b3IpPy5nZXQ/Lih0b2tlbiBhcyBUeXBlPFQ+KSA/PyBbXTtcbiAgfVxuXG4gIGNvbnN0IGxWaWV3ID0gZ2V0Tm9kZUluamVjdG9yTFZpZXcoaW5qZWN0b3IpO1xuICBjb25zdCB0b2tlbkRlcGVuZGVuY3lNYXAgPSByZXNvbHZlclRvVG9rZW5Ub0RlcGVuZGVuY2llcy5nZXQobFZpZXcpO1xuICBjb25zdCBkZXBlbmRlbmNpZXMgPSB0b2tlbkRlcGVuZGVuY3lNYXA/LmdldCh0b2tlbiBhcyBUeXBlPFQ+KSA/PyBbXTtcblxuICAvLyBJbiB0aGUgTm9kZUluamVjdG9yIGNhc2UsIGFsbCBpbmplY3Rpb25zIGZvciBldmVyeSBub2RlIGFyZSBzdG9yZWQgaW4gdGhlIHNhbWUgbFZpZXcuXG4gIC8vIFdlIHVzZSB0aGUgaW5qZWN0ZWRJbiBmaWVsZCBvZiB0aGUgZGVwZW5kZW5jeSB0byBmaWx0ZXIgb3V0IHRoZSBkZXBlbmRlbmNpZXMgdGhhdFxuICAvLyBkbyBub3QgY29tZSBmcm9tIHRoZSBzYW1lIG5vZGUgYXMgdGhlIGluc3RhbmNlIHdlJ3JlIGxvb2tpbmcgYXQuXG4gIHJldHVybiBkZXBlbmRlbmNpZXMuZmlsdGVyKGRlcGVuZGVuY3kgPT4ge1xuICAgIGNvbnN0IGRlcGVuZGVuY3lOb2RlID0gZGVwZW5kZW5jeS5pbmplY3RlZEluPy50Tm9kZTtcbiAgICBpZiAoZGVwZW5kZW5jeU5vZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGluc3RhbmNlTm9kZSA9IGdldE5vZGVJbmplY3RvclROb2RlKGluamVjdG9yKTtcbiAgICBhc3NlcnRUTm9kZShkZXBlbmRlbmN5Tm9kZSk7XG4gICAgYXNzZXJ0VE5vZGUoaW5zdGFuY2VOb2RlISk7XG5cbiAgICByZXR1cm4gZGVwZW5kZW5jeU5vZGUgPT09IGluc3RhbmNlTm9kZTtcbiAgfSk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgY2xhc3MgYXNzb2NpYXRlZCB3aXRoIGFuIGluamVjdG9yIHRoYXQgY29udGFpbnMgYSBwcm92aWRlciBgaW1wb3J0c2AgYXJyYXkgaW4gaXQnc1xuICogZGVmaW5pdGlvblxuICpcbiAqIEZvciBNb2R1bGUgSW5qZWN0b3JzIHRoaXMgcmV0dXJucyB0aGUgTmdNb2R1bGUgY29uc3RydWN0b3IuXG4gKlxuICogRm9yIFN0YW5kYWxvbmUgaW5qZWN0b3JzIHRoaXMgcmV0dXJucyB0aGUgc3RhbmRhbG9uZSBjb21wb25lbnQgY29uc3RydWN0b3IuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIEluamVjdG9yIGFuIGluamVjdG9yIGluc3RhbmNlXG4gKiBAcmV0dXJucyB0aGUgY29uc3RydWN0b3Igd2hlcmUgdGhlIGBpbXBvcnRzYCBhcnJheSB0aGF0IGNvbmZpZ3VyZXMgdGhpcyBpbmplY3RvciBpcyBsb2NhdGVkXG4gKi9cbmZ1bmN0aW9uIGdldFByb3ZpZGVySW1wb3J0c0NvbnRhaW5lcihpbmplY3RvcjogSW5qZWN0b3IpOiBUeXBlPHVua25vd24+fG51bGwge1xuICBjb25zdCB7c3RhbmRhbG9uZUluamVjdG9yVG9Db21wb25lbnR9ID0gZ2V0RnJhbWV3b3JrRElEZWJ1Z0RhdGEoKTtcblxuICAvLyBzdGFuZGFsb25lIGNvbXBvbmVudHMgY29uZmlndXJlIHByb3ZpZGVycyB0aHJvdWdoIGEgY29tcG9uZW50IGRlZiwgc28gd2UgaGF2ZSB0b1xuICAvLyB1c2UgdGhlIHN0YW5kYWxvbmUgY29tcG9uZW50IGFzc29jaWF0ZWQgd2l0aCB0aGlzIGluamVjdG9yIGlmIEluamVjdG9yIHJlcHJlc2VudHNcbiAgLy8gYSBzdGFuZGFsb25lIGNvbXBvbmVudHMgRW52aXJvbm1lbnRJbmplY3RvclxuICBpZiAoc3RhbmRhbG9uZUluamVjdG9yVG9Db21wb25lbnQuaGFzKGluamVjdG9yKSkge1xuICAgIHJldHVybiBzdGFuZGFsb25lSW5qZWN0b3JUb0NvbXBvbmVudC5nZXQoaW5qZWN0b3IpITtcbiAgfVxuXG4gIC8vIE1vZHVsZSBpbmplY3RvcnMgY29uZmlndXJlIHByb3ZpZGVycyB0aHJvdWdoIHRoZWlyIE5nTW9kdWxlIGRlZiwgc28gd2UgdXNlIHRoZVxuICAvLyBpbmplY3RvciB0byBsb29rdXAgaXRzIE5nTW9kdWxlUmVmIGFuZCB0aHJvdWdoIHRoYXQgZ3JhYiBpdHMgaW5zdGFuY2VcbiAgY29uc3QgZGVmVHlwZVJlZiA9IGluamVjdG9yLmdldCh2aWV3RW5naW5lX05nTW9kdWxlUmVmLCBudWxsLCB7c2VsZjogdHJ1ZSwgb3B0aW9uYWw6IHRydWV9KSE7XG5cbiAgLy8gSWYgd2UgY2FuJ3QgZmluZCBhbiBhc3NvY2lhdGVkIGltcG9ydHMgY29udGFpbmVyLCByZXR1cm4gbnVsbC5cbiAgLy8gVGhpcyBjb3VsZCBiZSB0aGUgY2FzZSBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGFuIFIzSW5qZWN0b3IgdGhhdCBkb2VzIG5vdCByZXByZXNlbnRcbiAgLy8gYSBzdGFuZGFsb25lIGNvbXBvbmVudCBvciBOZ01vZHVsZS5cbiAgaWYgKGRlZlR5cGVSZWYgPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIEluIHN0YW5kYWxvbmUgYXBwbGljYXRpb25zLCB0aGUgcm9vdCBlbnZpcm9ubWVudCBpbmplY3RvciBjcmVhdGVkIGJ5IGJvb3RzdHJhcEFwcGxpY2F0aW9uXG4gIC8vIG1heSBoYXZlIG5vIGFzc29jaWF0ZWQgXCJpbnN0YW5jZVwiLlxuICBpZiAoZGVmVHlwZVJlZi5pbnN0YW5jZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGRlZlR5cGVSZWYuaW5zdGFuY2UuY29uc3RydWN0b3I7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgcHJvdmlkZXJzIGNvbmZpZ3VyZWQgb24gYSBOb2RlSW5qZWN0b3JcbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgQSBOb2RlSW5qZWN0b3IgaW5zdGFuY2VcbiAqIEByZXR1cm5zIFByb3ZpZGVyUmVjb3JkW10gYW4gYXJyYXkgb2Ygb2JqZWN0cyByZXByZXNlbnRpbmcgdGhlIHByb3ZpZGVycyBjb25maWd1cmVkIG9uIHRoaXNcbiAqICAgICBpbmplY3RvclxuICovXG5mdW5jdGlvbiBnZXROb2RlSW5qZWN0b3JQcm92aWRlcnMoaW5qZWN0b3I6IE5vZGVJbmplY3Rvcik6IFByb3ZpZGVyUmVjb3JkW10ge1xuICBjb25zdCBkaVJlc29sdmVyID0gZ2V0Tm9kZUluamVjdG9yVE5vZGUoaW5qZWN0b3IpO1xuICBjb25zdCB7cmVzb2x2ZXJUb1Byb3ZpZGVyc30gPSBnZXRGcmFtZXdvcmtESURlYnVnRGF0YSgpO1xuICByZXR1cm4gcmVzb2x2ZXJUb1Byb3ZpZGVycy5nZXQoZGlSZXNvbHZlciBhcyBUTm9kZSkgPz8gW107XG59XG5cbi8qKlxuICogR2V0cyBhIG1hcHBpbmcgb2YgcHJvdmlkZXJzIGNvbmZpZ3VyZWQgb24gYW4gaW5qZWN0b3IgdG8gdGhlaXIgaW1wb3J0IHBhdGhzXG4gKlxuICogTW9kdWxlQSAtPiBpbXBvcnRzIE1vZHVsZUJcbiAqIE1vZHVsZUIgLT4gaW1wb3J0cyBNb2R1bGVDXG4gKiBNb2R1bGVCIC0+IHByb3ZpZGVzIE15U2VydmljZUFcbiAqIE1vZHVsZUMgLT4gcHJvdmlkZXMgTXlTZXJ2aWNlQlxuICpcbiAqIGdldFByb3ZpZGVySW1wb3J0UGF0aHMoTW9kdWxlQSlcbiAqID4gTWFwKDIpIHtcbiAqICAgTXlTZXJ2aWNlQSA9PiBbTW9kdWxlQSwgTW9kdWxlQl1cbiAqICAgTXlTZXJ2aWNlQiA9PiBbTW9kdWxlQSwgTW9kdWxlQiwgTW9kdWxlQ11cbiAqICB9XG4gKlxuICogQHBhcmFtIHByb3ZpZGVySW1wb3J0c0NvbnRhaW5lciBjb25zdHJ1Y3RvciBvZiBjbGFzcyB0aGF0IGNvbnRhaW5zIGFuIGBpbXBvcnRzYCBhcnJheSBpbiBpdCdzXG4gKiAgICAgZGVmaW5pdGlvblxuICogQHJldHVybnMgQSBNYXAgb2JqZWN0IHRoYXQgbWFwcyBwcm92aWRlcnMgdG8gYW4gYXJyYXkgb2YgY29uc3RydWN0b3JzIHJlcHJlc2VudGluZyBpdCdzIGltcG9ydFxuICogICAgIHBhdGhcbiAqXG4gKi9cbmZ1bmN0aW9uIGdldFByb3ZpZGVySW1wb3J0UGF0aHMocHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyOiBUeXBlPHVua25vd24+KTpcbiAgICBNYXA8U2luZ2xlUHJvdmlkZXIsIChUeXBlPHVua25vd24+fCBJbmplY3RvclR5cGU8dW5rbm93bj4pW10+IHtcbiAgY29uc3QgcHJvdmlkZXJUb1BhdGggPSBuZXcgTWFwPFNpbmdsZVByb3ZpZGVyLCAoVHlwZTx1bmtub3duPnwgSW5qZWN0b3JUeXBlPHVua25vd24+KVtdPigpO1xuICBjb25zdCB2aXNpdGVkQ29udGFpbmVycyA9IG5ldyBTZXQ8VHlwZTx1bmtub3duPj4oKTtcbiAgY29uc3QgdmlzaXRvciA9IHdhbGtQcm92aWRlclRyZWVUb0Rpc2NvdmVySW1wb3J0UGF0aHMocHJvdmlkZXJUb1BhdGgsIHZpc2l0ZWRDb250YWluZXJzKTtcblxuICB3YWxrUHJvdmlkZXJUcmVlKHByb3ZpZGVySW1wb3J0c0NvbnRhaW5lciwgdmlzaXRvciwgW10sIG5ldyBTZXQoKSk7XG5cbiAgcmV0dXJuIHByb3ZpZGVyVG9QYXRoO1xufVxuXG4vKipcbiAqXG4gKiBIaWdoZXIgb3JkZXIgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgdmlzaXRvciBmb3IgV2Fsa1Byb3ZpZGVyVHJlZVxuICpcbiAqIFRha2VzIGluIGEgTWFwIGFuZCBTZXQgdG8ga2VlcCB0cmFjayBvZiB0aGUgcHJvdmlkZXJzIGFuZCBjb250YWluZXJzXG4gKiB2aXNpdGVkLCBzbyB0aGF0IHdlIGNhbiBkaXNjb3ZlciB0aGUgaW1wb3J0IHBhdGhzIG9mIHRoZXNlIHByb3ZpZGVyc1xuICogZHVyaW5nIHRoZSB0cmF2ZXJzYWwuXG4gKlxuICogVGhpcyB2aXNpdG9yIHRha2VzIGFkdmFudGFnZSBvZiB0aGUgZmFjdCB0aGF0IHdhbGtQcm92aWRlclRyZWUgcGVyZm9ybXMgYVxuICogcG9zdG9yZGVyIHRyYXZlcnNhbCBvZiB0aGUgcHJvdmlkZXIgdHJlZSBmb3IgdGhlIHBhc3NlZCBpbiBjb250YWluZXIuIEJlY2F1c2UgcG9zdG9yZGVyXG4gKiB0cmF2ZXJzYWwgcmVjdXJzaXZlbHkgcHJvY2Vzc2VzIHN1YnRyZWVzIGZyb20gbGVhZiBub2RlcyB1bnRpbCB0aGUgdHJhdmVyc2FsIHJlYWNoZXMgdGhlIHJvb3QsXG4gKiB3ZSB3cml0ZSBhIHZpc2l0b3IgdGhhdCBjb25zdHJ1Y3RzIHByb3ZpZGVyIGltcG9ydCBwYXRocyBpbiByZXZlcnNlLlxuICpcbiAqXG4gKiBXZSB1c2UgdGhlIHZpc2l0ZWRDb250YWluZXJzIHNldCBkZWZpbmVkIG91dHNpZGUgdGhpcyB2aXNpdG9yXG4gKiBiZWNhdXNlIHdlIHdhbnQgdG8gcnVuIHNvbWUgbG9naWMgb25seSBvbmNlIGZvclxuICogZWFjaCBjb250YWluZXIgaW4gdGhlIHRyZWUuIFRoYXQgbG9naWMgY2FuIGJlIGRlc2NyaWJlZCBhczpcbiAqXG4gKlxuICogMS4gZm9yIGVhY2ggZGlzY292ZXJlZF9wcm92aWRlciBhbmQgZGlzY292ZXJlZF9wYXRoIGluIHRoZSBpbmNvbXBsZXRlIHByb3ZpZGVyIHBhdGhzIHdlJ3ZlXG4gKiBhbHJlYWR5IGRpc2NvdmVyZWRcbiAqIDIuIGdldCB0aGUgZmlyc3QgY29udGFpbmVyIGluIGRpc2NvdmVyZWRfcGF0aFxuICogMy4gaWYgdGhhdCBmaXJzdCBjb250YWluZXIgaXMgaW4gdGhlIGltcG9ydHMgYXJyYXkgb2YgdGhlIGNvbnRhaW5lciB3ZSdyZSB2aXNpdGluZ1xuICogICAgVGhlbiB0aGUgY29udGFpbmVyIHdlJ3JlIHZpc2l0aW5nIGlzIGFsc28gaW4gdGhlIGltcG9ydCBwYXRoIG9mIGRpc2NvdmVyZWRfcHJvdmlkZXIsIHNvIHdlXG4gKiAgICB1bnNoaWZ0IGRpc2NvdmVyZWRfcGF0aCB3aXRoIHRoZSBjb250YWluZXIgd2UncmUgY3VycmVudGx5IHZpc2l0aW5nXG4gKlxuICpcbiAqIEV4YW1wbGUgUnVuOlxuICogYGBgXG4gKiAgICAgICAgICAgICAgICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQXG4gKiAgICAgICAgICAgICAgICAg4pSCY29udGFpbmVyQeKUglxuICogICAgICDilIzilIBpbXBvcnRzLeKUgOKUpCAgICAgICAgICDilJzilIDilIBpbXBvcnRz4pSA4pSQXG4gKiAgICAgIOKUgiAgICAgICAgICDilIIgIHByb3ZBICAg4pSCICAgICAgICAgIOKUglxuICogICAgICDilIIgICAgICAgICAg4pSCICBwcm92QiAgIOKUgiAgICAgICAgICDilIJcbiAqICAgICAg4pSCICAgICAgICAgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCAgICAgICAgICDilIJcbiAqICAgICAg4pSCICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilIJcbiAqICAgICDilIzilrzilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgICAgICAgICAgICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pa84pSA4pSQXG4gKiAgICAg4pSCY29udGFpbmVyQuKUgiAgICAgICAgICAgICDilIJjb250YWluZXJD4pSCXG4gKiAgICAg4pSCICAgICAgICAgIOKUgiAgICAgICAgICAgICDilIIgICAgICAgICAg4pSCXG4gKiAgICAg4pSCICBwcm92RCAgIOKUgiAgICAgICAgICAgICDilIIgIHByb3ZGICAg4pSCXG4gKiAgICAg4pSCICBwcm92RSAgIOKUgiAgICAgICAgICAgICDilIIgIHByb3ZHICAg4pSCXG4gKiAgICAg4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYICAgICAgICAgICAgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmFxuICogYGBgXG4gKlxuICogRWFjaCBzdGVwIG9mIHRoZSB0cmF2ZXJzYWwsXG4gKlxuICogYGBgXG4gKiB2aXNpdG9yKHByb3ZELCBjb250YWluZXJCKVxuICogcHJvdmlkZXJUb1BhdGggPT09IE1hcCB7IHByb3ZEID0+IFtjb250YWluZXJCXSB9XG4gKiB2aXNpdGVkQ29udGFpbmVycyA9PT0gU2V0IHsgY29udGFpbmVyQiB9XG4gKlxuICogdmlzaXRvcihwcm92RSwgY29udGFpbmVyQilcbiAqIHByb3ZpZGVyVG9QYXRoID09PSBNYXAgeyBwcm92RCA9PiBbY29udGFpbmVyQl0sIHByb3ZFID0+IFtjb250YWluZXJCXSB9XG4gKiB2aXNpdGVkQ29udGFpbmVycyA9PT0gU2V0IHsgY29udGFpbmVyQiB9XG4gKlxuICogdmlzaXRvcihwcm92RiwgY29udGFpbmVyQylcbiAqIHByb3ZpZGVyVG9QYXRoID09PSBNYXAgeyBwcm92RCA9PiBbY29udGFpbmVyQl0sIHByb3ZFID0+IFtjb250YWluZXJCXSwgcHJvdkYgPT4gW2NvbnRhaW5lckNdIH1cbiAqIHZpc2l0ZWRDb250YWluZXJzID09PSBTZXQgeyBjb250YWluZXJCLCBjb250YWluZXJDIH1cbiAqXG4gKiB2aXNpdG9yKHByb3ZHLCBjb250YWluZXJDKVxuICogcHJvdmlkZXJUb1BhdGggPT09IE1hcCB7XG4gKiAgIHByb3ZEID0+IFtjb250YWluZXJCXSwgcHJvdkUgPT4gW2NvbnRhaW5lckJdLCBwcm92RiA9PiBbY29udGFpbmVyQ10sIHByb3ZHID0+IFtjb250YWluZXJDXVxuICogfVxuICogdmlzaXRlZENvbnRhaW5lcnMgPT09IFNldCB7IGNvbnRhaW5lckIsIGNvbnRhaW5lckMgfVxuICpcbiAqIHZpc2l0b3IocHJvdkEsIGNvbnRhaW5lckEpXG4gKiBwcm92aWRlclRvUGF0aCA9PT0gTWFwIHtcbiAqICAgcHJvdkQgPT4gW2NvbnRhaW5lckEsIGNvbnRhaW5lckJdLFxuICogICBwcm92RSA9PiBbY29udGFpbmVyQSwgY29udGFpbmVyQl0sXG4gKiAgIHByb3ZGID0+IFtjb250YWluZXJBLCBjb250YWluZXJDXSxcbiAqICAgcHJvdkcgPT4gW2NvbnRhaW5lckEsIGNvbnRhaW5lckNdLFxuICogICBwcm92QSA9PiBbY29udGFpbmVyQV1cbiAqIH1cbiAqIHZpc2l0ZWRDb250YWluZXJzID09PSBTZXQgeyBjb250YWluZXJCLCBjb250YWluZXJDLCBjb250YWluZXJBIH1cbiAqXG4gKiB2aXNpdG9yKHByb3ZCLCBjb250YWluZXJBKVxuICogcHJvdmlkZXJUb1BhdGggPT09IE1hcCB7XG4gKiAgIHByb3ZEID0+IFtjb250YWluZXJBLCBjb250YWluZXJCXSxcbiAqICAgcHJvdkUgPT4gW2NvbnRhaW5lckEsIGNvbnRhaW5lckJdLFxuICogICBwcm92RiA9PiBbY29udGFpbmVyQSwgY29udGFpbmVyQ10sXG4gKiAgIHByb3ZHID0+IFtjb250YWluZXJBLCBjb250YWluZXJDXSxcbiAqICAgcHJvdkEgPT4gW2NvbnRhaW5lckFdXG4gKiAgIHByb3ZCID0+IFtjb250YWluZXJBXVxuICogfVxuICogdmlzaXRlZENvbnRhaW5lcnMgPT09IFNldCB7IGNvbnRhaW5lckIsIGNvbnRhaW5lckMsIGNvbnRhaW5lckEgfVxuICogYGBgXG4gKlxuICogQHBhcmFtIHByb3ZpZGVyVG9QYXRoIE1hcCBtYXAgb2YgcHJvdmlkZXJzIHRvIHBhdGhzIHRoYXQgdGhpcyBmdW5jdGlvbiBmaWxsc1xuICogQHBhcmFtIHZpc2l0ZWRDb250YWluZXJzIFNldCBhIHNldCB0byBrZWVwIHRyYWNrIG9mIHRoZSBjb250YWluZXJzIHdlJ3ZlIGFscmVhZHkgdmlzaXRlZFxuICogQHJldHVybiBmdW5jdGlvbihwcm92aWRlciBTaW5nbGVQcm92aWRlciwgY29udGFpbmVyOiBUeXBlPHVua25vd24+IHwgSW5qZWN0b3JUeXBlPHVua25vd24+KSA9PlxuICogICAgIHZvaWRcbiAqL1xuZnVuY3Rpb24gd2Fsa1Byb3ZpZGVyVHJlZVRvRGlzY292ZXJJbXBvcnRQYXRocyhcbiAgICBwcm92aWRlclRvUGF0aDogTWFwPFNpbmdsZVByb3ZpZGVyLCAoVHlwZTx1bmtub3duPnwgSW5qZWN0b3JUeXBlPHVua25vd24+KVtdPixcbiAgICB2aXNpdGVkQ29udGFpbmVyczogU2V0PFR5cGU8dW5rbm93bj4+KTpcbiAgICAocHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyLCBjb250YWluZXI6IFR5cGU8dW5rbm93bj58SW5qZWN0b3JUeXBlPHVua25vd24+KSA9PiB2b2lkIHtcbiAgcmV0dXJuIChwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIsIGNvbnRhaW5lcjogVHlwZTx1bmtub3duPnxJbmplY3RvclR5cGU8dW5rbm93bj4pID0+IHtcbiAgICAvLyBJZiB0aGUgcHJvdmlkZXIgaXMgbm90IGFscmVhZHkgaW4gdGhlIHByb3ZpZGVyVG9QYXRoIG1hcCxcbiAgICAvLyBhZGQgYW4gZW50cnkgd2l0aCB0aGUgcHJvdmlkZXIgYXMgdGhlIGtleSBhbmQgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgY3VycmVudCBjb250YWluZXIgYXNcbiAgICAvLyB0aGUgdmFsdWVcbiAgICBpZiAoIXByb3ZpZGVyVG9QYXRoLmhhcyhwcm92aWRlcikpIHtcbiAgICAgIHByb3ZpZGVyVG9QYXRoLnNldChwcm92aWRlciwgW2NvbnRhaW5lcl0pO1xuICAgIH1cblxuICAgIC8vIFRoaXMgYmxvY2sgd2lsbCBydW4gZXhhY3RseSBvbmNlIGZvciBlYWNoIGNvbnRhaW5lciBpbiB0aGUgaW1wb3J0IHRyZWUuXG4gICAgLy8gVGhpcyBpcyB3aGVyZSB3ZSBydW4gdGhlIGxvZ2ljIHRvIGNoZWNrIHRoZSBpbXBvcnRzIGFycmF5IG9mIHRoZSBjdXJyZW50XG4gICAgLy8gY29udGFpbmVyIHRvIHNlZSBpZiBpdCdzIHRoZSBuZXh0IGNvbnRhaW5lciBpbiB0aGUgcGF0aCBmb3Igb3VyIGN1cnJlbnRseVxuICAgIC8vIGRpc2NvdmVyZWQgcHJvdmlkZXJzLlxuICAgIGlmICghdmlzaXRlZENvbnRhaW5lcnMuaGFzKGNvbnRhaW5lcikpIHtcbiAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgcHJvdmlkZXJzIHdlJ3ZlIGFscmVhZHkgc2VlblxuICAgICAgZm9yIChjb25zdCBwcm92IG9mIHByb3ZpZGVyVG9QYXRoLmtleXMoKSkge1xuICAgICAgICBjb25zdCBleGlzdGluZ0ltcG9ydFBhdGggPSBwcm92aWRlclRvUGF0aC5nZXQocHJvdikhO1xuXG4gICAgICAgIGxldCBjb250YWluZXJEZWYgPSBnZXRJbmplY3RvckRlZihjb250YWluZXIpO1xuICAgICAgICBpZiAoIWNvbnRhaW5lckRlZikge1xuICAgICAgICAgIGNvbnN0IG5nTW9kdWxlOiBUeXBlPHVua25vd24+fHVuZGVmaW5lZCA9XG4gICAgICAgICAgICAgIChjb250YWluZXIgYXMgYW55KS5uZ01vZHVsZSBhcyBUeXBlPHVua25vd24+fCB1bmRlZmluZWQ7XG4gICAgICAgICAgY29udGFpbmVyRGVmID0gZ2V0SW5qZWN0b3JEZWYobmdNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb250YWluZXJEZWYpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYXN0Q29udGFpbmVyQWRkZWRUb1BhdGggPSBleGlzdGluZ0ltcG9ydFBhdGhbMF07XG5cbiAgICAgICAgbGV0IGlzTmV4dFN0ZXBJblBhdGggPSBmYWxzZTtcbiAgICAgICAgZGVlcEZvckVhY2goY29udGFpbmVyRGVmLmltcG9ydHMsIChtb2R1bGVJbXBvcnQpID0+IHtcbiAgICAgICAgICBpZiAoaXNOZXh0U3RlcEluUGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlzTmV4dFN0ZXBJblBhdGggPSAobW9kdWxlSW1wb3J0IGFzIGFueSkubmdNb2R1bGUgPT09IGxhc3RDb250YWluZXJBZGRlZFRvUGF0aCB8fFxuICAgICAgICAgICAgICBtb2R1bGVJbXBvcnQgPT09IGxhc3RDb250YWluZXJBZGRlZFRvUGF0aDtcblxuICAgICAgICAgIGlmIChpc05leHRTdGVwSW5QYXRoKSB7XG4gICAgICAgICAgICBwcm92aWRlclRvUGF0aC5nZXQocHJvdik/LnVuc2hpZnQoY29udGFpbmVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZpc2l0ZWRDb250YWluZXJzLmFkZChjb250YWluZXIpO1xuICB9O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHByb3ZpZGVycyBjb25maWd1cmVkIG9uIGFuIEVudmlyb25tZW50SW5qZWN0b3JcbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgRW52aXJvbm1lbnRJbmplY3RvclxuICogQHJldHVybnMgYW4gYXJyYXkgb2Ygb2JqZWN0cyByZXByZXNlbnRpbmcgdGhlIHByb3ZpZGVycyBvZiB0aGUgZ2l2ZW4gaW5qZWN0b3JcbiAqL1xuZnVuY3Rpb24gZ2V0RW52aXJvbm1lbnRJbmplY3RvclByb3ZpZGVycyhpbmplY3RvcjogRW52aXJvbm1lbnRJbmplY3Rvcik6IFByb3ZpZGVyUmVjb3JkW10ge1xuICBjb25zdCBwcm92aWRlclJlY29yZHNXaXRob3V0SW1wb3J0UGF0aHMgPVxuICAgICAgZ2V0RnJhbWV3b3JrRElEZWJ1Z0RhdGEoKS5yZXNvbHZlclRvUHJvdmlkZXJzLmdldChpbmplY3RvcikgPz8gW107XG5cbiAgLy8gcGxhdGZvcm0gaW5qZWN0b3IgaGFzIG5vIHByb3ZpZGVyIGltcG9ydHMgY29udGFpbmVyIHNvIGNhbiB3ZSBza2lwIHRyeWluZyB0b1xuICAvLyBmaW5kIGltcG9ydCBwYXRoc1xuICBpZiAoaXNQbGF0Zm9ybUluamVjdG9yKGluamVjdG9yKSkge1xuICAgIHJldHVybiBwcm92aWRlclJlY29yZHNXaXRob3V0SW1wb3J0UGF0aHM7XG4gIH1cblxuICBjb25zdCBwcm92aWRlckltcG9ydHNDb250YWluZXIgPSBnZXRQcm92aWRlckltcG9ydHNDb250YWluZXIoaW5qZWN0b3IpO1xuICBpZiAocHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyID09PSBudWxsKSB7XG4gICAgLy8gVGhlcmUgaXMgYSBzcGVjaWFsIGNhc2Ugd2hlcmUgdGhlIGJvb3RzdHJhcHBlZCBjb21wb25lbnQgZG9lcyBub3RcbiAgICAvLyBpbXBvcnQgYW55IE5nTW9kdWxlcy4gSW4gdGhpcyBjYXNlIHRoZSBlbnZpcm9ubWVudCBpbmplY3RvciBjb25uZWN0ZWQgdG9cbiAgICAvLyB0aGF0IGNvbXBvbmVudCBpcyB0aGUgcm9vdCBpbmplY3Rvciwgd2hpY2ggZG9lcyBub3QgaGF2ZSBhIHByb3ZpZGVyIGltcG9ydHNcbiAgICAvLyBjb250YWluZXIgKGFuZCB0aHVzIG5vIGNvbmNlcHQgb2YgbW9kdWxlIGltcG9ydCBwYXRocykuIFRoZXJlZm9yZSB3ZSBzaW1wbHlcbiAgICAvLyByZXR1cm4gdGhlIHByb3ZpZGVyIHJlY29yZHMgYXMgaXMuXG4gICAgaWYgKGlzUm9vdEluamVjdG9yKGluamVjdG9yKSkge1xuICAgICAgcmV0dXJuIHByb3ZpZGVyUmVjb3Jkc1dpdGhvdXRJbXBvcnRQYXRocztcbiAgICB9XG5cbiAgICB0aHJvd0Vycm9yKCdDb3VsZCBub3QgZGV0ZXJtaW5lIHdoZXJlIGluamVjdG9yIHByb3ZpZGVycyB3ZXJlIGNvbmZpZ3VyZWQuJyk7XG4gIH1cblxuICBjb25zdCBwcm92aWRlclRvUGF0aCA9IGdldFByb3ZpZGVySW1wb3J0UGF0aHMocHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyKTtcbiAgY29uc3QgcHJvdmlkZXJSZWNvcmRzID0gW107XG5cbiAgZm9yIChjb25zdCBwcm92aWRlclJlY29yZCBvZiBwcm92aWRlclJlY29yZHNXaXRob3V0SW1wb3J0UGF0aHMpIHtcbiAgICBjb25zdCBwcm92aWRlciA9IHByb3ZpZGVyUmVjb3JkLnByb3ZpZGVyO1xuICAgIC8vIElnbm9yZSB0aGVzZSBzcGVjaWFsIHByb3ZpZGVycyBmb3Igbm93IHVudGlsIHdlIGhhdmUgYSBjbGVhbmVyIHdheSBvZlxuICAgIC8vIGRldGVybWluZyB3aGVuIHRoZXkgYXJlIHByb3ZpZGVkIGJ5IHRoZSBmcmFtZXdvcmsgdnMgcHJvdmlkZWQgYnkgdGhlIHVzZXIuXG4gICAgY29uc3QgdG9rZW4gPSAocHJvdmlkZXIgYXMgVmFsdWVQcm92aWRlcikucHJvdmlkZTtcbiAgICBpZiAodG9rZW4gPT09IEVOVklST05NRU5UX0lOSVRJQUxJWkVSIHx8IHRva2VuID09PSBJTkpFQ1RPUl9ERUZfVFlQRVMpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGxldCBpbXBvcnRQYXRoID0gcHJvdmlkZXJUb1BhdGguZ2V0KHByb3ZpZGVyKSA/PyBbXTtcblxuICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZihwcm92aWRlckltcG9ydHNDb250YWluZXIpO1xuICAgIGNvbnN0IGlzU3RhbmRhbG9uZUNvbXBvbmVudCA9ICEhZGVmPy5zdGFuZGFsb25lO1xuICAgIC8vIFdlIHByZXBlbmQgdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvciBpbiB0aGUgc3RhbmRhbG9uZSBjYXNlXG4gICAgLy8gYmVjYXVzZSB3YWxrUHJvdmlkZXJUcmVlIGRvZXMgbm90IHZpc2l0IHRoaXMgY29uc3RydWN0b3IgZHVyaW5nIGl0J3MgdHJhdmVyc2FsXG4gICAgaWYgKGlzU3RhbmRhbG9uZUNvbXBvbmVudCkge1xuICAgICAgaW1wb3J0UGF0aCA9IFtwcm92aWRlckltcG9ydHNDb250YWluZXIsIC4uLmltcG9ydFBhdGhdO1xuICAgIH1cblxuICAgIHByb3ZpZGVyUmVjb3Jkcy5wdXNoKHsuLi5wcm92aWRlclJlY29yZCwgaW1wb3J0UGF0aH0pO1xuICB9XG4gIHJldHVybiBwcm92aWRlclJlY29yZHM7XG59XG5cbmZ1bmN0aW9uIGlzUGxhdGZvcm1JbmplY3RvcihpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgcmV0dXJuIGluamVjdG9yIGluc3RhbmNlb2YgUjNJbmplY3RvciAmJiBpbmplY3Rvci5zY29wZXMuaGFzKCdwbGF0Zm9ybScpO1xufVxuXG5mdW5jdGlvbiBpc1Jvb3RJbmplY3RvcihpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgcmV0dXJuIGluamVjdG9yIGluc3RhbmNlb2YgUjNJbmplY3RvciAmJiBpbmplY3Rvci5zY29wZXMuaGFzKCdyb290Jyk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgcHJvdmlkZXJzIGNvbmZpZ3VyZWQgb24gYW4gaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIHRoZSBpbmplY3RvciB0byBsb29rdXAgdGhlIHByb3ZpZGVycyBvZlxuICogQHJldHVybnMgUHJvdmlkZXJSZWNvcmRbXSBhbiBhcnJheSBvZiBvYmplY3RzIHJlcHJlc2VudGluZyB0aGUgcHJvdmlkZXJzIG9mIHRoZSBnaXZlbiBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3JQcm92aWRlcnMoaW5qZWN0b3I6IEluamVjdG9yKTogUHJvdmlkZXJSZWNvcmRbXSB7XG4gIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIE5vZGVJbmplY3Rvcikge1xuICAgIHJldHVybiBnZXROb2RlSW5qZWN0b3JQcm92aWRlcnMoaW5qZWN0b3IpO1xuICB9IGVsc2UgaWYgKGluamVjdG9yIGluc3RhbmNlb2YgRW52aXJvbm1lbnRJbmplY3Rvcikge1xuICAgIHJldHVybiBnZXRFbnZpcm9ubWVudEluamVjdG9yUHJvdmlkZXJzKGluamVjdG9yIGFzIEVudmlyb25tZW50SW5qZWN0b3IpO1xuICB9XG5cbiAgdGhyb3dFcnJvcignZ2V0SW5qZWN0b3JQcm92aWRlcnMgb25seSBzdXBwb3J0cyBOb2RlSW5qZWN0b3IgYW5kIEVudmlyb25tZW50SW5qZWN0b3InKTtcbn1cblxuLyoqXG4gKlxuICogR2l2ZW4gYW4gaW5qZWN0b3IsIHRoaXMgZnVuY3Rpb24gd2lsbCByZXR1cm5cbiAqIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSB0eXBlIGFuZCBzb3VyY2Ugb2YgdGhlIGluamVjdG9yLlxuICpcbiAqIHwgICAgICAgICAgICAgIHwgdHlwZSAgICAgICAgfCBzb3VyY2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiB8LS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tfFxuICogfCBOb2RlSW5qZWN0b3IgfCBlbGVtZW50ICAgICB8IERPTSBlbGVtZW50IHRoYXQgY3JlYXRlZCB0aGlzIGluamVjdG9yICAgICAgICAgICAgICAgICAgICAgIHxcbiAqIHwgUjNJbmplY3RvciAgIHwgZW52aXJvbm1lbnQgfCBgaW5qZWN0b3Iuc291cmNlYCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiB8IE51bGxJbmplY3RvciB8IG51bGwgICAgICAgIHwgbnVsbCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICpcbiAqIEBwYXJhbSBpbmplY3RvciB0aGUgSW5qZWN0b3IgdG8gZ2V0IG1ldGFkYXRhIGZvclxuICogQHJldHVybnMgYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHR5cGUgYW5kIHNvdXJjZSBvZiB0aGUgZ2l2ZW4gaW5qZWN0b3IuIElmIHRoZSBpbmplY3RvciBtZXRhZGF0YVxuICogICAgIGNhbm5vdCBiZSBkZXRlcm1pbmVkLCByZXR1cm5zIG51bGwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3Rvck1ldGFkYXRhKGluamVjdG9yOiBJbmplY3Rvcik6XG4gICAge3R5cGU6IHN0cmluZzsgc291cmNlOiBSRWxlbWVudCB8IHN0cmluZyB8IG51bGx9fG51bGwge1xuICBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3IpIHtcbiAgICBjb25zdCBsVmlldyA9IGdldE5vZGVJbmplY3RvckxWaWV3KGluamVjdG9yKTtcbiAgICBjb25zdCB0Tm9kZSA9IGdldE5vZGVJbmplY3RvclROb2RlKGluamVjdG9yKSE7XG4gICAgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgbFZpZXcpO1xuXG4gICAgcmV0dXJuIHt0eXBlOiAnZWxlbWVudCcsIHNvdXJjZTogZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50fTtcbiAgfVxuXG4gIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIFIzSW5qZWN0b3IpIHtcbiAgICByZXR1cm4ge3R5cGU6ICdlbnZpcm9ubWVudCcsIHNvdXJjZTogaW5qZWN0b3Iuc291cmNlID8/IG51bGx9O1xuICB9XG5cbiAgaWYgKGluamVjdG9yIGluc3RhbmNlb2YgTnVsbEluamVjdG9yKSB7XG4gICAgcmV0dXJuIHt0eXBlOiAnbnVsbCcsIHNvdXJjZTogbnVsbH07XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluamVjdG9yUmVzb2x1dGlvblBhdGgoaW5qZWN0b3I6IEluamVjdG9yKTogSW5qZWN0b3JbXSB7XG4gIGNvbnN0IHJlc29sdXRpb25QYXRoOiBJbmplY3RvcltdID0gW2luamVjdG9yXTtcbiAgZ2V0SW5qZWN0b3JSZXNvbHV0aW9uUGF0aEhlbHBlcihpbmplY3RvciwgcmVzb2x1dGlvblBhdGgpO1xuICByZXR1cm4gcmVzb2x1dGlvblBhdGg7XG59XG5cbmZ1bmN0aW9uIGdldEluamVjdG9yUmVzb2x1dGlvblBhdGhIZWxwZXIoXG4gICAgaW5qZWN0b3I6IEluamVjdG9yLCByZXNvbHV0aW9uUGF0aDogSW5qZWN0b3JbXSk6IEluamVjdG9yW10ge1xuICBjb25zdCBwYXJlbnQgPSBnZXRJbmplY3RvclBhcmVudChpbmplY3Rvcik7XG5cbiAgLy8gaWYgZ2V0SW5qZWN0b3JQYXJlbnQgY2FuJ3QgZmluZCBhIHBhcmVudCwgdGhlbiB3ZSd2ZSBlaXRoZXIgcmVhY2hlZCB0aGUgZW5kXG4gIC8vIG9mIHRoZSBwYXRoLCBvciB3ZSBuZWVkIHRvIG1vdmUgZnJvbSB0aGUgRWxlbWVudCBJbmplY3RvciB0cmVlIHRvIHRoZVxuICAvLyBtb2R1bGUgaW5qZWN0b3IgdHJlZSB1c2luZyB0aGUgZmlyc3QgaW5qZWN0b3IgaW4gb3VyIHBhdGggYXMgdGhlIGNvbm5lY3Rpb24gcG9pbnQuXG4gIGlmIChwYXJlbnQgPT09IG51bGwpIHtcbiAgICBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3IpIHtcbiAgICAgIGNvbnN0IGZpcnN0SW5qZWN0b3IgPSByZXNvbHV0aW9uUGF0aFswXTtcbiAgICAgIGlmIChmaXJzdEluamVjdG9yIGluc3RhbmNlb2YgTm9kZUluamVjdG9yKSB7XG4gICAgICAgIGNvbnN0IG1vZHVsZUluamVjdG9yID0gZ2V0TW9kdWxlSW5qZWN0b3JPZk5vZGVJbmplY3RvcihmaXJzdEluamVjdG9yKTtcbiAgICAgICAgaWYgKG1vZHVsZUluamVjdG9yID09PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcignTm9kZUluamVjdG9yIG11c3QgaGF2ZSBzb21lIGNvbm5lY3Rpb24gdG8gdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHV0aW9uUGF0aC5wdXNoKG1vZHVsZUluamVjdG9yKTtcbiAgICAgICAgZ2V0SW5qZWN0b3JSZXNvbHV0aW9uUGF0aEhlbHBlcihtb2R1bGVJbmplY3RvciwgcmVzb2x1dGlvblBhdGgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzb2x1dGlvblBhdGg7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJlc29sdXRpb25QYXRoLnB1c2gocGFyZW50KTtcbiAgICBnZXRJbmplY3RvclJlc29sdXRpb25QYXRoSGVscGVyKHBhcmVudCwgcmVzb2x1dGlvblBhdGgpO1xuICB9XG5cbiAgcmV0dXJuIHJlc29sdXRpb25QYXRoO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHBhcmVudCBvZiBhbiBpbmplY3Rvci5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIG5vdCBhYmxlIHRvIG1ha2UgdGhlIGp1bXAgZnJvbSB0aGUgRWxlbWVudCBJbmplY3RvciBUcmVlIHRvIHRoZSBNb2R1bGVcbiAqIGluamVjdG9yIHRyZWUuIFRoaXMgaXMgYmVjYXVzZSB0aGUgXCJwYXJlbnRcIiAodGhlIG5leHQgc3RlcCBpbiB0aGUgcmVvc2x1dGlvbiBwYXRoKVxuICogb2YgYSByb290IE5vZGVJbmplY3RvciBpcyBkZXBlbmRlbnQgb24gd2hpY2ggTm9kZUluamVjdG9yIGFuY2VzdG9yIGluaXRpYXRlZFxuICogdGhlIERJIGxvb2t1cC4gU2VlIGdldEluamVjdG9yUmVzb2x1dGlvblBhdGggZm9yIGEgZnVuY3Rpb24gdGhhdCBjYW4gbWFrZSB0aGlzIGp1bXAuXG4gKlxuICogSW4gdGhlIGJlbG93IGRpYWdyYW06XG4gKiBgYGB0c1xuICogZ2V0SW5qZWN0b3JQYXJlbnQoTm9kZUluamVjdG9yQilcbiAqICA+IE5vZGVJbmplY3RvckFcbiAqIGdldEluamVjdG9yUGFyZW50KE5vZGVJbmplY3RvckEpIC8vIG9yIGdldEluamVjdG9yUGFyZW50KGdldEluamVjdG9yUGFyZW50KE5vZGVJbmplY3RvckIpKVxuICogID4gbnVsbCAvLyBjYW5ub3QganVtcCB0byBNb2R1bGVJbmplY3RvciB0cmVlXG4gKiBgYGBcbiAqXG4gKiBgYGBcbiAqICAgICAgICAgICAgICAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCAgICAgICAgICAgICAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJBcbiAqICAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpE1vZHVsZUHilJzilIDilIDilIBJbmplY3RvcuKUgOKUgOKUgOKUgOKWuuKUgkVudmlyb25tZW50SW5qZWN0b3LilIJcbiAqICAgIOKUgiAgICAgICAgICAg4pSU4pSA4pSA4pSA4pSs4pSA4pSA4pSA4pSYICAgICAgICAgICAgICAgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmFxuICogICAg4pSCICAgICAgICAgICAgICAg4pSCXG4gKiAgICDilIIgICAgICAgICAgIGJvb3RzdHJhcHNcbiAqICAgIOKUgiAgICAgICAgICAgICAgIOKUglxuICogICAg4pSCICAgICAgICAgICAgICAg4pSCXG4gKiAgICDilIIgICAgICAgICAg4pSM4pSA4pSA4pSA4pSA4pa84pSA4pSA4pSA4pSA4pSA4pSQICAgICAgICAgICAgICAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJBcbiAqIGRlY2xhcmVzICAgICAg4pSCQ29tcG9uZW50QeKUnOKUgOKUgOKUgOKUgEluamVjdG9y4pSA4pSA4pSA4pSA4pa64pSCTm9kZUluamVjdG9yQeKUglxuICogICAg4pSCICAgICAgICAgIOKUlOKUgOKUgOKUgOKUgOKUrOKUgOKUgOKUgOKUgOKUgOKUmCAgICAgICAgICAgICAgICAg4pSU4pSA4pSA4pSA4pSA4pSA4pay4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYXG4gKiAgICDilIIgICAgICAgICAgICAgICDilIIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUglxuICogICAg4pSCICAgICAgICAgICAgcmVuZGVycyAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFxuICogICAg4pSCICAgICAgICAgICAgICAg4pSCICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilIJcbiAqICAgIOKUgiAgICAgICAgICDilIzilIDilIDilIDilIDilrzilIDilIDilIDilIDilIDilJAgICAgICAgICAgICAgICAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUtOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkFxuICogICAg4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pa64pSCQ29tcG9uZW50QuKUnOKUgOKUgOKUgOKUgEluamVjdG9y4pSA4pSA4pSA4pSA4pa64pSCTm9kZUluamVjdG9yQuKUglxuICogICAgICAgICAgICAgICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJggICAgICAgICAgICAgICAgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmFxuICpgYGBcbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgYW4gSW5qZWN0b3IgdG8gZ2V0IHRoZSBwYXJlbnQgb2ZcbiAqIEByZXR1cm5zIEluamVjdG9yIHRoZSBwYXJlbnQgb2YgdGhlIGdpdmVuIGluamVjdG9yXG4gKi9cbmZ1bmN0aW9uIGdldEluamVjdG9yUGFyZW50KGluamVjdG9yOiBJbmplY3Rvcik6IEluamVjdG9yfG51bGwge1xuICBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBSM0luamVjdG9yKSB7XG4gICAgcmV0dXJuIGluamVjdG9yLnBhcmVudDtcbiAgfVxuXG4gIGxldCB0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICBsZXQgbFZpZXc6IExWaWV3PHVua25vd24+O1xuICBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3IpIHtcbiAgICB0Tm9kZSA9IGdldE5vZGVJbmplY3RvclROb2RlKGluamVjdG9yKTtcbiAgICBsVmlldyA9IGdldE5vZGVJbmplY3RvckxWaWV3KGluamVjdG9yKTtcbiAgfSBlbHNlIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIE51bGxJbmplY3Rvcikge1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2Uge1xuICAgIHRocm93RXJyb3IoXG4gICAgICAgICdnZXRJbmplY3RvclBhcmVudCBvbmx5IHN1cHBvcnQgaW5qZWN0b3JzIG9mIHR5cGUgUjNJbmplY3RvciwgTm9kZUluamVjdG9yLCBOdWxsSW5qZWN0b3InKTtcbiAgfVxuXG4gIGNvbnN0IHBhcmVudExvY2F0aW9uID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbihcbiAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBsVmlldyk7XG5cbiAgaWYgKGhhc1BhcmVudEluamVjdG9yKHBhcmVudExvY2F0aW9uKSkge1xuICAgIGNvbnN0IHBhcmVudEluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICBjb25zdCBwYXJlbnRMVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgbFZpZXcpO1xuICAgIGNvbnN0IHBhcmVudFRWaWV3ID0gcGFyZW50TFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IHBhcmVudFROb2RlID0gcGFyZW50VFZpZXcuZGF0YVtwYXJlbnRJbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlROT0RFXSBhcyBUTm9kZTtcbiAgICByZXR1cm4gbmV3IE5vZGVJbmplY3RvcihcbiAgICAgICAgcGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHBhcmVudExWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjaGFpbmVkSW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0gYXMgQ2hhaW5lZEluamVjdG9yO1xuXG4gICAgLy8gQ2FzZSB3aGVyZSBjaGFpbmVkSW5qZWN0b3IuaW5qZWN0b3IgaXMgYW4gT3V0bGV0SW5qZWN0b3IgYW5kIGNoYWluZWRJbmplY3Rvci5pbmplY3Rvci5wYXJlbnRcbiAgICAvLyBpcyBhIE5vZGVJbmplY3Rvci5cbiAgICAvLyB0b2RvKGFsZWtzYW5kZXJib2R1cnJpKTogaWRlYWxseSBub3RoaW5nIGluIHBhY2thZ2VzL2NvcmUgc2hvdWxkIGRlYWxcbiAgICAvLyBkaXJlY3RseSB3aXRoIHJvdXRlciBjb25jZXJucy4gUmVmYWN0b3IgdGhpcyBzbyB0aGF0IHdlIGNhbiBtYWtlIHRoZSBqdW1wIGZyb21cbiAgICAvLyBOb2RlSW5qZWN0b3IgLT4gT3V0bGV0SW5qZWN0b3IgLT4gTm9kZUluamVjdG9yXG4gICAgLy8gd2l0aG91dCBleHBsaWN0bHkgcmVseWluZyBvbiB0eXBlcyBjb250cmFjdHMgZnJvbSBwYWNrYWdlcy9yb3V0ZXJcbiAgICBjb25zdCBpbmplY3RvclBhcmVudCA9IChjaGFpbmVkSW5qZWN0b3IuaW5qZWN0b3IgYXMgYW55KT8ucGFyZW50IGFzIEluamVjdG9yO1xuXG4gICAgaWYgKGluamVjdG9yUGFyZW50IGluc3RhbmNlb2YgTm9kZUluamVjdG9yKSB7XG4gICAgICByZXR1cm4gaW5qZWN0b3JQYXJlbnQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbW9kdWxlIGluamVjdG9yIG9mIGEgTm9kZUluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBOb2RlSW5qZWN0b3IgdG8gZ2V0IG1vZHVsZSBpbmplY3RvciBvZlxuICogQHJldHVybnMgSW5qZWN0b3IgcmVwcmVzZW50aW5nIG1vZHVsZSBpbmplY3RvciBvZiB0aGUgZ2l2ZW4gTm9kZUluamVjdG9yXG4gKi9cbmZ1bmN0aW9uIGdldE1vZHVsZUluamVjdG9yT2ZOb2RlSW5qZWN0b3IoaW5qZWN0b3I6IE5vZGVJbmplY3Rvcik6IEluamVjdG9yIHtcbiAgbGV0IGxWaWV3OiBMVmlldzx1bmtub3duPjtcbiAgaWYgKGluamVjdG9yIGluc3RhbmNlb2YgTm9kZUluamVjdG9yKSB7XG4gICAgbFZpZXcgPSBnZXROb2RlSW5qZWN0b3JMVmlldyhpbmplY3Rvcik7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3dFcnJvcignZ2V0TW9kdWxlSW5qZWN0b3JPZk5vZGVJbmplY3RvciBtdXN0IGJlIGNhbGxlZCB3aXRoIGEgTm9kZUluamVjdG9yJyk7XG4gIH1cblxuICBjb25zdCBjaGFpbmVkSW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0gYXMgQ2hhaW5lZEluamVjdG9yO1xuICBjb25zdCBtb2R1bGVJbmplY3RvciA9IGNoYWluZWRJbmplY3Rvci5wYXJlbnRJbmplY3RvcjtcbiAgaWYgKCFtb2R1bGVJbmplY3Rvcikge1xuICAgIHRocm93RXJyb3IoJ05vZGVJbmplY3RvciBtdXN0IGhhdmUgc29tZSBjb25uZWN0aW9uIHRvIHRoZSBtb2R1bGUgaW5qZWN0b3IgdHJlZScpO1xuICB9XG5cbiAgcmV0dXJuIG1vZHVsZUluamVjdG9yO1xufVxuIl19