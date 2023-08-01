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
    let diResolver = injector;
    if (injector instanceof NodeInjector) {
        diResolver = getNodeInjectorLView(injector);
    }
    const { resolverToTokenToDependencies } = getFrameworkDIDebugData();
    let dependencies = resolverToTokenToDependencies.get(diResolver)?.get?.(token) ?? [];
    const resolutionPath = getInjectorResolutionPath(injector);
    dependencies = dependencies.map(dep => {
        const flags = dep.flags;
        dep.flags = {
            optional: (8 /* InternalInjectFlags.Optional */ & flags) === 8 /* InternalInjectFlags.Optional */,
            host: (1 /* InternalInjectFlags.Host */ & flags) === 1 /* InternalInjectFlags.Host */,
            self: (2 /* InternalInjectFlags.Self */ & flags) === 2 /* InternalInjectFlags.Self */,
            skipSelf: (4 /* InternalInjectFlags.SkipSelf */ & flags) === 4 /* InternalInjectFlags.SkipSelf */,
        };
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
        return dep;
    });
    return { instance, dependencies };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3JfZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy91dGlsL2luamVjdG9yX2Rpc2NvdmVyeV91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsY0FBYyxFQUFlLE1BQU0seUJBQXlCLENBQUM7QUFFckUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3BELE9BQU8sRUFBaUIsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RSxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsVUFBVSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFckUsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ3JGLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFN0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM5QyxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUseUJBQXlCLEVBQUUsWUFBWSxFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzFHLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBSTdFLE9BQU8sRUFBQyxRQUFRLEVBQVMsS0FBSyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFMUQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFbEc7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLDZCQUE2QixDQUN6QyxRQUFrQixFQUNsQixLQUFnQztJQUNsQyw2RkFBNkY7SUFDN0Ysa0ZB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O0tBQ3hDO1NBQU07UUFDTCxVQUFVLENBQUMsb0VBQW9FLENBQUMsQ0FBQztLQUNsRjtJQUVELE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQW9CLENBQUM7SUFDM0QsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDLGNBQWMsQ0FBQztJQUN0RCxJQUFJLENBQUMsY0FBYyxFQUFFO1FBQ25CLFVBQVUsQ0FBQyxvRUFBb0UsQ0FBQyxDQUFDO0tBQ2xGO0lBRUQsT0FBTyxjQUFjLENBQUM7QUFDeEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi8uLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtnZXRJbmplY3RvckRlZiwgSW5qZWN0b3JUeXBlfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0luamVjdEZsYWdzLCBJbnRlcm5hbEluamVjdEZsYWdzfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtOdWxsSW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL251bGxfaW5qZWN0b3InO1xuaW1wb3J0IHtTaW5nbGVQcm92aWRlciwgd2Fsa1Byb3ZpZGVyVHJlZX0gZnJvbSAnLi4vLi4vZGkvcHJvdmlkZXJfY29sbGVjdGlvbic7XG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3IsIFIzSW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL3IzX2luamVjdG9yJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi8uLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtkZWVwRm9yRWFjaH0gZnJvbSAnLi4vLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge3Rocm93RXJyb3J9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB0eXBlIHtDaGFpbmVkSW5qZWN0b3J9IGZyb20gJy4uL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtnZXROb2RlSW5qZWN0b3JMVmlldywgZ2V0Tm9kZUluamVjdG9yVE5vZGUsIGdldFBhcmVudEluamVjdG9yTG9jYXRpb24sIE5vZGVJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtnZXRGcmFtZXdvcmtESURlYnVnRGF0YX0gZnJvbSAnLi4vZGVidWcvZnJhbWV3b3JrX2luamVjdG9yX3Byb2ZpbGVyJztcbmltcG9ydCB7SW5qZWN0ZWRTZXJ2aWNlLCBQcm92aWRlclJlY29yZH0gZnJvbSAnLi4vZGVidWcvaW5qZWN0b3JfcHJvZmlsZXInO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JPZmZzZXR9IGZyb20gJy4uL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtJTkpFQ1RPUiwgTFZpZXcsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5pbXBvcnQge2dldFBhcmVudEluamVjdG9ySW5kZXgsIGdldFBhcmVudEluamVjdG9yVmlldywgaGFzUGFyZW50SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3JfdXRpbHMnO1xuXG4vKipcbiAqIERpc2NvdmVycyB0aGUgZGVwZW5kZW5jaWVzIG9mIGFuIGluamVjdGFibGUgaW5zdGFuY2UuIFByb3ZpZGVzIERJIGluZm9ybWF0aW9uIGFib3V0IGVhY2hcbiAqIGRlcGVuZGVuY3kgdGhhdCB0aGUgaW5qZWN0YWJsZSB3YXMgaW5zdGFudGlhdGVkIHdpdGgsIGluY2x1ZGluZyB3aGVyZSB0aGV5IHdlcmUgcHJvdmlkZWQgZnJvbS5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgQW4gaW5qZWN0b3IgaW5zdGFuY2VcbiAqIEBwYXJhbSB0b2tlbiBhIERJIHRva2VuIHRoYXQgd2FzIGNvbnN0cnVjdGVkIGJ5IHRoZSBnaXZlbiBpbmplY3RvciBpbnN0YW5jZVxuICogQHJldHVybnMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIGNyZWF0ZWQgaW5zdGFuY2Ugb2YgdG9rZW4gYXMgd2VsbCBhcyBhbGwgb2YgdGhlIGRlcGVuZGVuY2llc1xuICogdGhhdCBpdCB3YXMgaW5zdGFudGlhdGVkIHdpdGggT1IgdW5kZWZpbmVkIGlmIHRoZSB0b2tlbiB3YXMgbm90IGNyZWF0ZWQgd2l0aGluIHRoZSBnaXZlblxuICogaW5qZWN0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZXBlbmRlbmNpZXNGcm9tSW5qZWN0YWJsZTxUPihcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsXG4gICAgdG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4pOiB7aW5zdGFuY2U6IFQ7IGRlcGVuZGVuY2llczogSW5qZWN0ZWRTZXJ2aWNlW119fHVuZGVmaW5lZCB7XG4gIC8vIEZpcnN0IHdlIGNoZWNrIHRvIHNlZSBpZiB0aGUgdG9rZW4gZ2l2ZW4gbWFwcyB0byBhbiBhY3R1YWwgaW5zdGFuY2UgaW4gdGhlIGluamVjdG9yIGdpdmVuLlxuICAvLyBXZSB1c2UgYHNlbGY6IHRydWVgIGJlY2F1c2Ugd2Ugb25seSB3YW50IHRvIGxvb2sgYXQgdGhlIGluamVjdG9yIHdlIHdlcmUgZ2l2ZW4uXG4gIC8vIFdlIHVzZSBgb3B0aW9uYWw6IHRydWVgIGJlY2F1c2UgaXQncyBwb3NzaWJsZSB0aGF0IHRoZSB0b2tlbiB3ZSB3ZXJlIGdpdmVuIHdhcyBuZXZlclxuICAvLyBjb25zdHJ1Y3RlZCBieSB0aGUgaW5qZWN0b3Igd2Ugd2VyZSBnaXZlbi5cbiAgY29uc3QgaW5zdGFuY2UgPSBpbmplY3Rvci5nZXQodG9rZW4sIG51bGwsIHtzZWxmOiB0cnVlLCBvcHRpb25hbDogdHJ1ZX0pO1xuICBpZiAoaW5zdGFuY2UgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBkZXRlcm1pbmUgaW5zdGFuY2Ugb2YgJHt0b2tlbn0gaW4gZ2l2ZW4gaW5qZWN0b3JgKTtcbiAgfVxuXG4gIGxldCBkaVJlc29sdmVyOiBJbmplY3RvcnxMVmlldyA9IGluamVjdG9yO1xuICBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3IpIHtcbiAgICBkaVJlc29sdmVyID0gZ2V0Tm9kZUluamVjdG9yTFZpZXcoaW5qZWN0b3IpO1xuICB9XG5cbiAgY29uc3Qge3Jlc29sdmVyVG9Ub2tlblRvRGVwZW5kZW5jaWVzfSA9IGdldEZyYW1ld29ya0RJRGVidWdEYXRhKCk7XG5cbiAgbGV0IGRlcGVuZGVuY2llcyA9XG4gICAgICByZXNvbHZlclRvVG9rZW5Ub0RlcGVuZGVuY2llcy5nZXQoZGlSZXNvbHZlcik/LmdldD8uKHRva2VuIGFzIFR5cGU8dW5rbm93bj4pID8/IFtdO1xuXG4gIGNvbnN0IHJlc29sdXRpb25QYXRoID0gZ2V0SW5qZWN0b3JSZXNvbHV0aW9uUGF0aChpbmplY3Rvcik7XG4gIGRlcGVuZGVuY2llcyA9IGRlcGVuZGVuY2llcy5tYXAoZGVwID0+IHtcbiAgICBjb25zdCBmbGFncyA9IGRlcC5mbGFncyBhcyBJbnRlcm5hbEluamVjdEZsYWdzO1xuICAgIGRlcC5mbGFncyA9IHtcbiAgICAgIG9wdGlvbmFsOiAoSW50ZXJuYWxJbmplY3RGbGFncy5PcHRpb25hbCAmIGZsYWdzKSA9PT0gSW50ZXJuYWxJbmplY3RGbGFncy5PcHRpb25hbCxcbiAgICAgIGhvc3Q6IChJbnRlcm5hbEluamVjdEZsYWdzLkhvc3QgJiBmbGFncykgPT09IEludGVybmFsSW5qZWN0RmxhZ3MuSG9zdCxcbiAgICAgIHNlbGY6IChJbnRlcm5hbEluamVjdEZsYWdzLlNlbGYgJiBmbGFncykgPT09IEludGVybmFsSW5qZWN0RmxhZ3MuU2VsZixcbiAgICAgIHNraXBTZWxmOiAoSW50ZXJuYWxJbmplY3RGbGFncy5Ta2lwU2VsZiAmIGZsYWdzKSA9PT0gSW50ZXJuYWxJbmplY3RGbGFncy5Ta2lwU2VsZixcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXNvbHV0aW9uUGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5qZWN0b3JUb0NoZWNrID0gcmVzb2x1dGlvblBhdGhbaV07XG5cbiAgICAgIC8vIGlmIHNraXBTZWxmIGlzIHRydWUgd2Ugc2tpcCB0aGUgZmlyc3QgaW5qZWN0b3JcbiAgICAgIGlmIChpID09PSAwICYmIGRlcC5mbGFncy5za2lwU2VsZikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gaG9zdCBvbmx5IGFwcGxpZXMgdG8gTm9kZUluamVjdG9yc1xuICAgICAgaWYgKGRlcC5mbGFncy5ob3N0ICYmIGluamVjdG9yVG9DaGVjayBpbnN0YW5jZW9mIEVudmlyb25tZW50SW5qZWN0b3IpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGluc3RhbmNlID1cbiAgICAgICAgICBpbmplY3RvclRvQ2hlY2suZ2V0KGRlcC50b2tlbiBhcyBUeXBlPHVua25vd24+LCBudWxsLCB7c2VsZjogdHJ1ZSwgb3B0aW9uYWw6IHRydWV9KTtcblxuICAgICAgaWYgKGluc3RhbmNlICE9PSBudWxsKSB7XG4gICAgICAgIC8vIGlmIGhvc3QgZmxhZyBpcyB0cnVlIHdlIGRvdWJsZSBjaGVjayB0aGF0IHdlIGNhbiBnZXQgdGhlIHNlcnZpY2UgZnJvbSB0aGUgZmlyc3QgZWxlbWVudFxuICAgICAgICAvLyBpbiB0aGUgcmVzb2x1dGlvbiBwYXRoIGJ5IHVzaW5nIHRoZSBob3N0IGZsYWcuIFRoaXMgaXMgZG9uZSB0byBtYWtlIHN1cmUgdGhhdCB3ZSd2ZSBmb3VuZFxuICAgICAgICAvLyB0aGUgY29ycmVjdCBwcm92aWRpbmcgaW5qZWN0b3IsIGFuZCBub3QgYSBub2RlIGluamVjdG9yIHRoYXQgaXMgY29ubmVjdGVkIHRvIG91ciBwYXRoIHZpYVxuICAgICAgICAvLyBhIHJvdXRlciBvdXRsZXQuXG4gICAgICAgIGlmIChkZXAuZmxhZ3MuaG9zdCkge1xuICAgICAgICAgIGNvbnN0IGZpcnN0SW5qZWN0b3IgPSByZXNvbHV0aW9uUGF0aFswXTtcbiAgICAgICAgICBjb25zdCBsb29rdXBGcm9tRmlyc3RJbmplY3RvciA9XG4gICAgICAgICAgICAgIGZpcnN0SW5qZWN0b3IuZ2V0KGRlcC50b2tlbiBhcyBUeXBlPHVua25vd24+LCBudWxsLCB7Li4uZGVwLmZsYWdzLCBvcHRpb25hbDogdHJ1ZX0pO1xuXG4gICAgICAgICAgaWYgKGxvb2t1cEZyb21GaXJzdEluamVjdG9yICE9PSBudWxsKSB7XG4gICAgICAgICAgICBkZXAucHJvdmlkZWRJbiA9IGluamVjdG9yVG9DaGVjaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGRlcC5wcm92aWRlZEluID0gaW5qZWN0b3JUb0NoZWNrO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gaWYgc2VsZiBpcyB0cnVlIHdlIHN0b3AgYWZ0ZXIgdGhlIGZpcnN0IGluamVjdG9yXG4gICAgICBpZiAoaSA9PT0gMCAmJiBkZXAuZmxhZ3Muc2VsZikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVwO1xuICB9KTtcblxuICByZXR1cm4ge2luc3RhbmNlLCBkZXBlbmRlbmNpZXN9O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGNsYXNzIGFzc29jaWF0ZWQgd2l0aCBhbiBpbmplY3RvciB0aGF0IGNvbnRhaW5zIGEgcHJvdmlkZXIgYGltcG9ydHNgIGFycmF5IGluIGl0J3NcbiAqIGRlZmluaXRpb25cbiAqXG4gKiBGb3IgTW9kdWxlIEluamVjdG9ycyB0aGlzIHJldHVybnMgdGhlIE5nTW9kdWxlIGNvbnN0cnVjdG9yLlxuICpcbiAqIEZvciBTdGFuZGFsb25lIGluamVjdG9ycyB0aGlzIHJldHVybnMgdGhlIHN0YW5kYWxvbmUgY29tcG9uZW50IGNvbnN0cnVjdG9yLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBJbmplY3RvciBhbiBpbmplY3RvciBpbnN0YW5jZVxuICogQHJldHVybnMgdGhlIGNvbnN0cnVjdG9yIHdoZXJlIHRoZSBgaW1wb3J0c2AgYXJyYXkgdGhhdCBjb25maWd1cmVzIHRoaXMgaW5qZWN0b3IgaXMgbG9jYXRlZFxuICovXG5mdW5jdGlvbiBnZXRQcm92aWRlckltcG9ydHNDb250YWluZXIoaW5qZWN0b3I6IEluamVjdG9yKTogVHlwZTx1bmtub3duPnxudWxsIHtcbiAgY29uc3Qge3N0YW5kYWxvbmVJbmplY3RvclRvQ29tcG9uZW50fSA9IGdldEZyYW1ld29ya0RJRGVidWdEYXRhKCk7XG5cbiAgLy8gc3RhbmRhbG9uZSBjb21wb25lbnRzIGNvbmZpZ3VyZSBwcm92aWRlcnMgdGhyb3VnaCBhIGNvbXBvbmVudCBkZWYsIHNvIHdlIGhhdmUgdG9cbiAgLy8gdXNlIHRoZSBzdGFuZGFsb25lIGNvbXBvbmVudCBhc3NvY2lhdGVkIHdpdGggdGhpcyBpbmplY3RvciBpZiBJbmplY3RvciByZXByZXNlbnRzXG4gIC8vIGEgc3RhbmRhbG9uZSBjb21wb25lbnRzIEVudmlyb25tZW50SW5qZWN0b3JcbiAgaWYgKHN0YW5kYWxvbmVJbmplY3RvclRvQ29tcG9uZW50LmhhcyhpbmplY3RvcikpIHtcbiAgICByZXR1cm4gc3RhbmRhbG9uZUluamVjdG9yVG9Db21wb25lbnQuZ2V0KGluamVjdG9yKSE7XG4gIH1cblxuICAvLyBNb2R1bGUgaW5qZWN0b3JzIGNvbmZpZ3VyZSBwcm92aWRlcnMgdGhyb3VnaCB0aGVpciBOZ01vZHVsZSBkZWYsIHNvIHdlIHVzZSB0aGVcbiAgLy8gaW5qZWN0b3IgdG8gbG9va3VwIGl0cyBOZ01vZHVsZVJlZiBhbmQgdGhyb3VnaCB0aGF0IGdyYWIgaXRzIGluc3RhbmNlXG4gIGNvbnN0IGRlZlR5cGVSZWYgPSBpbmplY3Rvci5nZXQodmlld0VuZ2luZV9OZ01vZHVsZVJlZiwgbnVsbCwge3NlbGY6IHRydWUsIG9wdGlvbmFsOiB0cnVlfSkhO1xuXG4gIC8vIElmIHdlIGNhbid0IGZpbmQgYW4gYXNzb2NpYXRlZCBpbXBvcnRzIGNvbnRhaW5lciwgcmV0dXJuIG51bGwuXG4gIC8vIFRoaXMgY291bGQgYmUgdGhlIGNhc2UgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBhbiBSM0luamVjdG9yIHRoYXQgZG9lcyBub3QgcmVwcmVzZW50XG4gIC8vIGEgc3RhbmRhbG9uZSBjb21wb25lbnQgb3IgTmdNb2R1bGUuXG4gIGlmIChkZWZUeXBlUmVmID09PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gZGVmVHlwZVJlZi5pbnN0YW5jZS5jb25zdHJ1Y3Rvcjtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBwcm92aWRlcnMgY29uZmlndXJlZCBvbiBhIE5vZGVJbmplY3RvclxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBBIE5vZGVJbmplY3RvciBpbnN0YW5jZVxuICogQHJldHVybnMgUHJvdmlkZXJSZWNvcmRbXSBhbiBhcnJheSBvZiBvYmplY3RzIHJlcHJlc2VudGluZyB0aGUgcHJvdmlkZXJzIGNvbmZpZ3VyZWQgb24gdGhpc1xuICogICAgIGluamVjdG9yXG4gKi9cbmZ1bmN0aW9uIGdldE5vZGVJbmplY3RvclByb3ZpZGVycyhpbmplY3RvcjogTm9kZUluamVjdG9yKTogUHJvdmlkZXJSZWNvcmRbXSB7XG4gIGNvbnN0IGRpUmVzb2x2ZXIgPSBnZXROb2RlSW5qZWN0b3JMVmlldyhpbmplY3Rvcik7XG4gIGNvbnN0IHtyZXNvbHZlclRvUHJvdmlkZXJzfSA9IGdldEZyYW1ld29ya0RJRGVidWdEYXRhKCk7XG4gIHJldHVybiByZXNvbHZlclRvUHJvdmlkZXJzLmdldChkaVJlc29sdmVyKSA/PyBbXTtcbn1cblxuLyoqXG4gKiBHZXRzIGEgbWFwcGluZyBvZiBwcm92aWRlcnMgY29uZmlndXJlZCBvbiBhbiBpbmplY3RvciB0byB0aGVpciBpbXBvcnQgcGF0aHNcbiAqXG4gKiBNb2R1bGVBIC0+IGltcG9ydHMgTW9kdWxlQlxuICogTW9kdWxlQiAtPiBpbXBvcnRzIE1vZHVsZUNcbiAqIE1vZHVsZUIgLT4gcHJvdmlkZXMgTXlTZXJ2aWNlQVxuICogTW9kdWxlQyAtPiBwcm92aWRlcyBNeVNlcnZpY2VCXG4gKlxuICogZ2V0UHJvdmlkZXJJbXBvcnRQYXRocyhNb2R1bGVBKVxuICogPiBNYXAoMikge1xuICogICBNeVNlcnZpY2VBID0+IFtNb2R1bGVBLCBNb2R1bGVCXVxuICogICBNeVNlcnZpY2VCID0+IFtNb2R1bGVBLCBNb2R1bGVCLCBNb2R1bGVDXVxuICogIH1cbiAqXG4gKiBAcGFyYW0gcHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyIGNvbnN0cnVjdG9yIG9mIGNsYXNzIHRoYXQgY29udGFpbnMgYW4gYGltcG9ydHNgIGFycmF5IGluIGl0J3NcbiAqICAgICBkZWZpbml0aW9uXG4gKiBAcmV0dXJucyBBIE1hcCBvYmplY3QgdGhhdCBtYXBzIHByb3ZpZGVycyB0byBhbiBhcnJheSBvZiBjb25zdHJ1Y3RvcnMgcmVwcmVzZW50aW5nIGl0J3MgaW1wb3J0XG4gKiAgICAgcGF0aFxuICpcbiAqL1xuZnVuY3Rpb24gZ2V0UHJvdmlkZXJJbXBvcnRQYXRocyhwcm92aWRlckltcG9ydHNDb250YWluZXI6IFR5cGU8dW5rbm93bj4pOlxuICAgIE1hcDxTaW5nbGVQcm92aWRlciwgKFR5cGU8dW5rbm93bj58IEluamVjdG9yVHlwZTx1bmtub3duPilbXT4ge1xuICBjb25zdCBwcm92aWRlclRvUGF0aCA9IG5ldyBNYXA8U2luZ2xlUHJvdmlkZXIsIChUeXBlPHVua25vd24+fCBJbmplY3RvclR5cGU8dW5rbm93bj4pW10+KCk7XG4gIGNvbnN0IHZpc2l0ZWRDb250YWluZXJzID0gbmV3IFNldDxUeXBlPHVua25vd24+PigpO1xuICBjb25zdCB2aXNpdG9yID0gd2Fsa1Byb3ZpZGVyVHJlZVRvRGlzY292ZXJJbXBvcnRQYXRocyhwcm92aWRlclRvUGF0aCwgdmlzaXRlZENvbnRhaW5lcnMpO1xuXG4gIHdhbGtQcm92aWRlclRyZWUocHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyLCB2aXNpdG9yLCBbXSwgbmV3IFNldCgpKTtcblxuICByZXR1cm4gcHJvdmlkZXJUb1BhdGg7XG59XG5cbi8qKlxuICpcbiAqIEhpZ2hlciBvcmRlciBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSB2aXNpdG9yIGZvciBXYWxrUHJvdmlkZXJUcmVlXG4gKlxuICogVGFrZXMgaW4gYSBNYXAgYW5kIFNldCB0byBrZWVwIHRyYWNrIG9mIHRoZSBwcm92aWRlcnMgYW5kIGNvbnRhaW5lcnNcbiAqIHZpc2l0ZWQsIHNvIHRoYXQgd2UgY2FuIGRpc2NvdmVyIHRoZSBpbXBvcnQgcGF0aHMgb2YgdGhlc2UgcHJvdmlkZXJzXG4gKiBkdXJpbmcgdGhlIHRyYXZlcnNhbC5cbiAqXG4gKiBUaGlzIHZpc2l0b3IgdGFrZXMgYWR2YW50YWdlIG9mIHRoZSBmYWN0IHRoYXQgd2Fsa1Byb3ZpZGVyVHJlZSBwZXJmb3JtcyBhXG4gKiBwb3N0b3JkZXIgdHJhdmVyc2FsIG9mIHRoZSBwcm92aWRlciB0cmVlIGZvciB0aGUgcGFzc2VkIGluIGNvbnRhaW5lci4gQmVjYXVzZSBwb3N0b3JkZXJcbiAqIHRyYXZlcnNhbCByZWN1cnNpdmVseSBwcm9jZXNzZXMgc3VidHJlZXMgZnJvbSBsZWFmIG5vZGVzIHVudGlsIHRoZSB0cmF2ZXJzYWwgcmVhY2hlcyB0aGUgcm9vdCxcbiAqIHdlIHdyaXRlIGEgdmlzaXRvciB0aGF0IGNvbnN0cnVjdHMgcHJvdmlkZXIgaW1wb3J0IHBhdGhzIGluIHJldmVyc2UuXG4gKlxuICpcbiAqIFdlIHVzZSB0aGUgdmlzaXRlZENvbnRhaW5lcnMgc2V0IGRlZmluZWQgb3V0c2lkZSB0aGlzIHZpc2l0b3JcbiAqIGJlY2F1c2Ugd2Ugd2FudCB0byBydW4gc29tZSBsb2dpYyBvbmx5IG9uY2UgZm9yXG4gKiBlYWNoIGNvbnRhaW5lciBpbiB0aGUgdHJlZS4gVGhhdCBsb2dpYyBjYW4gYmUgZGVzY3JpYmVkIGFzOlxuICpcbiAqXG4gKiAxLiBmb3IgZWFjaCBkaXNjb3ZlcmVkX3Byb3ZpZGVyIGFuZCBkaXNjb3ZlcmVkX3BhdGggaW4gdGhlIGluY29tcGxldGUgcHJvdmlkZXIgcGF0aHMgd2UndmVcbiAqIGFscmVhZHkgZGlzY292ZXJlZFxuICogMi4gZ2V0IHRoZSBmaXJzdCBjb250YWluZXIgaW4gZGlzY292ZXJlZF9wYXRoXG4gKiAzLiBpZiB0aGF0IGZpcnN0IGNvbnRhaW5lciBpcyBpbiB0aGUgaW1wb3J0cyBhcnJheSBvZiB0aGUgY29udGFpbmVyIHdlJ3JlIHZpc2l0aW5nXG4gKiAgICBUaGVuIHRoZSBjb250YWluZXIgd2UncmUgdmlzaXRpbmcgaXMgYWxzbyBpbiB0aGUgaW1wb3J0IHBhdGggb2YgZGlzY292ZXJlZF9wcm92aWRlciwgc28gd2VcbiAqICAgIHVuc2hpZnQgZGlzY292ZXJlZF9wYXRoIHdpdGggdGhlIGNvbnRhaW5lciB3ZSdyZSBjdXJyZW50bHkgdmlzaXRpbmdcbiAqXG4gKlxuICogRXhhbXBsZSBSdW46XG4gKiBgYGBcbiAqICAgICAgICAgICAgICAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJBcbiAqICAgICAgICAgICAgICAgICDilIJjb250YWluZXJB4pSCXG4gKiAgICAgIOKUjOKUgGltcG9ydHMt4pSA4pSkICAgICAgICAgIOKUnOKUgOKUgGltcG9ydHPilIDilJBcbiAqICAgICAg4pSCICAgICAgICAgIOKUgiAgcHJvdkEgICDilIIgICAgICAgICAg4pSCXG4gKiAgICAgIOKUgiAgICAgICAgICDilIIgIHByb3ZCICAg4pSCICAgICAgICAgIOKUglxuICogICAgICDilIIgICAgICAgICAg4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYICAgICAgICAgIOKUglxuICogICAgICDilIIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUglxuICogICAgIOKUjOKWvOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCAgICAgICAgICAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilrzilIDilJBcbiAqICAgICDilIJjb250YWluZXJC4pSCICAgICAgICAgICAgIOKUgmNvbnRhaW5lckPilIJcbiAqICAgICDilIIgICAgICAgICAg4pSCICAgICAgICAgICAgIOKUgiAgICAgICAgICDilIJcbiAqICAgICDilIIgIHByb3ZEICAg4pSCICAgICAgICAgICAgIOKUgiAgcHJvdkYgICDilIJcbiAqICAgICDilIIgIHByb3ZFICAg4pSCICAgICAgICAgICAgIOKUgiAgcHJvdkcgICDilIJcbiAqICAgICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJggICAgICAgICAgICAg4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYXG4gKiBgYGBcbiAqXG4gKiBFYWNoIHN0ZXAgb2YgdGhlIHRyYXZlcnNhbCxcbiAqXG4gKiBgYGBcbiAqIHZpc2l0b3IocHJvdkQsIGNvbnRhaW5lckIpXG4gKiBwcm92aWRlclRvUGF0aCA9PT0gTWFwIHsgcHJvdkQgPT4gW2NvbnRhaW5lckJdIH1cbiAqIHZpc2l0ZWRDb250YWluZXJzID09PSBTZXQgeyBjb250YWluZXJCIH1cbiAqXG4gKiB2aXNpdG9yKHByb3ZFLCBjb250YWluZXJCKVxuICogcHJvdmlkZXJUb1BhdGggPT09IE1hcCB7IHByb3ZEID0+IFtjb250YWluZXJCXSwgcHJvdkUgPT4gW2NvbnRhaW5lckJdIH1cbiAqIHZpc2l0ZWRDb250YWluZXJzID09PSBTZXQgeyBjb250YWluZXJCIH1cbiAqXG4gKiB2aXNpdG9yKHByb3ZGLCBjb250YWluZXJDKVxuICogcHJvdmlkZXJUb1BhdGggPT09IE1hcCB7IHByb3ZEID0+IFtjb250YWluZXJCXSwgcHJvdkUgPT4gW2NvbnRhaW5lckJdLCBwcm92RiA9PiBbY29udGFpbmVyQ10gfVxuICogdmlzaXRlZENvbnRhaW5lcnMgPT09IFNldCB7IGNvbnRhaW5lckIsIGNvbnRhaW5lckMgfVxuICpcbiAqIHZpc2l0b3IocHJvdkcsIGNvbnRhaW5lckMpXG4gKiBwcm92aWRlclRvUGF0aCA9PT0gTWFwIHtcbiAqICAgcHJvdkQgPT4gW2NvbnRhaW5lckJdLCBwcm92RSA9PiBbY29udGFpbmVyQl0sIHByb3ZGID0+IFtjb250YWluZXJDXSwgcHJvdkcgPT4gW2NvbnRhaW5lckNdXG4gKiB9XG4gKiB2aXNpdGVkQ29udGFpbmVycyA9PT0gU2V0IHsgY29udGFpbmVyQiwgY29udGFpbmVyQyB9XG4gKlxuICogdmlzaXRvcihwcm92QSwgY29udGFpbmVyQSlcbiAqIHByb3ZpZGVyVG9QYXRoID09PSBNYXAge1xuICogICBwcm92RCA9PiBbY29udGFpbmVyQSwgY29udGFpbmVyQl0sXG4gKiAgIHByb3ZFID0+IFtjb250YWluZXJBLCBjb250YWluZXJCXSxcbiAqICAgcHJvdkYgPT4gW2NvbnRhaW5lckEsIGNvbnRhaW5lckNdLFxuICogICBwcm92RyA9PiBbY29udGFpbmVyQSwgY29udGFpbmVyQ10sXG4gKiAgIHByb3ZBID0+IFtjb250YWluZXJBXVxuICogfVxuICogdmlzaXRlZENvbnRhaW5lcnMgPT09IFNldCB7IGNvbnRhaW5lckIsIGNvbnRhaW5lckMsIGNvbnRhaW5lckEgfVxuICpcbiAqIHZpc2l0b3IocHJvdkIsIGNvbnRhaW5lckEpXG4gKiBwcm92aWRlclRvUGF0aCA9PT0gTWFwIHtcbiAqICAgcHJvdkQgPT4gW2NvbnRhaW5lckEsIGNvbnRhaW5lckJdLFxuICogICBwcm92RSA9PiBbY29udGFpbmVyQSwgY29udGFpbmVyQl0sXG4gKiAgIHByb3ZGID0+IFtjb250YWluZXJBLCBjb250YWluZXJDXSxcbiAqICAgcHJvdkcgPT4gW2NvbnRhaW5lckEsIGNvbnRhaW5lckNdLFxuICogICBwcm92QSA9PiBbY29udGFpbmVyQV1cbiAqICAgcHJvdkIgPT4gW2NvbnRhaW5lckFdXG4gKiB9XG4gKiB2aXNpdGVkQ29udGFpbmVycyA9PT0gU2V0IHsgY29udGFpbmVyQiwgY29udGFpbmVyQywgY29udGFpbmVyQSB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcHJvdmlkZXJUb1BhdGggTWFwIG1hcCBvZiBwcm92aWRlcnMgdG8gcGF0aHMgdGhhdCB0aGlzIGZ1bmN0aW9uIGZpbGxzXG4gKiBAcGFyYW0gdmlzaXRlZENvbnRhaW5lcnMgU2V0IGEgc2V0IHRvIGtlZXAgdHJhY2sgb2YgdGhlIGNvbnRhaW5lcnMgd2UndmUgYWxyZWFkeSB2aXNpdGVkXG4gKiBAcmV0dXJuIGZ1bmN0aW9uKHByb3ZpZGVyIFNpbmdsZVByb3ZpZGVyLCBjb250YWluZXI6IFR5cGU8dW5rbm93bj4gfCBJbmplY3RvclR5cGU8dW5rbm93bj4pID0+XG4gKiAgICAgdm9pZFxuICovXG5mdW5jdGlvbiB3YWxrUHJvdmlkZXJUcmVlVG9EaXNjb3ZlckltcG9ydFBhdGhzKFxuICAgIHByb3ZpZGVyVG9QYXRoOiBNYXA8U2luZ2xlUHJvdmlkZXIsIChUeXBlPHVua25vd24+fCBJbmplY3RvclR5cGU8dW5rbm93bj4pW10+LFxuICAgIHZpc2l0ZWRDb250YWluZXJzOiBTZXQ8VHlwZTx1bmtub3duPj4pOlxuICAgIChwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIsIGNvbnRhaW5lcjogVHlwZTx1bmtub3duPnxJbmplY3RvclR5cGU8dW5rbm93bj4pID0+IHZvaWQge1xuICByZXR1cm4gKHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgY29udGFpbmVyOiBUeXBlPHVua25vd24+fEluamVjdG9yVHlwZTx1bmtub3duPikgPT4ge1xuICAgIC8vIElmIHRoZSBwcm92aWRlciBpcyBub3QgYWxyZWFkeSBpbiB0aGUgcHJvdmlkZXJUb1BhdGggbWFwLFxuICAgIC8vIGFkZCBhbiBlbnRyeSB3aXRoIHRoZSBwcm92aWRlciBhcyB0aGUga2V5IGFuZCBhbiBhcnJheSBjb250YWluaW5nIHRoZSBjdXJyZW50IGNvbnRhaW5lciBhc1xuICAgIC8vIHRoZSB2YWx1ZVxuICAgIGlmICghcHJvdmlkZXJUb1BhdGguaGFzKHByb3ZpZGVyKSkge1xuICAgICAgcHJvdmlkZXJUb1BhdGguc2V0KHByb3ZpZGVyLCBbY29udGFpbmVyXSk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBibG9jayB3aWxsIHJ1biBleGFjdGx5IG9uY2UgZm9yIGVhY2ggY29udGFpbmVyIGluIHRoZSBpbXBvcnQgdHJlZS5cbiAgICAvLyBUaGlzIGlzIHdoZXJlIHdlIHJ1biB0aGUgbG9naWMgdG8gY2hlY2sgdGhlIGltcG9ydHMgYXJyYXkgb2YgdGhlIGN1cnJlbnRcbiAgICAvLyBjb250YWluZXIgdG8gc2VlIGlmIGl0J3MgdGhlIG5leHQgY29udGFpbmVyIGluIHRoZSBwYXRoIGZvciBvdXIgY3VycmVudGx5XG4gICAgLy8gZGlzY292ZXJlZCBwcm92aWRlcnMuXG4gICAgaWYgKCF2aXNpdGVkQ29udGFpbmVycy5oYXMoY29udGFpbmVyKSkge1xuICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBwcm92aWRlcnMgd2UndmUgYWxyZWFkeSBzZWVuXG4gICAgICBmb3IgKGNvbnN0IHByb3Ygb2YgcHJvdmlkZXJUb1BhdGgua2V5cygpKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nSW1wb3J0UGF0aCA9IHByb3ZpZGVyVG9QYXRoLmdldChwcm92KSE7XG5cbiAgICAgICAgbGV0IGNvbnRhaW5lckRlZiA9IGdldEluamVjdG9yRGVmKGNvbnRhaW5lcik7XG4gICAgICAgIGlmICghY29udGFpbmVyRGVmKSB7XG4gICAgICAgICAgY29uc3QgbmdNb2R1bGU6IFR5cGU8dW5rbm93bj58dW5kZWZpbmVkID1cbiAgICAgICAgICAgICAgKGNvbnRhaW5lciBhcyBhbnkpLm5nTW9kdWxlIGFzIFR5cGU8dW5rbm93bj58IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb250YWluZXJEZWYgPSBnZXRJbmplY3RvckRlZihuZ01vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNvbnRhaW5lckRlZikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxhc3RDb250YWluZXJBZGRlZFRvUGF0aCA9IGV4aXN0aW5nSW1wb3J0UGF0aFswXTtcblxuICAgICAgICBsZXQgaXNOZXh0U3RlcEluUGF0aCA9IGZhbHNlO1xuICAgICAgICBkZWVwRm9yRWFjaChjb250YWluZXJEZWYuaW1wb3J0cywgKG1vZHVsZUltcG9ydCkgPT4ge1xuICAgICAgICAgIGlmIChpc05leHRTdGVwSW5QYXRoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaXNOZXh0U3RlcEluUGF0aCA9IChtb2R1bGVJbXBvcnQgYXMgYW55KS5uZ01vZHVsZSA9PT0gbGFzdENvbnRhaW5lckFkZGVkVG9QYXRoIHx8XG4gICAgICAgICAgICAgIG1vZHVsZUltcG9ydCA9PT0gbGFzdENvbnRhaW5lckFkZGVkVG9QYXRoO1xuXG4gICAgICAgICAgaWYgKGlzTmV4dFN0ZXBJblBhdGgpIHtcbiAgICAgICAgICAgIHByb3ZpZGVyVG9QYXRoLmdldChwcm92KT8udW5zaGlmdChjb250YWluZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmlzaXRlZENvbnRhaW5lcnMuYWRkKGNvbnRhaW5lcik7XG4gIH07XG59XG5cbi8qKlxuICogR2V0cyB0aGUgcHJvdmlkZXJzIGNvbmZpZ3VyZWQgb24gYW4gRW52aXJvbm1lbnRJbmplY3RvclxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBFbnZpcm9ubWVudEluamVjdG9yXG4gKiBAcmV0dXJucyBhbiBhcnJheSBvZiBvYmplY3RzIHJlcHJlc2VudGluZyB0aGUgcHJvdmlkZXJzIG9mIHRoZSBnaXZlbiBpbmplY3RvclxuICovXG5mdW5jdGlvbiBnZXRFbnZpcm9ubWVudEluamVjdG9yUHJvdmlkZXJzKGluamVjdG9yOiBFbnZpcm9ubWVudEluamVjdG9yKTogUHJvdmlkZXJSZWNvcmRbXSB7XG4gIGNvbnN0IHByb3ZpZGVySW1wb3J0c0NvbnRhaW5lciA9IGdldFByb3ZpZGVySW1wb3J0c0NvbnRhaW5lcihpbmplY3Rvcik7XG4gIGlmIChwcm92aWRlckltcG9ydHNDb250YWluZXIgPT09IG51bGwpIHtcbiAgICB0aHJvd0Vycm9yKCdDb3VsZCBub3QgZGV0ZXJtaW5lIHdoZXJlIGluamVjdG9yIHByb3ZpZGVycyB3ZXJlIGNvbmZpZ3VyZWQuJyk7XG4gIH1cblxuICBjb25zdCBwcm92aWRlclRvUGF0aCA9IGdldFByb3ZpZGVySW1wb3J0UGF0aHMocHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyKTtcbiAgY29uc3QgcHJvdmlkZXJSZWNvcmRzID0gZ2V0RnJhbWV3b3JrRElEZWJ1Z0RhdGEoKS5yZXNvbHZlclRvUHJvdmlkZXJzLmdldChpbmplY3RvcikgPz8gW107XG5cbiAgcmV0dXJuIHByb3ZpZGVyUmVjb3Jkcy5tYXAocHJvdmlkZXJSZWNvcmQgPT4ge1xuICAgIGxldCBpbXBvcnRQYXRoID0gcHJvdmlkZXJUb1BhdGguZ2V0KHByb3ZpZGVyUmVjb3JkLnByb3ZpZGVyKSA/PyBbcHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyXTtcblxuICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZihwcm92aWRlckltcG9ydHNDb250YWluZXIpO1xuICAgIGNvbnN0IGlzU3RhbmRhbG9uZUNvbXBvbmVudCA9ICEhZGVmPy5zdGFuZGFsb25lO1xuICAgIC8vIFdlIHByZXBlbmQgdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvciBpbiB0aGUgc3RhbmRhbG9uZSBjYXNlXG4gICAgLy8gYmVjYXVzZSB3YWxrUHJvdmlkZXJUcmVlIGRvZXMgbm90IHZpc2l0IHRoaXMgY29uc3RydWN0b3IgZHVyaW5nIGl0J3MgdHJhdmVyc2FsXG4gICAgaWYgKGlzU3RhbmRhbG9uZUNvbXBvbmVudCkge1xuICAgICAgaW1wb3J0UGF0aCA9IFtwcm92aWRlckltcG9ydHNDb250YWluZXIsIC4uLnByb3ZpZGVyVG9QYXRoLmdldChwcm92aWRlclJlY29yZC5wcm92aWRlcikgPz8gW11dO1xuICAgIH1cblxuICAgIHJldHVybiB7Li4ucHJvdmlkZXJSZWNvcmQsIGltcG9ydFBhdGh9O1xuICB9KTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBwcm92aWRlcnMgY29uZmlndXJlZCBvbiBhbiBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgdGhlIGluamVjdG9yIHRvIGxvb2t1cCB0aGUgcHJvdmlkZXJzIG9mXG4gKiBAcmV0dXJucyBQcm92aWRlclJlY29yZFtdIGFuIGFycmF5IG9mIG9iamVjdHMgcmVwcmVzZW50aW5nIHRoZSBwcm92aWRlcnMgb2YgdGhlIGdpdmVuIGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3RvclByb3ZpZGVycyhpbmplY3RvcjogSW5qZWN0b3IpOiBQcm92aWRlclJlY29yZFtdIHtcbiAgaWYgKGluamVjdG9yIGluc3RhbmNlb2YgTm9kZUluamVjdG9yKSB7XG4gICAgcmV0dXJuIGdldE5vZGVJbmplY3RvclByb3ZpZGVycyhpbmplY3Rvcik7XG4gIH0gZWxzZSBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBFbnZpcm9ubWVudEluamVjdG9yKSB7XG4gICAgcmV0dXJuIGdldEVudmlyb25tZW50SW5qZWN0b3JQcm92aWRlcnMoaW5qZWN0b3IgYXMgRW52aXJvbm1lbnRJbmplY3Rvcik7XG4gIH1cblxuICB0aHJvd0Vycm9yKCdnZXRJbmplY3RvclByb3ZpZGVycyBvbmx5IHN1cHBvcnRzIE5vZGVJbmplY3RvciBhbmQgRW52aXJvbm1lbnRJbmplY3RvcicpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3JSZXNvbHV0aW9uUGF0aChpbmplY3RvcjogSW5qZWN0b3IpOiBJbmplY3RvcltdIHtcbiAgY29uc3QgcmVzb2x1dGlvblBhdGg6IEluamVjdG9yW10gPSBbaW5qZWN0b3JdO1xuICBnZXRJbmplY3RvclJlc29sdXRpb25QYXRoSGVscGVyKGluamVjdG9yLCByZXNvbHV0aW9uUGF0aCk7XG4gIHJldHVybiByZXNvbHV0aW9uUGF0aDtcbn1cblxuZnVuY3Rpb24gZ2V0SW5qZWN0b3JSZXNvbHV0aW9uUGF0aEhlbHBlcihcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsIHJlc29sdXRpb25QYXRoOiBJbmplY3RvcltdKTogSW5qZWN0b3JbXSB7XG4gIGNvbnN0IHBhcmVudCA9IGdldEluamVjdG9yUGFyZW50KGluamVjdG9yKTtcblxuICAvLyBpZiBnZXRJbmplY3RvclBhcmVudCBjYW4ndCBmaW5kIGEgcGFyZW50LCB0aGVuIHdlJ3ZlIGVpdGhlciByZWFjaGVkIHRoZSBlbmRcbiAgLy8gb2YgdGhlIHBhdGgsIG9yIHdlIG5lZWQgdG8gbW92ZSBmcm9tIHRoZSBFbGVtZW50IEluamVjdG9yIHRyZWUgdG8gdGhlXG4gIC8vIG1vZHVsZSBpbmplY3RvciB0cmVlIHVzaW5nIHRoZSBmaXJzdCBpbmplY3RvciBpbiBvdXIgcGF0aCBhcyB0aGUgY29ubmVjdGlvbiBwb2ludC5cbiAgaWYgKHBhcmVudCA9PT0gbnVsbCkge1xuICAgIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIE5vZGVJbmplY3Rvcikge1xuICAgICAgY29uc3QgZmlyc3RJbmplY3RvciA9IHJlc29sdXRpb25QYXRoWzBdO1xuICAgICAgaWYgKGZpcnN0SW5qZWN0b3IgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3IpIHtcbiAgICAgICAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBnZXRNb2R1bGVJbmplY3Rvck9mTm9kZUluamVjdG9yKGZpcnN0SW5qZWN0b3IpO1xuICAgICAgICBpZiAobW9kdWxlSW5qZWN0b3IgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKCdOb2RlSW5qZWN0b3IgbXVzdCBoYXZlIHNvbWUgY29ubmVjdGlvbiB0byB0aGUgbW9kdWxlIGluamVjdG9yIHRyZWUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdXRpb25QYXRoLnB1c2gobW9kdWxlSW5qZWN0b3IpO1xuICAgICAgICBnZXRJbmplY3RvclJlc29sdXRpb25QYXRoSGVscGVyKG1vZHVsZUluamVjdG9yLCByZXNvbHV0aW9uUGF0aCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXNvbHV0aW9uUGF0aDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmVzb2x1dGlvblBhdGgucHVzaChwYXJlbnQpO1xuICAgIGdldEluamVjdG9yUmVzb2x1dGlvblBhdGhIZWxwZXIocGFyZW50LCByZXNvbHV0aW9uUGF0aCk7XG4gIH1cblxuICByZXR1cm4gcmVzb2x1dGlvblBhdGg7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgcGFyZW50IG9mIGFuIGluamVjdG9yLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgbm90IGFibGUgdG8gbWFrZSB0aGUganVtcCBmcm9tIHRoZSBFbGVtZW50IEluamVjdG9yIFRyZWUgdG8gdGhlIE1vZHVsZVxuICogaW5qZWN0b3IgdHJlZS4gVGhpcyBpcyBiZWNhdXNlIHRoZSBcInBhcmVudFwiICh0aGUgbmV4dCBzdGVwIGluIHRoZSByZW9zbHV0aW9uIHBhdGgpXG4gKiBvZiBhIHJvb3QgTm9kZUluamVjdG9yIGlzIGRlcGVuZGVudCBvbiB3aGljaCBOb2RlSW5qZWN0b3IgYW5jZXN0b3IgaW5pdGlhdGVkXG4gKiB0aGUgREkgbG9va3VwLiBTZWUgZ2V0SW5qZWN0b3JSZXNvbHV0aW9uUGF0aCBmb3IgYSBmdW5jdGlvbiB0aGF0IGNhbiBtYWtlIHRoaXMganVtcC5cbiAqXG4gKiBJbiB0aGUgYmVsb3cgZGlhZ3JhbTpcbiAqIGBgYHRzXG4gKiBnZXRJbmplY3RvclBhcmVudChOb2RlSW5qZWN0b3JCKVxuICogID4gTm9kZUluamVjdG9yQVxuICogZ2V0SW5qZWN0b3JQYXJlbnQoTm9kZUluamVjdG9yQSkgLy8gb3IgZ2V0SW5qZWN0b3JQYXJlbnQoZ2V0SW5qZWN0b3JQYXJlbnQoTm9kZUluamVjdG9yQikpXG4gKiAgPiBudWxsIC8vIGNhbm5vdCBqdW1wIHRvIE1vZHVsZUluamVjdG9yIHRyZWVcbiAqIGBgYFxuICpcbiAqIGBgYFxuICogICAgICAgICAgICAgICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQICAgICAgICAgICAgICAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkFxuICogICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSkTW9kdWxlQeKUnOKUgOKUgOKUgEluamVjdG9y4pSA4pSA4pSA4pSA4pa64pSCRW52aXJvbm1lbnRJbmplY3RvcuKUglxuICogICAg4pSCICAgICAgICAgICDilJTilIDilIDilIDilKzilIDilIDilIDilJggICAgICAgICAgICAgICAg4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYXG4gKiAgICDilIIgICAgICAgICAgICAgICDilIJcbiAqICAgIOKUgiAgICAgICAgICAgYm9vdHN0cmFwc1xuICogICAg4pSCICAgICAgICAgICAgICAg4pSCXG4gKiAgICDilIIgICAgICAgICAgICAgICDilIJcbiAqICAgIOKUgiAgICAgICAgICDilIzilIDilIDilIDilIDilrzilIDilIDilIDilIDilIDilJAgICAgICAgICAgICAgICAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkFxuICogZGVjbGFyZXMgICAgICDilIJDb21wb25lbnRB4pSc4pSA4pSA4pSA4pSASW5qZWN0b3LilIDilIDilIDilIDilrrilIJOb2RlSW5qZWN0b3JB4pSCXG4gKiAgICDilIIgICAgICAgICAg4pSU4pSA4pSA4pSA4pSA4pSs4pSA4pSA4pSA4pSA4pSA4pSYICAgICAgICAgICAgICAgICDilJTilIDilIDilIDilIDilIDilrLilIDilIDilIDilIDilIDilIDilIDilJhcbiAqICAgIOKUgiAgICAgICAgICAgICAgIOKUgiAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCXG4gKiAgICDilIIgICAgICAgICAgICByZW5kZXJzICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50XG4gKiAgICDilIIgICAgICAgICAgICAgICDilIIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUglxuICogICAg4pSCICAgICAgICAgIOKUjOKUgOKUgOKUgOKUgOKWvOKUgOKUgOKUgOKUgOKUgOKUkCAgICAgICAgICAgICAgICAg4pSM4pSA4pSA4pSA4pSA4pSA4pS04pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQXG4gKiAgICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilrrilIJDb21wb25lbnRC4pSc4pSA4pSA4pSA4pSASW5qZWN0b3LilIDilIDilIDilIDilrrilIJOb2RlSW5qZWN0b3JC4pSCXG4gKiAgICAgICAgICAgICAgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCAgICAgICAgICAgICAgICAg4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYXG4gKmBgYFxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBhbiBJbmplY3RvciB0byBnZXQgdGhlIHBhcmVudCBvZlxuICogQHJldHVybnMgSW5qZWN0b3IgdGhlIHBhcmVudCBvZiB0aGUgZ2l2ZW4gaW5qZWN0b3JcbiAqL1xuZnVuY3Rpb24gZ2V0SW5qZWN0b3JQYXJlbnQoaW5qZWN0b3I6IEluamVjdG9yKTogSW5qZWN0b3J8bnVsbCB7XG4gIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIFIzSW5qZWN0b3IpIHtcbiAgICByZXR1cm4gaW5qZWN0b3IucGFyZW50O1xuICB9XG5cbiAgbGV0IHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIGxldCBsVmlldzogTFZpZXc8dW5rbm93bj47XG4gIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIE5vZGVJbmplY3Rvcikge1xuICAgIHROb2RlID0gZ2V0Tm9kZUluamVjdG9yVE5vZGUoaW5qZWN0b3IpO1xuICAgIGxWaWV3ID0gZ2V0Tm9kZUluamVjdG9yTFZpZXcoaW5qZWN0b3IpO1xuICB9IGVsc2UgaWYgKGluamVjdG9yIGluc3RhbmNlb2YgTnVsbEluamVjdG9yKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3dFcnJvcihcbiAgICAgICAgJ2dldEluamVjdG9yUGFyZW50IG9ubHkgc3VwcG9ydCBpbmplY3RvcnMgb2YgdHlwZSBSM0luamVjdG9yLCBOb2RlSW5qZWN0b3IsIE51bGxJbmplY3RvcicpO1xuICB9XG5cbiAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKFxuICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3KTtcblxuICBpZiAoaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jYXRpb24pKSB7XG4gICAgY29uc3QgcGFyZW50SW5qZWN0b3JJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jYXRpb24pO1xuICAgIGNvbnN0IHBhcmVudExWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBsVmlldyk7XG4gICAgY29uc3QgcGFyZW50VFZpZXcgPSBwYXJlbnRMVmlld1tUVklFV107XG4gICAgY29uc3QgcGFyZW50VE5vZGUgPSBwYXJlbnRUVmlldy5kYXRhW3BhcmVudEluamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuVE5PREVdIGFzIFROb2RlO1xuICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKFxuICAgICAgICBwYXJlbnRUTm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgcGFyZW50TFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNoYWluZWRJbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSBhcyBDaGFpbmVkSW5qZWN0b3I7XG5cbiAgICAvLyBDYXNlIHdoZXJlIGNoYWluZWRJbmplY3Rvci5pbmplY3RvciBpcyBhbiBPdXRsZXRJbmplY3RvciBhbmQgY2hhaW5lZEluamVjdG9yLmluamVjdG9yLnBhcmVudFxuICAgIC8vIGlzIGEgTm9kZUluamVjdG9yLlxuICAgIC8vIHRvZG8oYWxla3NhbmRlcmJvZHVycmkpOiBpZGVhbGx5IG5vdGhpbmcgaW4gcGFja2FnZXMvY29yZSBzaG91bGQgZGVhbFxuICAgIC8vIGRpcmVjdGx5IHdpdGggcm91dGVyIGNvbmNlcm5zLiBSZWZhY3RvciB0aGlzIHNvIHRoYXQgd2UgY2FuIG1ha2UgdGhlIGp1bXAgZnJvbVxuICAgIC8vIE5vZGVJbmplY3RvciAtPiBPdXRsZXRJbmplY3RvciAtPiBOb2RlSW5qZWN0b3JcbiAgICAvLyB3aXRob3V0IGV4cGxpY3RseSByZWx5aW5nIG9uIHR5cGVzIGNvbnRyYWN0cyBmcm9tIHBhY2thZ2VzL3JvdXRlclxuICAgIGNvbnN0IGluamVjdG9yUGFyZW50ID0gKGNoYWluZWRJbmplY3Rvci5pbmplY3RvciBhcyBhbnkpPy5wYXJlbnQgYXMgSW5qZWN0b3I7XG5cbiAgICBpZiAoaW5qZWN0b3JQYXJlbnQgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3IpIHtcbiAgICAgIHJldHVybiBpbmplY3RvclBhcmVudDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBtb2R1bGUgaW5qZWN0b3Igb2YgYSBOb2RlSW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIE5vZGVJbmplY3RvciB0byBnZXQgbW9kdWxlIGluamVjdG9yIG9mXG4gKiBAcmV0dXJucyBJbmplY3RvciByZXByZXNlbnRpbmcgbW9kdWxlIGluamVjdG9yIG9mIHRoZSBnaXZlbiBOb2RlSW5qZWN0b3JcbiAqL1xuZnVuY3Rpb24gZ2V0TW9kdWxlSW5qZWN0b3JPZk5vZGVJbmplY3RvcihpbmplY3RvcjogTm9kZUluamVjdG9yKTogSW5qZWN0b3Ige1xuICBsZXQgbFZpZXc6IExWaWV3PHVua25vd24+O1xuICBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3IpIHtcbiAgICBsVmlldyA9IGdldE5vZGVJbmplY3RvckxWaWV3KGluamVjdG9yKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvd0Vycm9yKCdnZXRNb2R1bGVJbmplY3Rvck9mTm9kZUluamVjdG9yIG11c3QgYmUgY2FsbGVkIHdpdGggYSBOb2RlSW5qZWN0b3InKTtcbiAgfVxuXG4gIGNvbnN0IGNoYWluZWRJbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSBhcyBDaGFpbmVkSW5qZWN0b3I7XG4gIGNvbnN0IG1vZHVsZUluamVjdG9yID0gY2hhaW5lZEluamVjdG9yLnBhcmVudEluamVjdG9yO1xuICBpZiAoIW1vZHVsZUluamVjdG9yKSB7XG4gICAgdGhyb3dFcnJvcignTm9kZUluamVjdG9yIG11c3QgaGF2ZSBzb21lIGNvbm5lY3Rpb24gdG8gdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlJyk7XG4gIH1cblxuICByZXR1cm4gbW9kdWxlSW5qZWN0b3I7XG59XG4iXX0=