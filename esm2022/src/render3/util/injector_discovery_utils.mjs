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
        // convert injection flags to booleans
        const flags = dep.flags;
        dep.flags = {
            optional: (8 /* InternalInjectFlags.Optional */ & flags) === 8 /* InternalInjectFlags.Optional */,
            host: (1 /* InternalInjectFlags.Host */ & flags) === 1 /* InternalInjectFlags.Host */,
            self: (2 /* InternalInjectFlags.Self */ & flags) === 2 /* InternalInjectFlags.Self */,
            skipSelf: (4 /* InternalInjectFlags.SkipSelf */ & flags) === 4 /* InternalInjectFlags.SkipSelf */,
        };
        // find the injector that provided the dependency
        for (let i = 0; i < resolutionPath.length; i++) {
            const injectorToCheck = resolutionPath[i];
            // if skipSelf is true we skip the first injector
            if (i === 0 && dep.flags.skipSelf) {
                continue;
            }
            // host only applies to NodeInjectors
            if (dep.flags.host && injectorToCheck instanceof EnvironmentInjector) {
                break;
            }
            const instance = injectorToCheck.get(dep.token, null, { self: true, optional: true });
            if (instance !== null) {
                // if host flag is true we double check that we can get the service from the first element
                // in the resolution path by using the host flag. This is done to make sure that we've found
                // the correct providing injector, and not a node injector that is connected to our path via
                // a router outlet.
                if (dep.flags.host) {
                    const firstInjector = resolutionPath[0];
                    const lookupFromFirstInjector = firstInjector.get(dep.token, null, { ...dep.flags, optional: true });
                    if (lookupFromFirstInjector !== null) {
                        dep.providedIn = injectorToCheck;
                    }
                    break;
                }
                dep.providedIn = injectorToCheck;
                break;
            }
            // if self is true we stop after the first injector
            if (i === 0 && dep.flags.self) {
                break;
            }
        }
        // injectedIn contains private fields, so we omit it from the response
        const formattedDependency = {
            value: dep.value,
        };
        if (dep.token)
            formattedDependency.token = dep.token;
        if (dep.flags)
            formattedDependency.flags = dep.flags;
        if (dep.providedIn)
            formattedDependency.providedIn = dep.providedIn;
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
    const diResolver = getNodeInjectorLView(injector);
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
    const providerImportsContainer = getProviderImportsContainer(injector);
    if (providerImportsContainer === null) {
        throwError('Could not determine where injector providers were configured.');
    }
    const providerToPath = getProviderImportPaths(providerImportsContainer);
    const providerRecords = getFrameworkDIDebugData().resolverToProviders.get(injector) ?? [];
    return providerRecords.map(providerRecord => {
        let importPath = providerToPath.get(providerRecord.provider) ?? [providerImportsContainer];
        const def = getComponentDef(providerImportsContainer);
        const isStandaloneComponent = !!def?.standalone;
        // We prepend the component constructor in the standalone case
        // because walkProviderTree does not visit this constructor during it's traversal
        if (isStandaloneComponent) {
            importPath = [providerImportsContainer, ...providerToPath.get(providerRecord.provider) ?? []];
        }
        return { ...providerRecord, importPath };
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3JfZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy91dGlsL2luamVjdG9yX2Rpc2NvdmVyeV91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsY0FBYyxFQUFlLE1BQU0seUJBQXlCLENBQUM7QUFFckUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3BELE9BQU8sRUFBaUIsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RSxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsVUFBVSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFckUsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ3JGLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNuRCxPQUFPLEVBQWdCLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDOUMsT0FBTyxFQUFDLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLHlCQUF5QixFQUFFLFlBQVksRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUMxRyxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUk3RSxPQUFPLEVBQUMsUUFBUSxFQUFTLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRTFELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2xHLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFM0QsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sY0FBYyxDQUFDO0FBRTlDOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSw2QkFBNkIsQ0FDekMsUUFBa0IsRUFBRSxLQUFnQztJQUV0RCw2RkFBNkY7SUFDN0Ysa0ZBQWtGO0lBQ2xGLHVGQUF1RjtJQUN2Riw2Q0FBNkM7SUFDN0MsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztJQUN6RSxJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUU7UUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsS0FBSyxvQkFBb0IsQ0FBQyxDQUFDO0tBQy9FO0lBRUQsTUFBTSx1QkFBdUIsR0FBRyxpQ0FBaUMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbkYsTUFBTSxjQUFjLEdBQUcseUJBQXlCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFM0QsTUFBTSxZQUFZLEdBQUcsdUJBQXVCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ3JELHNDQUFzQztRQUN0QyxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBNEIsQ0FBQztRQUMvQyxHQUFHLENBQUMsS0FBSyxHQUFHO1lBQ1YsUUFBUSxFQUFFLENBQUMsdUNBQStCLEtBQUssQ0FBQyx5Q0FBaUM7WUFDakYsSUFBSSxFQUFFLENBQUMsbUNBQTJCLEtBQUssQ0FBQyxxQ0FBNkI7WUFDckUsSUFBSSxFQUFFLENBQUMsbUNBQTJCLEtBQUssQ0FBQyxxQ0FBNkI7WUFDckUsUUFBUSxFQUFFLENBQUMsdUNBQStCLEtBQUssQ0FBQyx5Q0FBaUM7U0FDbEYsQ0FBQztRQUVGLGlEQUFpRDtRQUNqRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM5QyxNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFMUMsaURBQWlEO1lBQ2pELElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRTtnQkFDakMsU0FBUzthQUNWO1lBRUQscUNBQXFDO1lBQ3JDLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksZUFBZSxZQUFZLG1CQUFtQixFQUFFO2dCQUNwRSxNQUFNO2FBQ1A7WUFFRCxNQUFNLFFBQVEsR0FDVixlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFzQixFQUFFLElBQUksRUFBRSxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7WUFFeEYsSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFO2dCQUNyQiwwRkFBMEY7Z0JBQzFGLDRGQUE0RjtnQkFDNUYsNEZBQTRGO2dCQUM1RixtQkFBbUI7Z0JBQ25CLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7b0JBQ2xCLE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDeEMsTUFBTSx1QkFBdUIsR0FDekIsYUFBYSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBc0IsRUFBRSxJQUFJLEVBQUUsRUFBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7b0JBRXhGLElBQUksdUJBQXVCLEtBQUssSUFBSSxFQUFFO3dCQUNwQyxHQUFHLENBQUMsVUFBVSxHQUFHLGVBQWUsQ0FBQztxQkFDbEM7b0JBRUQsTUFBTTtpQkFDUDtnQkFFRCxHQUFHLENBQUMsVUFBVSxHQUFHLGVBQWUsQ0FBQztnQkFDakMsTUFBTTthQUNQO1lBRUQsbURBQW1EO1lBQ25ELElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRTtnQkFDN0IsTUFBTTthQUNQO1NBQ0Y7UUFFRCxzRUFBc0U7UUFDdEUsTUFBTSxtQkFBbUIsR0FBd0M7WUFDL0QsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO1NBQ2pCLENBQUM7UUFFRixJQUFJLEdBQUcsQ0FBQyxLQUFLO1lBQUUsbUJBQW1CLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7UUFDckQsSUFBSSxHQUFHLENBQUMsS0FBSztZQUFFLG1CQUFtQixDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDO1FBQ3JELElBQUksR0FBRyxDQUFDLFVBQVU7WUFBRSxtQkFBbUIsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUVwRSxPQUFPLG1CQUFtQixDQUFDO0lBQzdCLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUMsQ0FBQztBQUNsQyxDQUFDO0FBRUQsU0FBUyxpQ0FBaUMsQ0FDdEMsS0FBZ0MsRUFBRSxRQUFrQjtJQUN0RCxNQUFNLEVBQUMsNkJBQTZCLEVBQUMsR0FBRyx1QkFBdUIsRUFBRSxDQUFDO0lBRWxFLElBQUksQ0FBQyxDQUFDLFFBQVEsWUFBWSxZQUFZLENBQUMsRUFBRTtRQUN2QyxPQUFPLDZCQUE2QixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFnQixDQUFDLElBQUksRUFBRSxDQUFDO0tBQ25GO0lBRUQsTUFBTSxLQUFLLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDN0MsTUFBTSxrQkFBa0IsR0FBRyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEUsTUFBTSxZQUFZLEdBQUcsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLEtBQWdCLENBQUMsSUFBSSxFQUFFLENBQUM7SUFFckUsd0ZBQXdGO0lBQ3hGLG9GQUFvRjtJQUNwRixtRUFBbUU7SUFDbkUsT0FBTyxZQUFZLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQ3RDLE1BQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDO1FBQ3BELElBQUksY0FBYyxLQUFLLFNBQVMsRUFBRTtZQUNoQyxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsTUFBTSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEQsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzVCLFdBQVcsQ0FBQyxZQUFhLENBQUMsQ0FBQztRQUUzQixPQUFPLGNBQWMsS0FBSyxZQUFZLENBQUM7SUFDekMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILFNBQVMsMkJBQTJCLENBQUMsUUFBa0I7SUFDckQsTUFBTSxFQUFDLDZCQUE2QixFQUFDLEdBQUcsdUJBQXVCLEVBQUUsQ0FBQztJQUVsRSxtRkFBbUY7SUFDbkYsb0ZBQW9GO0lBQ3BGLDhDQUE4QztJQUM5QyxJQUFJLDZCQUE2QixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUMvQyxPQUFPLDZCQUE2QixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUUsQ0FBQztLQUNyRDtJQUVELGlGQUFpRjtJQUNqRix3RUFBd0U7SUFDeEUsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBRSxDQUFDO0lBRTdGLGlFQUFpRTtJQUNqRSwrRkFBK0Y7SUFDL0Ysc0NBQXNDO0lBQ3RDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtRQUN2QixPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsT0FBTyxVQUFVLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQztBQUN6QyxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyx3QkFBd0IsQ0FBQyxRQUFzQjtJQUN0RCxNQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNsRCxNQUFNLEVBQUMsbUJBQW1CLEVBQUMsR0FBRyx1QkFBdUIsRUFBRSxDQUFDO0lBQ3hELE9BQU8sbUJBQW1CLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNuRCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxTQUFTLHNCQUFzQixDQUFDLHdCQUF1QztJQUVyRSxNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsRUFBNEQsQ0FBQztJQUMzRixNQUFNLGlCQUFpQixHQUFHLElBQUksR0FBRyxFQUFpQixDQUFDO0lBQ25ELE1BQU0sT0FBTyxHQUFHLHFDQUFxQyxDQUFDLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBRXpGLGdCQUFnQixDQUFDLHdCQUF3QixFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBRW5FLE9BQU8sY0FBYyxDQUFDO0FBQ3hCLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTJGRztBQUNILFNBQVMscUNBQXFDLENBQzFDLGNBQTZFLEVBQzdFLGlCQUFxQztJQUV2QyxPQUFPLENBQUMsUUFBd0IsRUFBRSxTQUE4QyxFQUFFLEVBQUU7UUFDbEYsNERBQTREO1FBQzVELDZGQUE2RjtRQUM3RixZQUFZO1FBQ1osSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDakMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1NBQzNDO1FBRUQsMEVBQTBFO1FBQzFFLDJFQUEyRTtRQUMzRSw0RUFBNEU7UUFDNUUsd0JBQXdCO1FBQ3hCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDckMsbURBQW1EO1lBQ25ELEtBQUssTUFBTSxJQUFJLElBQUksY0FBYyxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUN4QyxNQUFNLGtCQUFrQixHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFFLENBQUM7Z0JBRXJELElBQUksWUFBWSxHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLFlBQVksRUFBRTtvQkFDakIsTUFBTSxRQUFRLEdBQ1QsU0FBaUIsQ0FBQyxRQUFvQyxDQUFDO29CQUM1RCxZQUFZLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUN6QztnQkFFRCxJQUFJLENBQUMsWUFBWSxFQUFFO29CQUNqQixPQUFPO2lCQUNSO2dCQUVELE1BQU0sd0JBQXdCLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXZELElBQUksZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO2dCQUM3QixXQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDLFlBQVksRUFBRSxFQUFFO29CQUNqRCxJQUFJLGdCQUFnQixFQUFFO3dCQUNwQixPQUFPO3FCQUNSO29CQUVELGdCQUFnQixHQUFJLFlBQW9CLENBQUMsUUFBUSxLQUFLLHdCQUF3Qjt3QkFDMUUsWUFBWSxLQUFLLHdCQUF3QixDQUFDO29CQUU5QyxJQUFJLGdCQUFnQixFQUFFO3dCQUNwQixjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztxQkFDOUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7YUFDSjtTQUNGO1FBRUQsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQVMsK0JBQStCLENBQUMsUUFBNkI7SUFDcEUsTUFBTSx3QkFBd0IsR0FBRywyQkFBMkIsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2RSxJQUFJLHdCQUF3QixLQUFLLElBQUksRUFBRTtRQUNyQyxVQUFVLENBQUMsK0RBQStELENBQUMsQ0FBQztLQUM3RTtJQUVELE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDeEUsTUFBTSxlQUFlLEdBQUcsdUJBQXVCLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO0lBRTFGLE9BQU8sZUFBZSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsRUFBRTtRQUMxQyxJQUFJLFVBQVUsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFFM0YsTUFBTSxHQUFHLEdBQUcsZUFBZSxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDdEQsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQztRQUNoRCw4REFBOEQ7UUFDOUQsaUZBQWlGO1FBQ2pGLElBQUkscUJBQXFCLEVBQUU7WUFDekIsVUFBVSxHQUFHLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUMvRjtRQUVELE9BQU8sRUFBQyxHQUFHLGNBQWMsRUFBRSxVQUFVLEVBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxRQUFrQjtJQUNyRCxJQUFJLFFBQVEsWUFBWSxZQUFZLEVBQUU7UUFDcEMsT0FBTyx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUMzQztTQUFNLElBQUksUUFBUSxZQUFZLG1CQUFtQixFQUFFO1FBQ2xELE9BQU8sK0JBQStCLENBQUMsUUFBK0IsQ0FBQyxDQUFDO0tBQ3pFO0lBRUQsVUFBVSxDQUFDLHlFQUF5RSxDQUFDLENBQUM7QUFDeEYsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUFDLFFBQWtCO0lBRXBELElBQUksUUFBUSxZQUFZLFlBQVksRUFBRTtRQUNwQyxNQUFNLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM3QyxNQUFNLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUUsQ0FBQztRQUM5QyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFbEMsT0FBTyxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQWEsRUFBQyxDQUFDO0tBQzlFO0lBRUQsSUFBSSxRQUFRLFlBQVksVUFBVSxFQUFFO1FBQ2xDLE9BQU8sRUFBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxJQUFJLElBQUksRUFBQyxDQUFDO0tBQy9EO0lBRUQsSUFBSSxRQUFRLFlBQVksWUFBWSxFQUFFO1FBQ3BDLE9BQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUMsQ0FBQztLQUNyQztJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxRQUFrQjtJQUMxRCxNQUFNLGNBQWMsR0FBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzlDLCtCQUErQixDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUMxRCxPQUFPLGNBQWMsQ0FBQztBQUN4QixDQUFDO0FBRUQsU0FBUywrQkFBK0IsQ0FDcEMsUUFBa0IsRUFBRSxjQUEwQjtJQUNoRCxNQUFNLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUUzQyw4RUFBOEU7SUFDOUUsd0VBQXdFO0lBQ3hFLHFGQUFxRjtJQUNyRixJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7UUFDbkIsSUFBSSxRQUFRLFlBQVksWUFBWSxFQUFFO1lBQ3BDLE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxJQUFJLGFBQWEsWUFBWSxZQUFZLEVBQUU7Z0JBQ3pDLE1BQU0sY0FBYyxHQUFHLCtCQUErQixDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUN0RSxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7b0JBQzNCLFVBQVUsQ0FBQyxvRUFBb0UsQ0FBQyxDQUFDO2lCQUNsRjtnQkFFRCxjQUFjLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNwQywrQkFBK0IsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7YUFDakU7WUFFRCxPQUFPLGNBQWMsQ0FBQztTQUN2QjtLQUNGO1NBQU07UUFDTCxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLCtCQUErQixDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQztLQUN6RDtJQUVELE9BQU8sY0FBYyxDQUFDO0FBQ3hCLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFDRztBQUNILFNBQVMsaUJBQWlCLENBQUMsUUFBa0I7SUFDM0MsSUFBSSxRQUFRLFlBQVksVUFBVSxFQUFFO1FBQ2xDLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQztLQUN4QjtJQUVELElBQUksS0FBNkQsQ0FBQztJQUNsRSxJQUFJLEtBQXFCLENBQUM7SUFDMUIsSUFBSSxRQUFRLFlBQVksWUFBWSxFQUFFO1FBQ3BDLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2QyxLQUFLLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDeEM7U0FBTSxJQUFJLFFBQVEsWUFBWSxZQUFZLEVBQUU7UUFDM0MsT0FBTyxJQUFJLENBQUM7S0FDYjtTQUFNO1FBQ0wsVUFBVSxDQUNOLHlGQUF5RixDQUFDLENBQUM7S0FDaEc7SUFFRCxNQUFNLGNBQWMsR0FBRyx5QkFBeUIsQ0FDNUMsS0FBOEQsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUUzRSxJQUFJLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxFQUFFO1FBQ3JDLE1BQU0sbUJBQW1CLEdBQUcsc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDbkUsTUFBTSxXQUFXLEdBQUcscUJBQXFCLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QyxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLG1CQUFtQixtQ0FBMkIsQ0FBVSxDQUFDO1FBQzlGLE9BQU8sSUFBSSxZQUFZLENBQ25CLFdBQW9FLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDeEY7U0FBTTtRQUNMLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQW9CLENBQUM7UUFFM0QsK0ZBQStGO1FBQy9GLHFCQUFxQjtRQUNyQix3RUFBd0U7UUFDeEUsaUZBQWlGO1FBQ2pGLGlEQUFpRDtRQUNqRCxvRUFBb0U7UUFDcEUsTUFBTSxjQUFjLEdBQUksZUFBZSxDQUFDLFFBQWdCLEVBQUUsTUFBa0IsQ0FBQztRQUU3RSxJQUFJLGNBQWMsWUFBWSxZQUFZLEVBQUU7WUFDMUMsT0FBTyxjQUFjLENBQUM7U0FDdkI7S0FDRjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBUywrQkFBK0IsQ0FBQyxRQUFzQjtJQUM3RCxJQUFJLEtBQXFCLENBQUM7SUFDMUIsSUFBSSxRQUFRLFlBQVksWUFBWSxFQUFFO1FBQ3BDLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUN4QztTQUFNO1FBQ0wsVUFBVSxDQUFDLG9FQUFvRSxDQUFDLENBQUM7S0FDbEY7SUFFRCxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFvQixDQUFDO0lBQzNELE1BQU0sY0FBYyxHQUFHLGVBQWUsQ0FBQyxjQUFjLENBQUM7SUFDdEQsSUFBSSxDQUFDLGNBQWMsRUFBRTtRQUNuQixVQUFVLENBQUMsb0VBQW9FLENBQUMsQ0FBQztLQUNsRjtJQUVELE9BQU8sY0FBYyxDQUFDO0FBQ3hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Z2V0SW5qZWN0b3JEZWYsIEluamVjdG9yVHlwZX0gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtJbmplY3RGbGFncywgSW50ZXJuYWxJbmplY3RGbGFnc30gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7TnVsbEluamVjdG9yfSBmcm9tICcuLi8uLi9kaS9udWxsX2luamVjdG9yJztcbmltcG9ydCB7U2luZ2xlUHJvdmlkZXIsIHdhbGtQcm92aWRlclRyZWV9IGZyb20gJy4uLy4uL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtFbnZpcm9ubWVudEluamVjdG9yLCBSM0luamVjdG9yfSBmcm9tICcuLi8uLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7ZGVlcEZvckVhY2h9IGZyb20gJy4uLy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCB0aHJvd0Vycm9yfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQgdHlwZSB7Q2hhaW5lZEluamVjdG9yfSBmcm9tICcuLi9jb21wb25lbnRfcmVmJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7Z2V0Tm9kZUluamVjdG9yTFZpZXcsIGdldE5vZGVJbmplY3RvclROb2RlLCBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uLCBOb2RlSW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7Z2V0RnJhbWV3b3JrRElEZWJ1Z0RhdGF9IGZyb20gJy4uL2RlYnVnL2ZyYW1ld29ya19pbmplY3Rvcl9wcm9maWxlcic7XG5pbXBvcnQge0luamVjdGVkU2VydmljZSwgUHJvdmlkZXJSZWNvcmR9IGZyb20gJy4uL2RlYnVnL2luamVjdG9yX3Byb2ZpbGVyJztcbmltcG9ydCB7Tm9kZUluamVjdG9yT2Zmc2V0fSBmcm9tICcuLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7SU5KRUNUT1IsIExWaWV3LCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcblxuaW1wb3J0IHtnZXRQYXJlbnRJbmplY3RvckluZGV4LCBnZXRQYXJlbnRJbmplY3RvclZpZXcsIGhhc1BhcmVudEluamVjdG9yfSBmcm9tICcuL2luamVjdG9yX3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0VE5vZGVGb3JMVmlldywgYXNzZXJ0VE5vZGV9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGV9IGZyb20gJy4vdmlld191dGlscyc7XG5cbi8qKlxuICogRGlzY292ZXJzIHRoZSBkZXBlbmRlbmNpZXMgb2YgYW4gaW5qZWN0YWJsZSBpbnN0YW5jZS4gUHJvdmlkZXMgREkgaW5mb3JtYXRpb24gYWJvdXQgZWFjaFxuICogZGVwZW5kZW5jeSB0aGF0IHRoZSBpbmplY3RhYmxlIHdhcyBpbnN0YW50aWF0ZWQgd2l0aCwgaW5jbHVkaW5nIHdoZXJlIHRoZXkgd2VyZSBwcm92aWRlZCBmcm9tLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBBbiBpbmplY3RvciBpbnN0YW5jZVxuICogQHBhcmFtIHRva2VuIGEgREkgdG9rZW4gdGhhdCB3YXMgY29uc3RydWN0ZWQgYnkgdGhlIGdpdmVuIGluamVjdG9yIGluc3RhbmNlXG4gKiBAcmV0dXJucyBhbiBvYmplY3QgdGhhdCBjb250YWlucyB0aGUgY3JlYXRlZCBpbnN0YW5jZSBvZiB0b2tlbiBhcyB3ZWxsIGFzIGFsbCBvZiB0aGUgZGVwZW5kZW5jaWVzXG4gKiB0aGF0IGl0IHdhcyBpbnN0YW50aWF0ZWQgd2l0aCBPUiB1bmRlZmluZWQgaWYgdGhlIHRva2VuIHdhcyBub3QgY3JlYXRlZCB3aXRoaW4gdGhlIGdpdmVuXG4gKiBpbmplY3Rvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlcGVuZGVuY2llc0Zyb21JbmplY3RhYmxlPFQ+KFxuICAgIGluamVjdG9yOiBJbmplY3RvciwgdG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4pOlxuICAgIHtpbnN0YW5jZTogVDsgZGVwZW5kZW5jaWVzOiBPbWl0PEluamVjdGVkU2VydmljZSwgJ2luamVjdGVkSW4nPltdfXx1bmRlZmluZWQge1xuICAvLyBGaXJzdCB3ZSBjaGVjayB0byBzZWUgaWYgdGhlIHRva2VuIGdpdmVuIG1hcHMgdG8gYW4gYWN0dWFsIGluc3RhbmNlIGluIHRoZSBpbmplY3RvciBnaXZlbi5cbiAgLy8gV2UgdXNlIGBzZWxmOiB0cnVlYCBiZWNhdXNlIHdlIG9ubHkgd2FudCB0byBsb29rIGF0IHRoZSBpbmplY3RvciB3ZSB3ZXJlIGdpdmVuLlxuICAvLyBXZSB1c2UgYG9wdGlvbmFsOiB0cnVlYCBiZWNhdXNlIGl0J3MgcG9zc2libGUgdGhhdCB0aGUgdG9rZW4gd2Ugd2VyZSBnaXZlbiB3YXMgbmV2ZXJcbiAgLy8gY29uc3RydWN0ZWQgYnkgdGhlIGluamVjdG9yIHdlIHdlcmUgZ2l2ZW4uXG4gIGNvbnN0IGluc3RhbmNlID0gaW5qZWN0b3IuZ2V0KHRva2VuLCBudWxsLCB7c2VsZjogdHJ1ZSwgb3B0aW9uYWw6IHRydWV9KTtcbiAgaWYgKGluc3RhbmNlID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZGV0ZXJtaW5lIGluc3RhbmNlIG9mICR7dG9rZW59IGluIGdpdmVuIGluamVjdG9yYCk7XG4gIH1cblxuICBjb25zdCB1bmZvcm1hdHRlZERlcGVuZGVuY2llcyA9IGdldERlcGVuZGVuY2llc0ZvclRva2VuSW5JbmplY3Rvcih0b2tlbiwgaW5qZWN0b3IpO1xuICBjb25zdCByZXNvbHV0aW9uUGF0aCA9IGdldEluamVjdG9yUmVzb2x1dGlvblBhdGgoaW5qZWN0b3IpO1xuXG4gIGNvbnN0IGRlcGVuZGVuY2llcyA9IHVuZm9ybWF0dGVkRGVwZW5kZW5jaWVzLm1hcChkZXAgPT4ge1xuICAgIC8vIGNvbnZlcnQgaW5qZWN0aW9uIGZsYWdzIHRvIGJvb2xlYW5zXG4gICAgY29uc3QgZmxhZ3MgPSBkZXAuZmxhZ3MgYXMgSW50ZXJuYWxJbmplY3RGbGFncztcbiAgICBkZXAuZmxhZ3MgPSB7XG4gICAgICBvcHRpb25hbDogKEludGVybmFsSW5qZWN0RmxhZ3MuT3B0aW9uYWwgJiBmbGFncykgPT09IEludGVybmFsSW5qZWN0RmxhZ3MuT3B0aW9uYWwsXG4gICAgICBob3N0OiAoSW50ZXJuYWxJbmplY3RGbGFncy5Ib3N0ICYgZmxhZ3MpID09PSBJbnRlcm5hbEluamVjdEZsYWdzLkhvc3QsXG4gICAgICBzZWxmOiAoSW50ZXJuYWxJbmplY3RGbGFncy5TZWxmICYgZmxhZ3MpID09PSBJbnRlcm5hbEluamVjdEZsYWdzLlNlbGYsXG4gICAgICBza2lwU2VsZjogKEludGVybmFsSW5qZWN0RmxhZ3MuU2tpcFNlbGYgJiBmbGFncykgPT09IEludGVybmFsSW5qZWN0RmxhZ3MuU2tpcFNlbGYsXG4gICAgfTtcblxuICAgIC8vIGZpbmQgdGhlIGluamVjdG9yIHRoYXQgcHJvdmlkZWQgdGhlIGRlcGVuZGVuY3lcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc29sdXRpb25QYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpbmplY3RvclRvQ2hlY2sgPSByZXNvbHV0aW9uUGF0aFtpXTtcblxuICAgICAgLy8gaWYgc2tpcFNlbGYgaXMgdHJ1ZSB3ZSBza2lwIHRoZSBmaXJzdCBpbmplY3RvclxuICAgICAgaWYgKGkgPT09IDAgJiYgZGVwLmZsYWdzLnNraXBTZWxmKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBob3N0IG9ubHkgYXBwbGllcyB0byBOb2RlSW5qZWN0b3JzXG4gICAgICBpZiAoZGVwLmZsYWdzLmhvc3QgJiYgaW5qZWN0b3JUb0NoZWNrIGluc3RhbmNlb2YgRW52aXJvbm1lbnRJbmplY3Rvcikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY29uc3QgaW5zdGFuY2UgPVxuICAgICAgICAgIGluamVjdG9yVG9DaGVjay5nZXQoZGVwLnRva2VuIGFzIFR5cGU8dW5rbm93bj4sIG51bGwsIHtzZWxmOiB0cnVlLCBvcHRpb25hbDogdHJ1ZX0pO1xuXG4gICAgICBpZiAoaW5zdGFuY2UgIT09IG51bGwpIHtcbiAgICAgICAgLy8gaWYgaG9zdCBmbGFnIGlzIHRydWUgd2UgZG91YmxlIGNoZWNrIHRoYXQgd2UgY2FuIGdldCB0aGUgc2VydmljZSBmcm9tIHRoZSBmaXJzdCBlbGVtZW50XG4gICAgICAgIC8vIGluIHRoZSByZXNvbHV0aW9uIHBhdGggYnkgdXNpbmcgdGhlIGhvc3QgZmxhZy4gVGhpcyBpcyBkb25lIHRvIG1ha2Ugc3VyZSB0aGF0IHdlJ3ZlIGZvdW5kXG4gICAgICAgIC8vIHRoZSBjb3JyZWN0IHByb3ZpZGluZyBpbmplY3RvciwgYW5kIG5vdCBhIG5vZGUgaW5qZWN0b3IgdGhhdCBpcyBjb25uZWN0ZWQgdG8gb3VyIHBhdGggdmlhXG4gICAgICAgIC8vIGEgcm91dGVyIG91dGxldC5cbiAgICAgICAgaWYgKGRlcC5mbGFncy5ob3N0KSB7XG4gICAgICAgICAgY29uc3QgZmlyc3RJbmplY3RvciA9IHJlc29sdXRpb25QYXRoWzBdO1xuICAgICAgICAgIGNvbnN0IGxvb2t1cEZyb21GaXJzdEluamVjdG9yID1cbiAgICAgICAgICAgICAgZmlyc3RJbmplY3Rvci5nZXQoZGVwLnRva2VuIGFzIFR5cGU8dW5rbm93bj4sIG51bGwsIHsuLi5kZXAuZmxhZ3MsIG9wdGlvbmFsOiB0cnVlfSk7XG5cbiAgICAgICAgICBpZiAobG9va3VwRnJvbUZpcnN0SW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGRlcC5wcm92aWRlZEluID0gaW5qZWN0b3JUb0NoZWNrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVwLnByb3ZpZGVkSW4gPSBpbmplY3RvclRvQ2hlY2s7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiBzZWxmIGlzIHRydWUgd2Ugc3RvcCBhZnRlciB0aGUgZmlyc3QgaW5qZWN0b3JcbiAgICAgIGlmIChpID09PSAwICYmIGRlcC5mbGFncy5zZWxmKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGluamVjdGVkSW4gY29udGFpbnMgcHJpdmF0ZSBmaWVsZHMsIHNvIHdlIG9taXQgaXQgZnJvbSB0aGUgcmVzcG9uc2VcbiAgICBjb25zdCBmb3JtYXR0ZWREZXBlbmRlbmN5OiBPbWl0PEluamVjdGVkU2VydmljZSwgJ2luamVjdGVkSW4nPiA9IHtcbiAgICAgIHZhbHVlOiBkZXAudmFsdWUsXG4gICAgfTtcblxuICAgIGlmIChkZXAudG9rZW4pIGZvcm1hdHRlZERlcGVuZGVuY3kudG9rZW4gPSBkZXAudG9rZW47XG4gICAgaWYgKGRlcC5mbGFncykgZm9ybWF0dGVkRGVwZW5kZW5jeS5mbGFncyA9IGRlcC5mbGFncztcbiAgICBpZiAoZGVwLnByb3ZpZGVkSW4pIGZvcm1hdHRlZERlcGVuZGVuY3kucHJvdmlkZWRJbiA9IGRlcC5wcm92aWRlZEluO1xuXG4gICAgcmV0dXJuIGZvcm1hdHRlZERlcGVuZGVuY3k7XG4gIH0pO1xuXG4gIHJldHVybiB7aW5zdGFuY2UsIGRlcGVuZGVuY2llc307XG59XG5cbmZ1bmN0aW9uIGdldERlcGVuZGVuY2llc0ZvclRva2VuSW5JbmplY3RvcjxUPihcbiAgICB0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgaW5qZWN0b3I6IEluamVjdG9yKTogSW5qZWN0ZWRTZXJ2aWNlW10ge1xuICBjb25zdCB7cmVzb2x2ZXJUb1Rva2VuVG9EZXBlbmRlbmNpZXN9ID0gZ2V0RnJhbWV3b3JrRElEZWJ1Z0RhdGEoKTtcblxuICBpZiAoIShpbmplY3RvciBpbnN0YW5jZW9mIE5vZGVJbmplY3RvcikpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXJUb1Rva2VuVG9EZXBlbmRlbmNpZXMuZ2V0KGluamVjdG9yKT8uZ2V0Py4odG9rZW4gYXMgVHlwZTxUPikgPz8gW107XG4gIH1cblxuICBjb25zdCBsVmlldyA9IGdldE5vZGVJbmplY3RvckxWaWV3KGluamVjdG9yKTtcbiAgY29uc3QgdG9rZW5EZXBlbmRlbmN5TWFwID0gcmVzb2x2ZXJUb1Rva2VuVG9EZXBlbmRlbmNpZXMuZ2V0KGxWaWV3KTtcbiAgY29uc3QgZGVwZW5kZW5jaWVzID0gdG9rZW5EZXBlbmRlbmN5TWFwPy5nZXQodG9rZW4gYXMgVHlwZTxUPikgPz8gW107XG5cbiAgLy8gSW4gdGhlIE5vZGVJbmplY3RvciBjYXNlLCBhbGwgaW5qZWN0aW9ucyBmb3IgZXZlcnkgbm9kZSBhcmUgc3RvcmVkIGluIHRoZSBzYW1lIGxWaWV3LlxuICAvLyBXZSB1c2UgdGhlIGluamVjdGVkSW4gZmllbGQgb2YgdGhlIGRlcGVuZGVuY3kgdG8gZmlsdGVyIG91dCB0aGUgZGVwZW5kZW5jaWVzIHRoYXRcbiAgLy8gZG8gbm90IGNvbWUgZnJvbSB0aGUgc2FtZSBub2RlIGFzIHRoZSBpbnN0YW5jZSB3ZSdyZSBsb29raW5nIGF0LlxuICByZXR1cm4gZGVwZW5kZW5jaWVzLmZpbHRlcihkZXBlbmRlbmN5ID0+IHtcbiAgICBjb25zdCBkZXBlbmRlbmN5Tm9kZSA9IGRlcGVuZGVuY3kuaW5qZWN0ZWRJbj8udE5vZGU7XG4gICAgaWYgKGRlcGVuZGVuY3lOb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBpbnN0YW5jZU5vZGUgPSBnZXROb2RlSW5qZWN0b3JUTm9kZShpbmplY3Rvcik7XG4gICAgYXNzZXJ0VE5vZGUoZGVwZW5kZW5jeU5vZGUpO1xuICAgIGFzc2VydFROb2RlKGluc3RhbmNlTm9kZSEpO1xuXG4gICAgcmV0dXJuIGRlcGVuZGVuY3lOb2RlID09PSBpbnN0YW5jZU5vZGU7XG4gIH0pO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGNsYXNzIGFzc29jaWF0ZWQgd2l0aCBhbiBpbmplY3RvciB0aGF0IGNvbnRhaW5zIGEgcHJvdmlkZXIgYGltcG9ydHNgIGFycmF5IGluIGl0J3NcbiAqIGRlZmluaXRpb25cbiAqXG4gKiBGb3IgTW9kdWxlIEluamVjdG9ycyB0aGlzIHJldHVybnMgdGhlIE5nTW9kdWxlIGNvbnN0cnVjdG9yLlxuICpcbiAqIEZvciBTdGFuZGFsb25lIGluamVjdG9ycyB0aGlzIHJldHVybnMgdGhlIHN0YW5kYWxvbmUgY29tcG9uZW50IGNvbnN0cnVjdG9yLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBJbmplY3RvciBhbiBpbmplY3RvciBpbnN0YW5jZVxuICogQHJldHVybnMgdGhlIGNvbnN0cnVjdG9yIHdoZXJlIHRoZSBgaW1wb3J0c2AgYXJyYXkgdGhhdCBjb25maWd1cmVzIHRoaXMgaW5qZWN0b3IgaXMgbG9jYXRlZFxuICovXG5mdW5jdGlvbiBnZXRQcm92aWRlckltcG9ydHNDb250YWluZXIoaW5qZWN0b3I6IEluamVjdG9yKTogVHlwZTx1bmtub3duPnxudWxsIHtcbiAgY29uc3Qge3N0YW5kYWxvbmVJbmplY3RvclRvQ29tcG9uZW50fSA9IGdldEZyYW1ld29ya0RJRGVidWdEYXRhKCk7XG5cbiAgLy8gc3RhbmRhbG9uZSBjb21wb25lbnRzIGNvbmZpZ3VyZSBwcm92aWRlcnMgdGhyb3VnaCBhIGNvbXBvbmVudCBkZWYsIHNvIHdlIGhhdmUgdG9cbiAgLy8gdXNlIHRoZSBzdGFuZGFsb25lIGNvbXBvbmVudCBhc3NvY2lhdGVkIHdpdGggdGhpcyBpbmplY3RvciBpZiBJbmplY3RvciByZXByZXNlbnRzXG4gIC8vIGEgc3RhbmRhbG9uZSBjb21wb25lbnRzIEVudmlyb25tZW50SW5qZWN0b3JcbiAgaWYgKHN0YW5kYWxvbmVJbmplY3RvclRvQ29tcG9uZW50LmhhcyhpbmplY3RvcikpIHtcbiAgICByZXR1cm4gc3RhbmRhbG9uZUluamVjdG9yVG9Db21wb25lbnQuZ2V0KGluamVjdG9yKSE7XG4gIH1cblxuICAvLyBNb2R1bGUgaW5qZWN0b3JzIGNvbmZpZ3VyZSBwcm92aWRlcnMgdGhyb3VnaCB0aGVpciBOZ01vZHVsZSBkZWYsIHNvIHdlIHVzZSB0aGVcbiAgLy8gaW5qZWN0b3IgdG8gbG9va3VwIGl0cyBOZ01vZHVsZVJlZiBhbmQgdGhyb3VnaCB0aGF0IGdyYWIgaXRzIGluc3RhbmNlXG4gIGNvbnN0IGRlZlR5cGVSZWYgPSBpbmplY3Rvci5nZXQodmlld0VuZ2luZV9OZ01vZHVsZVJlZiwgbnVsbCwge3NlbGY6IHRydWUsIG9wdGlvbmFsOiB0cnVlfSkhO1xuXG4gIC8vIElmIHdlIGNhbid0IGZpbmQgYW4gYXNzb2NpYXRlZCBpbXBvcnRzIGNvbnRhaW5lciwgcmV0dXJuIG51bGwuXG4gIC8vIFRoaXMgY291bGQgYmUgdGhlIGNhc2UgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBhbiBSM0luamVjdG9yIHRoYXQgZG9lcyBub3QgcmVwcmVzZW50XG4gIC8vIGEgc3RhbmRhbG9uZSBjb21wb25lbnQgb3IgTmdNb2R1bGUuXG4gIGlmIChkZWZUeXBlUmVmID09PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gZGVmVHlwZVJlZi5pbnN0YW5jZS5jb25zdHJ1Y3Rvcjtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBwcm92aWRlcnMgY29uZmlndXJlZCBvbiBhIE5vZGVJbmplY3RvclxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBBIE5vZGVJbmplY3RvciBpbnN0YW5jZVxuICogQHJldHVybnMgUHJvdmlkZXJSZWNvcmRbXSBhbiBhcnJheSBvZiBvYmplY3RzIHJlcHJlc2VudGluZyB0aGUgcHJvdmlkZXJzIGNvbmZpZ3VyZWQgb24gdGhpc1xuICogICAgIGluamVjdG9yXG4gKi9cbmZ1bmN0aW9uIGdldE5vZGVJbmplY3RvclByb3ZpZGVycyhpbmplY3RvcjogTm9kZUluamVjdG9yKTogUHJvdmlkZXJSZWNvcmRbXSB7XG4gIGNvbnN0IGRpUmVzb2x2ZXIgPSBnZXROb2RlSW5qZWN0b3JMVmlldyhpbmplY3Rvcik7XG4gIGNvbnN0IHtyZXNvbHZlclRvUHJvdmlkZXJzfSA9IGdldEZyYW1ld29ya0RJRGVidWdEYXRhKCk7XG4gIHJldHVybiByZXNvbHZlclRvUHJvdmlkZXJzLmdldChkaVJlc29sdmVyKSA/PyBbXTtcbn1cblxuLyoqXG4gKiBHZXRzIGEgbWFwcGluZyBvZiBwcm92aWRlcnMgY29uZmlndXJlZCBvbiBhbiBpbmplY3RvciB0byB0aGVpciBpbXBvcnQgcGF0aHNcbiAqXG4gKiBNb2R1bGVBIC0+IGltcG9ydHMgTW9kdWxlQlxuICogTW9kdWxlQiAtPiBpbXBvcnRzIE1vZHVsZUNcbiAqIE1vZHVsZUIgLT4gcHJvdmlkZXMgTXlTZXJ2aWNlQVxuICogTW9kdWxlQyAtPiBwcm92aWRlcyBNeVNlcnZpY2VCXG4gKlxuICogZ2V0UHJvdmlkZXJJbXBvcnRQYXRocyhNb2R1bGVBKVxuICogPiBNYXAoMikge1xuICogICBNeVNlcnZpY2VBID0+IFtNb2R1bGVBLCBNb2R1bGVCXVxuICogICBNeVNlcnZpY2VCID0+IFtNb2R1bGVBLCBNb2R1bGVCLCBNb2R1bGVDXVxuICogIH1cbiAqXG4gKiBAcGFyYW0gcHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyIGNvbnN0cnVjdG9yIG9mIGNsYXNzIHRoYXQgY29udGFpbnMgYW4gYGltcG9ydHNgIGFycmF5IGluIGl0J3NcbiAqICAgICBkZWZpbml0aW9uXG4gKiBAcmV0dXJucyBBIE1hcCBvYmplY3QgdGhhdCBtYXBzIHByb3ZpZGVycyB0byBhbiBhcnJheSBvZiBjb25zdHJ1Y3RvcnMgcmVwcmVzZW50aW5nIGl0J3MgaW1wb3J0XG4gKiAgICAgcGF0aFxuICpcbiAqL1xuZnVuY3Rpb24gZ2V0UHJvdmlkZXJJbXBvcnRQYXRocyhwcm92aWRlckltcG9ydHNDb250YWluZXI6IFR5cGU8dW5rbm93bj4pOlxuICAgIE1hcDxTaW5nbGVQcm92aWRlciwgKFR5cGU8dW5rbm93bj58IEluamVjdG9yVHlwZTx1bmtub3duPilbXT4ge1xuICBjb25zdCBwcm92aWRlclRvUGF0aCA9IG5ldyBNYXA8U2luZ2xlUHJvdmlkZXIsIChUeXBlPHVua25vd24+fCBJbmplY3RvclR5cGU8dW5rbm93bj4pW10+KCk7XG4gIGNvbnN0IHZpc2l0ZWRDb250YWluZXJzID0gbmV3IFNldDxUeXBlPHVua25vd24+PigpO1xuICBjb25zdCB2aXNpdG9yID0gd2Fsa1Byb3ZpZGVyVHJlZVRvRGlzY292ZXJJbXBvcnRQYXRocyhwcm92aWRlclRvUGF0aCwgdmlzaXRlZENvbnRhaW5lcnMpO1xuXG4gIHdhbGtQcm92aWRlclRyZWUocHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyLCB2aXNpdG9yLCBbXSwgbmV3IFNldCgpKTtcblxuICByZXR1cm4gcHJvdmlkZXJUb1BhdGg7XG59XG5cbi8qKlxuICpcbiAqIEhpZ2hlciBvcmRlciBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSB2aXNpdG9yIGZvciBXYWxrUHJvdmlkZXJUcmVlXG4gKlxuICogVGFrZXMgaW4gYSBNYXAgYW5kIFNldCB0byBrZWVwIHRyYWNrIG9mIHRoZSBwcm92aWRlcnMgYW5kIGNvbnRhaW5lcnNcbiAqIHZpc2l0ZWQsIHNvIHRoYXQgd2UgY2FuIGRpc2NvdmVyIHRoZSBpbXBvcnQgcGF0aHMgb2YgdGhlc2UgcHJvdmlkZXJzXG4gKiBkdXJpbmcgdGhlIHRyYXZlcnNhbC5cbiAqXG4gKiBUaGlzIHZpc2l0b3IgdGFrZXMgYWR2YW50YWdlIG9mIHRoZSBmYWN0IHRoYXQgd2Fsa1Byb3ZpZGVyVHJlZSBwZXJmb3JtcyBhXG4gKiBwb3N0b3JkZXIgdHJhdmVyc2FsIG9mIHRoZSBwcm92aWRlciB0cmVlIGZvciB0aGUgcGFzc2VkIGluIGNvbnRhaW5lci4gQmVjYXVzZSBwb3N0b3JkZXJcbiAqIHRyYXZlcnNhbCByZWN1cnNpdmVseSBwcm9jZXNzZXMgc3VidHJlZXMgZnJvbSBsZWFmIG5vZGVzIHVudGlsIHRoZSB0cmF2ZXJzYWwgcmVhY2hlcyB0aGUgcm9vdCxcbiAqIHdlIHdyaXRlIGEgdmlzaXRvciB0aGF0IGNvbnN0cnVjdHMgcHJvdmlkZXIgaW1wb3J0IHBhdGhzIGluIHJldmVyc2UuXG4gKlxuICpcbiAqIFdlIHVzZSB0aGUgdmlzaXRlZENvbnRhaW5lcnMgc2V0IGRlZmluZWQgb3V0c2lkZSB0aGlzIHZpc2l0b3JcbiAqIGJlY2F1c2Ugd2Ugd2FudCB0byBydW4gc29tZSBsb2dpYyBvbmx5IG9uY2UgZm9yXG4gKiBlYWNoIGNvbnRhaW5lciBpbiB0aGUgdHJlZS4gVGhhdCBsb2dpYyBjYW4gYmUgZGVzY3JpYmVkIGFzOlxuICpcbiAqXG4gKiAxLiBmb3IgZWFjaCBkaXNjb3ZlcmVkX3Byb3ZpZGVyIGFuZCBkaXNjb3ZlcmVkX3BhdGggaW4gdGhlIGluY29tcGxldGUgcHJvdmlkZXIgcGF0aHMgd2UndmVcbiAqIGFscmVhZHkgZGlzY292ZXJlZFxuICogMi4gZ2V0IHRoZSBmaXJzdCBjb250YWluZXIgaW4gZGlzY292ZXJlZF9wYXRoXG4gKiAzLiBpZiB0aGF0IGZpcnN0IGNvbnRhaW5lciBpcyBpbiB0aGUgaW1wb3J0cyBhcnJheSBvZiB0aGUgY29udGFpbmVyIHdlJ3JlIHZpc2l0aW5nXG4gKiAgICBUaGVuIHRoZSBjb250YWluZXIgd2UncmUgdmlzaXRpbmcgaXMgYWxzbyBpbiB0aGUgaW1wb3J0IHBhdGggb2YgZGlzY292ZXJlZF9wcm92aWRlciwgc28gd2VcbiAqICAgIHVuc2hpZnQgZGlzY292ZXJlZF9wYXRoIHdpdGggdGhlIGNvbnRhaW5lciB3ZSdyZSBjdXJyZW50bHkgdmlzaXRpbmdcbiAqXG4gKlxuICogRXhhbXBsZSBSdW46XG4gKiBgYGBcbiAqICAgICAgICAgICAgICAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJBcbiAqICAgICAgICAgICAgICAgICDilIJjb250YWluZXJB4pSCXG4gKiAgICAgIOKUjOKUgGltcG9ydHMt4pSA4pSkICAgICAgICAgIOKUnOKUgOKUgGltcG9ydHPilIDilJBcbiAqICAgICAg4pSCICAgICAgICAgIOKUgiAgcHJvdkEgICDilIIgICAgICAgICAg4pSCXG4gKiAgICAgIOKUgiAgICAgICAgICDilIIgIHByb3ZCICAg4pSCICAgICAgICAgIOKUglxuICogICAgICDilIIgICAgICAgICAg4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYICAgICAgICAgIOKUglxuICogICAgICDilIIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUglxuICogICAgIOKUjOKWvOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCAgICAgICAgICAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilrzilIDilJBcbiAqICAgICDilIJjb250YWluZXJC4pSCICAgICAgICAgICAgIOKUgmNvbnRhaW5lckPilIJcbiAqICAgICDilIIgICAgICAgICAg4pSCICAgICAgICAgICAgIOKUgiAgICAgICAgICDilIJcbiAqICAgICDilIIgIHByb3ZEICAg4pSCICAgICAgICAgICAgIOKUgiAgcHJvdkYgICDilIJcbiAqICAgICDilIIgIHByb3ZFICAg4pSCICAgICAgICAgICAgIOKUgiAgcHJvdkcgICDilIJcbiAqICAgICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJggICAgICAgICAgICAg4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYXG4gKiBgYGBcbiAqXG4gKiBFYWNoIHN0ZXAgb2YgdGhlIHRyYXZlcnNhbCxcbiAqXG4gKiBgYGBcbiAqIHZpc2l0b3IocHJvdkQsIGNvbnRhaW5lckIpXG4gKiBwcm92aWRlclRvUGF0aCA9PT0gTWFwIHsgcHJvdkQgPT4gW2NvbnRhaW5lckJdIH1cbiAqIHZpc2l0ZWRDb250YWluZXJzID09PSBTZXQgeyBjb250YWluZXJCIH1cbiAqXG4gKiB2aXNpdG9yKHByb3ZFLCBjb250YWluZXJCKVxuICogcHJvdmlkZXJUb1BhdGggPT09IE1hcCB7IHByb3ZEID0+IFtjb250YWluZXJCXSwgcHJvdkUgPT4gW2NvbnRhaW5lckJdIH1cbiAqIHZpc2l0ZWRDb250YWluZXJzID09PSBTZXQgeyBjb250YWluZXJCIH1cbiAqXG4gKiB2aXNpdG9yKHByb3ZGLCBjb250YWluZXJDKVxuICogcHJvdmlkZXJUb1BhdGggPT09IE1hcCB7IHByb3ZEID0+IFtjb250YWluZXJCXSwgcHJvdkUgPT4gW2NvbnRhaW5lckJdLCBwcm92RiA9PiBbY29udGFpbmVyQ10gfVxuICogdmlzaXRlZENvbnRhaW5lcnMgPT09IFNldCB7IGNvbnRhaW5lckIsIGNvbnRhaW5lckMgfVxuICpcbiAqIHZpc2l0b3IocHJvdkcsIGNvbnRhaW5lckMpXG4gKiBwcm92aWRlclRvUGF0aCA9PT0gTWFwIHtcbiAqICAgcHJvdkQgPT4gW2NvbnRhaW5lckJdLCBwcm92RSA9PiBbY29udGFpbmVyQl0sIHByb3ZGID0+IFtjb250YWluZXJDXSwgcHJvdkcgPT4gW2NvbnRhaW5lckNdXG4gKiB9XG4gKiB2aXNpdGVkQ29udGFpbmVycyA9PT0gU2V0IHsgY29udGFpbmVyQiwgY29udGFpbmVyQyB9XG4gKlxuICogdmlzaXRvcihwcm92QSwgY29udGFpbmVyQSlcbiAqIHByb3ZpZGVyVG9QYXRoID09PSBNYXAge1xuICogICBwcm92RCA9PiBbY29udGFpbmVyQSwgY29udGFpbmVyQl0sXG4gKiAgIHByb3ZFID0+IFtjb250YWluZXJBLCBjb250YWluZXJCXSxcbiAqICAgcHJvdkYgPT4gW2NvbnRhaW5lckEsIGNvbnRhaW5lckNdLFxuICogICBwcm92RyA9PiBbY29udGFpbmVyQSwgY29udGFpbmVyQ10sXG4gKiAgIHByb3ZBID0+IFtjb250YWluZXJBXVxuICogfVxuICogdmlzaXRlZENvbnRhaW5lcnMgPT09IFNldCB7IGNvbnRhaW5lckIsIGNvbnRhaW5lckMsIGNvbnRhaW5lckEgfVxuICpcbiAqIHZpc2l0b3IocHJvdkIsIGNvbnRhaW5lckEpXG4gKiBwcm92aWRlclRvUGF0aCA9PT0gTWFwIHtcbiAqICAgcHJvdkQgPT4gW2NvbnRhaW5lckEsIGNvbnRhaW5lckJdLFxuICogICBwcm92RSA9PiBbY29udGFpbmVyQSwgY29udGFpbmVyQl0sXG4gKiAgIHByb3ZGID0+IFtjb250YWluZXJBLCBjb250YWluZXJDXSxcbiAqICAgcHJvdkcgPT4gW2NvbnRhaW5lckEsIGNvbnRhaW5lckNdLFxuICogICBwcm92QSA9PiBbY29udGFpbmVyQV1cbiAqICAgcHJvdkIgPT4gW2NvbnRhaW5lckFdXG4gKiB9XG4gKiB2aXNpdGVkQ29udGFpbmVycyA9PT0gU2V0IHsgY29udGFpbmVyQiwgY29udGFpbmVyQywgY29udGFpbmVyQSB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcHJvdmlkZXJUb1BhdGggTWFwIG1hcCBvZiBwcm92aWRlcnMgdG8gcGF0aHMgdGhhdCB0aGlzIGZ1bmN0aW9uIGZpbGxzXG4gKiBAcGFyYW0gdmlzaXRlZENvbnRhaW5lcnMgU2V0IGEgc2V0IHRvIGtlZXAgdHJhY2sgb2YgdGhlIGNvbnRhaW5lcnMgd2UndmUgYWxyZWFkeSB2aXNpdGVkXG4gKiBAcmV0dXJuIGZ1bmN0aW9uKHByb3ZpZGVyIFNpbmdsZVByb3ZpZGVyLCBjb250YWluZXI6IFR5cGU8dW5rbm93bj4gfCBJbmplY3RvclR5cGU8dW5rbm93bj4pID0+XG4gKiAgICAgdm9pZFxuICovXG5mdW5jdGlvbiB3YWxrUHJvdmlkZXJUcmVlVG9EaXNjb3ZlckltcG9ydFBhdGhzKFxuICAgIHByb3ZpZGVyVG9QYXRoOiBNYXA8U2luZ2xlUHJvdmlkZXIsIChUeXBlPHVua25vd24+fCBJbmplY3RvclR5cGU8dW5rbm93bj4pW10+LFxuICAgIHZpc2l0ZWRDb250YWluZXJzOiBTZXQ8VHlwZTx1bmtub3duPj4pOlxuICAgIChwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIsIGNvbnRhaW5lcjogVHlwZTx1bmtub3duPnxJbmplY3RvclR5cGU8dW5rbm93bj4pID0+IHZvaWQge1xuICByZXR1cm4gKHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgY29udGFpbmVyOiBUeXBlPHVua25vd24+fEluamVjdG9yVHlwZTx1bmtub3duPikgPT4ge1xuICAgIC8vIElmIHRoZSBwcm92aWRlciBpcyBub3QgYWxyZWFkeSBpbiB0aGUgcHJvdmlkZXJUb1BhdGggbWFwLFxuICAgIC8vIGFkZCBhbiBlbnRyeSB3aXRoIHRoZSBwcm92aWRlciBhcyB0aGUga2V5IGFuZCBhbiBhcnJheSBjb250YWluaW5nIHRoZSBjdXJyZW50IGNvbnRhaW5lciBhc1xuICAgIC8vIHRoZSB2YWx1ZVxuICAgIGlmICghcHJvdmlkZXJUb1BhdGguaGFzKHByb3ZpZGVyKSkge1xuICAgICAgcHJvdmlkZXJUb1BhdGguc2V0KHByb3ZpZGVyLCBbY29udGFpbmVyXSk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBibG9jayB3aWxsIHJ1biBleGFjdGx5IG9uY2UgZm9yIGVhY2ggY29udGFpbmVyIGluIHRoZSBpbXBvcnQgdHJlZS5cbiAgICAvLyBUaGlzIGlzIHdoZXJlIHdlIHJ1biB0aGUgbG9naWMgdG8gY2hlY2sgdGhlIGltcG9ydHMgYXJyYXkgb2YgdGhlIGN1cnJlbnRcbiAgICAvLyBjb250YWluZXIgdG8gc2VlIGlmIGl0J3MgdGhlIG5leHQgY29udGFpbmVyIGluIHRoZSBwYXRoIGZvciBvdXIgY3VycmVudGx5XG4gICAgLy8gZGlzY292ZXJlZCBwcm92aWRlcnMuXG4gICAgaWYgKCF2aXNpdGVkQ29udGFpbmVycy5oYXMoY29udGFpbmVyKSkge1xuICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBwcm92aWRlcnMgd2UndmUgYWxyZWFkeSBzZWVuXG4gICAgICBmb3IgKGNvbnN0IHByb3Ygb2YgcHJvdmlkZXJUb1BhdGgua2V5cygpKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nSW1wb3J0UGF0aCA9IHByb3ZpZGVyVG9QYXRoLmdldChwcm92KSE7XG5cbiAgICAgICAgbGV0IGNvbnRhaW5lckRlZiA9IGdldEluamVjdG9yRGVmKGNvbnRhaW5lcik7XG4gICAgICAgIGlmICghY29udGFpbmVyRGVmKSB7XG4gICAgICAgICAgY29uc3QgbmdNb2R1bGU6IFR5cGU8dW5rbm93bj58dW5kZWZpbmVkID1cbiAgICAgICAgICAgICAgKGNvbnRhaW5lciBhcyBhbnkpLm5nTW9kdWxlIGFzIFR5cGU8dW5rbm93bj58IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb250YWluZXJEZWYgPSBnZXRJbmplY3RvckRlZihuZ01vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNvbnRhaW5lckRlZikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxhc3RDb250YWluZXJBZGRlZFRvUGF0aCA9IGV4aXN0aW5nSW1wb3J0UGF0aFswXTtcblxuICAgICAgICBsZXQgaXNOZXh0U3RlcEluUGF0aCA9IGZhbHNlO1xuICAgICAgICBkZWVwRm9yRWFjaChjb250YWluZXJEZWYuaW1wb3J0cywgKG1vZHVsZUltcG9ydCkgPT4ge1xuICAgICAgICAgIGlmIChpc05leHRTdGVwSW5QYXRoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaXNOZXh0U3RlcEluUGF0aCA9IChtb2R1bGVJbXBvcnQgYXMgYW55KS5uZ01vZHVsZSA9PT0gbGFzdENvbnRhaW5lckFkZGVkVG9QYXRoIHx8XG4gICAgICAgICAgICAgIG1vZHVsZUltcG9ydCA9PT0gbGFzdENvbnRhaW5lckFkZGVkVG9QYXRoO1xuXG4gICAgICAgICAgaWYgKGlzTmV4dFN0ZXBJblBhdGgpIHtcbiAgICAgICAgICAgIHByb3ZpZGVyVG9QYXRoLmdldChwcm92KT8udW5zaGlmdChjb250YWluZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmlzaXRlZENvbnRhaW5lcnMuYWRkKGNvbnRhaW5lcik7XG4gIH07XG59XG5cbi8qKlxuICogR2V0cyB0aGUgcHJvdmlkZXJzIGNvbmZpZ3VyZWQgb24gYW4gRW52aXJvbm1lbnRJbmplY3RvclxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBFbnZpcm9ubWVudEluamVjdG9yXG4gKiBAcmV0dXJucyBhbiBhcnJheSBvZiBvYmplY3RzIHJlcHJlc2VudGluZyB0aGUgcHJvdmlkZXJzIG9mIHRoZSBnaXZlbiBpbmplY3RvclxuICovXG5mdW5jdGlvbiBnZXRFbnZpcm9ubWVudEluamVjdG9yUHJvdmlkZXJzKGluamVjdG9yOiBFbnZpcm9ubWVudEluamVjdG9yKTogUHJvdmlkZXJSZWNvcmRbXSB7XG4gIGNvbnN0IHByb3ZpZGVySW1wb3J0c0NvbnRhaW5lciA9IGdldFByb3ZpZGVySW1wb3J0c0NvbnRhaW5lcihpbmplY3Rvcik7XG4gIGlmIChwcm92aWRlckltcG9ydHNDb250YWluZXIgPT09IG51bGwpIHtcbiAgICB0aHJvd0Vycm9yKCdDb3VsZCBub3QgZGV0ZXJtaW5lIHdoZXJlIGluamVjdG9yIHByb3ZpZGVycyB3ZXJlIGNvbmZpZ3VyZWQuJyk7XG4gIH1cblxuICBjb25zdCBwcm92aWRlclRvUGF0aCA9IGdldFByb3ZpZGVySW1wb3J0UGF0aHMocHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyKTtcbiAgY29uc3QgcHJvdmlkZXJSZWNvcmRzID0gZ2V0RnJhbWV3b3JrRElEZWJ1Z0RhdGEoKS5yZXNvbHZlclRvUHJvdmlkZXJzLmdldChpbmplY3RvcikgPz8gW107XG5cbiAgcmV0dXJuIHByb3ZpZGVyUmVjb3Jkcy5tYXAocHJvdmlkZXJSZWNvcmQgPT4ge1xuICAgIGxldCBpbXBvcnRQYXRoID0gcHJvdmlkZXJUb1BhdGguZ2V0KHByb3ZpZGVyUmVjb3JkLnByb3ZpZGVyKSA/PyBbcHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyXTtcblxuICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZihwcm92aWRlckltcG9ydHNDb250YWluZXIpO1xuICAgIGNvbnN0IGlzU3RhbmRhbG9uZUNvbXBvbmVudCA9ICEhZGVmPy5zdGFuZGFsb25lO1xuICAgIC8vIFdlIHByZXBlbmQgdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvciBpbiB0aGUgc3RhbmRhbG9uZSBjYXNlXG4gICAgLy8gYmVjYXVzZSB3YWxrUHJvdmlkZXJUcmVlIGRvZXMgbm90IHZpc2l0IHRoaXMgY29uc3RydWN0b3IgZHVyaW5nIGl0J3MgdHJhdmVyc2FsXG4gICAgaWYgKGlzU3RhbmRhbG9uZUNvbXBvbmVudCkge1xuICAgICAgaW1wb3J0UGF0aCA9IFtwcm92aWRlckltcG9ydHNDb250YWluZXIsIC4uLnByb3ZpZGVyVG9QYXRoLmdldChwcm92aWRlclJlY29yZC5wcm92aWRlcikgPz8gW11dO1xuICAgIH1cblxuICAgIHJldHVybiB7Li4ucHJvdmlkZXJSZWNvcmQsIGltcG9ydFBhdGh9O1xuICB9KTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBwcm92aWRlcnMgY29uZmlndXJlZCBvbiBhbiBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgdGhlIGluamVjdG9yIHRvIGxvb2t1cCB0aGUgcHJvdmlkZXJzIG9mXG4gKiBAcmV0dXJucyBQcm92aWRlclJlY29yZFtdIGFuIGFycmF5IG9mIG9iamVjdHMgcmVwcmVzZW50aW5nIHRoZSBwcm92aWRlcnMgb2YgdGhlIGdpdmVuIGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3RvclByb3ZpZGVycyhpbmplY3RvcjogSW5qZWN0b3IpOiBQcm92aWRlclJlY29yZFtdIHtcbiAgaWYgKGluamVjdG9yIGluc3RhbmNlb2YgTm9kZUluamVjdG9yKSB7XG4gICAgcmV0dXJuIGdldE5vZGVJbmplY3RvclByb3ZpZGVycyhpbmplY3Rvcik7XG4gIH0gZWxzZSBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBFbnZpcm9ubWVudEluamVjdG9yKSB7XG4gICAgcmV0dXJuIGdldEVudmlyb25tZW50SW5qZWN0b3JQcm92aWRlcnMoaW5qZWN0b3IgYXMgRW52aXJvbm1lbnRJbmplY3Rvcik7XG4gIH1cblxuICB0aHJvd0Vycm9yKCdnZXRJbmplY3RvclByb3ZpZGVycyBvbmx5IHN1cHBvcnRzIE5vZGVJbmplY3RvciBhbmQgRW52aXJvbm1lbnRJbmplY3RvcicpO1xufVxuXG4vKipcbiAqXG4gKiBHaXZlbiBhbiBpbmplY3RvciwgdGhpcyBmdW5jdGlvbiB3aWxsIHJldHVyblxuICogYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHR5cGUgYW5kIHNvdXJjZSBvZiB0aGUgaW5qZWN0b3IuXG4gKlxuICogfCAgICAgICAgICAgICAgfCB0eXBlICAgICAgICB8IHNvdXJjZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqIHwtLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18XG4gKiB8IE5vZGVJbmplY3RvciB8IGVsZW1lbnQgICAgIHwgRE9NIGVsZW1lbnQgdGhhdCBjcmVhdGVkIHRoaXMgaW5qZWN0b3IgICAgICAgICAgICAgICAgICAgICAgfFxuICogfCBSM0luamVjdG9yICAgfCBlbnZpcm9ubWVudCB8IGBpbmplY3Rvci5zb3VyY2VgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqIHwgTnVsbEluamVjdG9yIHwgbnVsbCAgICAgICAgfCBudWxsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKlxuICogQHBhcmFtIGluamVjdG9yIHRoZSBJbmplY3RvciB0byBnZXQgbWV0YWRhdGEgZm9yXG4gKiBAcmV0dXJucyBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgdHlwZSBhbmQgc291cmNlIG9mIHRoZSBnaXZlbiBpbmplY3Rvci4gSWYgdGhlIGluamVjdG9yIG1ldGFkYXRhXG4gKiAgICAgY2Fubm90IGJlIGRldGVybWluZWQsIHJldHVybnMgbnVsbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluamVjdG9yTWV0YWRhdGEoaW5qZWN0b3I6IEluamVjdG9yKTpcbiAgICB7dHlwZTogc3RyaW5nOyBzb3VyY2U6IFJFbGVtZW50IHwgc3RyaW5nIHwgbnVsbH18bnVsbCB7XG4gIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIE5vZGVJbmplY3Rvcikge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0Tm9kZUluamVjdG9yTFZpZXcoaW5qZWN0b3IpO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0Tm9kZUluamVjdG9yVE5vZGUoaW5qZWN0b3IpITtcbiAgICBhc3NlcnRUTm9kZUZvckxWaWV3KHROb2RlLCBsVmlldyk7XG5cbiAgICByZXR1cm4ge3R5cGU6ICdlbGVtZW50Jywgc291cmNlOiBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnR9O1xuICB9XG5cbiAgaWYgKGluamVjdG9yIGluc3RhbmNlb2YgUjNJbmplY3Rvcikge1xuICAgIHJldHVybiB7dHlwZTogJ2Vudmlyb25tZW50Jywgc291cmNlOiBpbmplY3Rvci5zb3VyY2UgPz8gbnVsbH07XG4gIH1cblxuICBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBOdWxsSW5qZWN0b3IpIHtcbiAgICByZXR1cm4ge3R5cGU6ICdudWxsJywgc291cmNlOiBudWxsfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3JSZXNvbHV0aW9uUGF0aChpbmplY3RvcjogSW5qZWN0b3IpOiBJbmplY3RvcltdIHtcbiAgY29uc3QgcmVzb2x1dGlvblBhdGg6IEluamVjdG9yW10gPSBbaW5qZWN0b3JdO1xuICBnZXRJbmplY3RvclJlc29sdXRpb25QYXRoSGVscGVyKGluamVjdG9yLCByZXNvbHV0aW9uUGF0aCk7XG4gIHJldHVybiByZXNvbHV0aW9uUGF0aDtcbn1cblxuZnVuY3Rpb24gZ2V0SW5qZWN0b3JSZXNvbHV0aW9uUGF0aEhlbHBlcihcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsIHJlc29sdXRpb25QYXRoOiBJbmplY3RvcltdKTogSW5qZWN0b3JbXSB7XG4gIGNvbnN0IHBhcmVudCA9IGdldEluamVjdG9yUGFyZW50KGluamVjdG9yKTtcblxuICAvLyBpZiBnZXRJbmplY3RvclBhcmVudCBjYW4ndCBmaW5kIGEgcGFyZW50LCB0aGVuIHdlJ3ZlIGVpdGhlciByZWFjaGVkIHRoZSBlbmRcbiAgLy8gb2YgdGhlIHBhdGgsIG9yIHdlIG5lZWQgdG8gbW92ZSBmcm9tIHRoZSBFbGVtZW50IEluamVjdG9yIHRyZWUgdG8gdGhlXG4gIC8vIG1vZHVsZSBpbmplY3RvciB0cmVlIHVzaW5nIHRoZSBmaXJzdCBpbmplY3RvciBpbiBvdXIgcGF0aCBhcyB0aGUgY29ubmVjdGlvbiBwb2ludC5cbiAgaWYgKHBhcmVudCA9PT0gbnVsbCkge1xuICAgIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIE5vZGVJbmplY3Rvcikge1xuICAgICAgY29uc3QgZmlyc3RJbmplY3RvciA9IHJlc29sdXRpb25QYXRoWzBdO1xuICAgICAgaWYgKGZpcnN0SW5qZWN0b3IgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3IpIHtcbiAgICAgICAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBnZXRNb2R1bGVJbmplY3Rvck9mTm9kZUluamVjdG9yKGZpcnN0SW5qZWN0b3IpO1xuICAgICAgICBpZiAobW9kdWxlSW5qZWN0b3IgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKCdOb2RlSW5qZWN0b3IgbXVzdCBoYXZlIHNvbWUgY29ubmVjdGlvbiB0byB0aGUgbW9kdWxlIGluamVjdG9yIHRyZWUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdXRpb25QYXRoLnB1c2gobW9kdWxlSW5qZWN0b3IpO1xuICAgICAgICBnZXRJbmplY3RvclJlc29sdXRpb25QYXRoSGVscGVyKG1vZHVsZUluamVjdG9yLCByZXNvbHV0aW9uUGF0aCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXNvbHV0aW9uUGF0aDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmVzb2x1dGlvblBhdGgucHVzaChwYXJlbnQpO1xuICAgIGdldEluamVjdG9yUmVzb2x1dGlvblBhdGhIZWxwZXIocGFyZW50LCByZXNvbHV0aW9uUGF0aCk7XG4gIH1cblxuICByZXR1cm4gcmVzb2x1dGlvblBhdGg7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgcGFyZW50IG9mIGFuIGluamVjdG9yLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgbm90IGFibGUgdG8gbWFrZSB0aGUganVtcCBmcm9tIHRoZSBFbGVtZW50IEluamVjdG9yIFRyZWUgdG8gdGhlIE1vZHVsZVxuICogaW5qZWN0b3IgdHJlZS4gVGhpcyBpcyBiZWNhdXNlIHRoZSBcInBhcmVudFwiICh0aGUgbmV4dCBzdGVwIGluIHRoZSByZW9zbHV0aW9uIHBhdGgpXG4gKiBvZiBhIHJvb3QgTm9kZUluamVjdG9yIGlzIGRlcGVuZGVudCBvbiB3aGljaCBOb2RlSW5qZWN0b3IgYW5jZXN0b3IgaW5pdGlhdGVkXG4gKiB0aGUgREkgbG9va3VwLiBTZWUgZ2V0SW5qZWN0b3JSZXNvbHV0aW9uUGF0aCBmb3IgYSBmdW5jdGlvbiB0aGF0IGNhbiBtYWtlIHRoaXMganVtcC5cbiAqXG4gKiBJbiB0aGUgYmVsb3cgZGlhZ3JhbTpcbiAqIGBgYHRzXG4gKiBnZXRJbmplY3RvclBhcmVudChOb2RlSW5qZWN0b3JCKVxuICogID4gTm9kZUluamVjdG9yQVxuICogZ2V0SW5qZWN0b3JQYXJlbnQoTm9kZUluamVjdG9yQSkgLy8gb3IgZ2V0SW5qZWN0b3JQYXJlbnQoZ2V0SW5qZWN0b3JQYXJlbnQoTm9kZUluamVjdG9yQikpXG4gKiAgPiBudWxsIC8vIGNhbm5vdCBqdW1wIHRvIE1vZHVsZUluamVjdG9yIHRyZWVcbiAqIGBgYFxuICpcbiAqIGBgYFxuICogICAgICAgICAgICAgICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQICAgICAgICAgICAgICAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkFxuICogICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSkTW9kdWxlQeKUnOKUgOKUgOKUgEluamVjdG9y4pSA4pSA4pSA4pSA4pa64pSCRW52aXJvbm1lbnRJbmplY3RvcuKUglxuICogICAg4pSCICAgICAgICAgICDilJTilIDilIDilIDilKzilIDilIDilIDilJggICAgICAgICAgICAgICAg4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYXG4gKiAgICDilIIgICAgICAgICAgICAgICDilIJcbiAqICAgIOKUgiAgICAgICAgICAgYm9vdHN0cmFwc1xuICogICAg4pSCICAgICAgICAgICAgICAg4pSCXG4gKiAgICDilIIgICAgICAgICAgICAgICDilIJcbiAqICAgIOKUgiAgICAgICAgICDilIzilIDilIDilIDilIDilrzilIDilIDilIDilIDilIDilJAgICAgICAgICAgICAgICAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkFxuICogZGVjbGFyZXMgICAgICDilIJDb21wb25lbnRB4pSc4pSA4pSA4pSA4pSASW5qZWN0b3LilIDilIDilIDilIDilrrilIJOb2RlSW5qZWN0b3JB4pSCXG4gKiAgICDilIIgICAgICAgICAg4pSU4pSA4pSA4pSA4pSA4pSs4pSA4pSA4pSA4pSA4pSA4pSYICAgICAgICAgICAgICAgICDilJTilIDilIDilIDilIDilIDilrLilIDilIDilIDilIDilIDilIDilIDilJhcbiAqICAgIOKUgiAgICAgICAgICAgICAgIOKUgiAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCXG4gKiAgICDilIIgICAgICAgICAgICByZW5kZXJzICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50XG4gKiAgICDilIIgICAgICAgICAgICAgICDilIIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUglxuICogICAg4pSCICAgICAgICAgIOKUjOKUgOKUgOKUgOKUgOKWvOKUgOKUgOKUgOKUgOKUgOKUkCAgICAgICAgICAgICAgICAg4pSM4pSA4pSA4pSA4pSA4pSA4pS04pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQXG4gKiAgICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilrrilIJDb21wb25lbnRC4pSc4pSA4pSA4pSA4pSASW5qZWN0b3LilIDilIDilIDilIDilrrilIJOb2RlSW5qZWN0b3JC4pSCXG4gKiAgICAgICAgICAgICAgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCAgICAgICAgICAgICAgICAg4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYXG4gKmBgYFxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBhbiBJbmplY3RvciB0byBnZXQgdGhlIHBhcmVudCBvZlxuICogQHJldHVybnMgSW5qZWN0b3IgdGhlIHBhcmVudCBvZiB0aGUgZ2l2ZW4gaW5qZWN0b3JcbiAqL1xuZnVuY3Rpb24gZ2V0SW5qZWN0b3JQYXJlbnQoaW5qZWN0b3I6IEluamVjdG9yKTogSW5qZWN0b3J8bnVsbCB7XG4gIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIFIzSW5qZWN0b3IpIHtcbiAgICByZXR1cm4gaW5qZWN0b3IucGFyZW50O1xuICB9XG5cbiAgbGV0IHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIGxldCBsVmlldzogTFZpZXc8dW5rbm93bj47XG4gIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIE5vZGVJbmplY3Rvcikge1xuICAgIHROb2RlID0gZ2V0Tm9kZUluamVjdG9yVE5vZGUoaW5qZWN0b3IpO1xuICAgIGxWaWV3ID0gZ2V0Tm9kZUluamVjdG9yTFZpZXcoaW5qZWN0b3IpO1xuICB9IGVsc2UgaWYgKGluamVjdG9yIGluc3RhbmNlb2YgTnVsbEluamVjdG9yKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3dFcnJvcihcbiAgICAgICAgJ2dldEluamVjdG9yUGFyZW50IG9ubHkgc3VwcG9ydCBpbmplY3RvcnMgb2YgdHlwZSBSM0luamVjdG9yLCBOb2RlSW5qZWN0b3IsIE51bGxJbmplY3RvcicpO1xuICB9XG5cbiAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKFxuICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3KTtcblxuICBpZiAoaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jYXRpb24pKSB7XG4gICAgY29uc3QgcGFyZW50SW5qZWN0b3JJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jYXRpb24pO1xuICAgIGNvbnN0IHBhcmVudExWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBsVmlldyk7XG4gICAgY29uc3QgcGFyZW50VFZpZXcgPSBwYXJlbnRMVmlld1tUVklFV107XG4gICAgY29uc3QgcGFyZW50VE5vZGUgPSBwYXJlbnRUVmlldy5kYXRhW3BhcmVudEluamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuVE5PREVdIGFzIFROb2RlO1xuICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKFxuICAgICAgICBwYXJlbnRUTm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgcGFyZW50TFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNoYWluZWRJbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSBhcyBDaGFpbmVkSW5qZWN0b3I7XG5cbiAgICAvLyBDYXNlIHdoZXJlIGNoYWluZWRJbmplY3Rvci5pbmplY3RvciBpcyBhbiBPdXRsZXRJbmplY3RvciBhbmQgY2hhaW5lZEluamVjdG9yLmluamVjdG9yLnBhcmVudFxuICAgIC8vIGlzIGEgTm9kZUluamVjdG9yLlxuICAgIC8vIHRvZG8oYWxla3NhbmRlcmJvZHVycmkpOiBpZGVhbGx5IG5vdGhpbmcgaW4gcGFja2FnZXMvY29yZSBzaG91bGQgZGVhbFxuICAgIC8vIGRpcmVjdGx5IHdpdGggcm91dGVyIGNvbmNlcm5zLiBSZWZhY3RvciB0aGlzIHNvIHRoYXQgd2UgY2FuIG1ha2UgdGhlIGp1bXAgZnJvbVxuICAgIC8vIE5vZGVJbmplY3RvciAtPiBPdXRsZXRJbmplY3RvciAtPiBOb2RlSW5qZWN0b3JcbiAgICAvLyB3aXRob3V0IGV4cGxpY3RseSByZWx5aW5nIG9uIHR5cGVzIGNvbnRyYWN0cyBmcm9tIHBhY2thZ2VzL3JvdXRlclxuICAgIGNvbnN0IGluamVjdG9yUGFyZW50ID0gKGNoYWluZWRJbmplY3Rvci5pbmplY3RvciBhcyBhbnkpPy5wYXJlbnQgYXMgSW5qZWN0b3I7XG5cbiAgICBpZiAoaW5qZWN0b3JQYXJlbnQgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3IpIHtcbiAgICAgIHJldHVybiBpbmplY3RvclBhcmVudDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBtb2R1bGUgaW5qZWN0b3Igb2YgYSBOb2RlSW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIE5vZGVJbmplY3RvciB0byBnZXQgbW9kdWxlIGluamVjdG9yIG9mXG4gKiBAcmV0dXJucyBJbmplY3RvciByZXByZXNlbnRpbmcgbW9kdWxlIGluamVjdG9yIG9mIHRoZSBnaXZlbiBOb2RlSW5qZWN0b3JcbiAqL1xuZnVuY3Rpb24gZ2V0TW9kdWxlSW5qZWN0b3JPZk5vZGVJbmplY3RvcihpbmplY3RvcjogTm9kZUluamVjdG9yKTogSW5qZWN0b3Ige1xuICBsZXQgbFZpZXc6IExWaWV3PHVua25vd24+O1xuICBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3IpIHtcbiAgICBsVmlldyA9IGdldE5vZGVJbmplY3RvckxWaWV3KGluamVjdG9yKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvd0Vycm9yKCdnZXRNb2R1bGVJbmplY3Rvck9mTm9kZUluamVjdG9yIG11c3QgYmUgY2FsbGVkIHdpdGggYSBOb2RlSW5qZWN0b3InKTtcbiAgfVxuXG4gIGNvbnN0IGNoYWluZWRJbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSBhcyBDaGFpbmVkSW5qZWN0b3I7XG4gIGNvbnN0IG1vZHVsZUluamVjdG9yID0gY2hhaW5lZEluamVjdG9yLnBhcmVudEluamVjdG9yO1xuICBpZiAoIW1vZHVsZUluamVjdG9yKSB7XG4gICAgdGhyb3dFcnJvcignTm9kZUluamVjdG9yIG11c3QgaGF2ZSBzb21lIGNvbm5lY3Rpb24gdG8gdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlJyk7XG4gIH1cblxuICByZXR1cm4gbW9kdWxlSW5qZWN0b3I7XG59XG4iXX0=