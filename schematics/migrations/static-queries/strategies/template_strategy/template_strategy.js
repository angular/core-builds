/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy", ["require", "exports", "@angular/compiler-cli", "path", "typescript", "@angular/core/schematics/migrations/static-queries/angular/query-definition"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QueryTemplateStrategy = void 0;
    const compiler_cli_1 = require("@angular/compiler-cli");
    const path_1 = require("path");
    const ts = require("typescript");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
    const QUERY_NOT_DECLARED_IN_COMPONENT_MESSAGE = 'Timing could not be determined. This happens ' +
        'if the query is not declared in any component.';
    class QueryTemplateStrategy {
        constructor(projectPath, classMetadata, host, compilerModule) {
            this.projectPath = projectPath;
            this.classMetadata = classMetadata;
            this.host = host;
            this.compilerModule = compilerModule;
            this.compiler = null;
            this.metadataResolver = null;
            this.analyzedQueries = new Map();
        }
        /**
         * Sets up the template strategy by creating the AngularCompilerProgram. Returns false if
         * the AOT compiler program could not be created due to failure diagnostics.
         */
        setup() {
            const { rootNames, options } = (0, compiler_cli_1.readConfiguration)(this.projectPath);
            // https://github.com/angular/angular/commit/ec4381dd401f03bded652665b047b6b90f2b425f made Ivy
            // the default. This breaks the assumption that "createProgram" from compiler-cli returns the
            // NGC program. In order to ensure that the migration runs properly, we set "enableIvy" to
            // false.
            options.enableIvy = false;
            const aotProgram = (0, compiler_cli_1.createProgram)({ rootNames, options, host: this.host });
            // The "AngularCompilerProgram" does not expose the "AotCompiler" instance, nor does it
            // expose the logic that is necessary to analyze the determined modules. We work around
            // this by just accessing the necessary private properties using the bracket notation.
            this.compiler = aotProgram['compiler'];
            this.metadataResolver = this.compiler['_metadataResolver'];
            // Modify the "DirectiveNormalizer" to not normalize any referenced external stylesheets.
            // This is necessary because in CLI projects preprocessor files are commonly referenced
            // and we don't want to parse them in order to extract relative style references. This
            // breaks the analysis of the project because we instantiate a standalone AOT compiler
            // program which does not contain the custom logic by the Angular CLI Webpack compiler plugin.
            const directiveNormalizer = this.metadataResolver['_directiveNormalizer'];
            directiveNormalizer['_normalizeStylesheet'] = (metadata) => {
                return new this.compilerModule.CompileStylesheetMetadata({ styles: metadata.styles, styleUrls: [], moduleUrl: metadata.moduleUrl });
            };
            // Retrieves the analyzed modules of the current program. This data can be
            // used to determine the timing for registered queries.
            const analyzedModules = aotProgram['analyzedModules'];
            const ngStructuralDiagnostics = aotProgram.getNgStructuralDiagnostics();
            if (ngStructuralDiagnostics.length) {
                throw this._createDiagnosticsError(ngStructuralDiagnostics);
            }
            analyzedModules.files.forEach(file => {
                file.directives.forEach(directive => this._analyzeDirective(directive, analyzedModules));
            });
        }
        /** Analyzes a given directive by determining the timing of all matched view queries. */
        _analyzeDirective(symbol, analyzedModules) {
            const metadata = this.metadataResolver.getDirectiveMetadata(symbol);
            const ngModule = analyzedModules.ngModuleByPipeOrDirective.get(symbol);
            if (!metadata.isComponent || !ngModule) {
                return;
            }
            const parsedTemplate = this._parseTemplate(metadata, ngModule);
            const queryTimingMap = this.findStaticQueryIds(parsedTemplate);
            const { staticQueryIds } = staticViewQueryIds(queryTimingMap);
            metadata.viewQueries.forEach((query, index) => {
                // Query ids are computed by adding "one" to the index. This is done within
                // the "view_compiler.ts" in order to support using a bloom filter for queries.
                const queryId = index + 1;
                const queryKey = this._getViewQueryUniqueKey(symbol.filePath, symbol.name, query.propertyName);
                this.analyzedQueries.set(queryKey, staticQueryIds.has(queryId) ? query_definition_1.QueryTiming.STATIC : query_definition_1.QueryTiming.DYNAMIC);
            });
        }
        /** Detects the timing of the query definition. */
        detectTiming(query) {
            if (query.type === query_definition_1.QueryType.ContentChild) {
                return { timing: null, message: 'Content queries cannot be migrated automatically.' };
            }
            else if (!query.name) {
                // In case the query property name is not statically analyzable, we mark this
                // query as unresolved. NGC currently skips these view queries as well.
                return { timing: null, message: 'Query is not statically analyzable.' };
            }
            const propertyName = query.name;
            const classMetadata = this.classMetadata.get(query.container);
            // In case there is no class metadata or there are no derived classes that
            // could access the current query, we just look for the query analysis of
            // the class that declares the query. e.g. only the template of the class
            // that declares the view query affects the query timing.
            if (!classMetadata || !classMetadata.derivedClasses.length) {
                const timing = this._getQueryTimingFromClass(query.container, propertyName);
                if (timing === null) {
                    return { timing: null, message: QUERY_NOT_DECLARED_IN_COMPONENT_MESSAGE };
                }
                return { timing };
            }
            let resolvedTiming = null;
            let timingMismatch = false;
            // In case there are multiple components that use the same query (e.g. through inheritance),
            // we need to check if all components use the query with the same timing. If that is not
            // the case, the query timing is ambiguous and the developer needs to fix the query manually.
            [query.container, ...classMetadata.derivedClasses].forEach(classDecl => {
                const classTiming = this._getQueryTimingFromClass(classDecl, propertyName);
                if (classTiming === null) {
                    return;
                }
                // In case there is no resolved timing yet, save the new timing. Timings from other
                // components that use the query with a different timing, cause the timing to be
                // mismatched. In that case we can't detect a working timing for all components.
                if (resolvedTiming === null) {
                    resolvedTiming = classTiming;
                }
                else if (resolvedTiming !== classTiming) {
                    timingMismatch = true;
                }
            });
            if (resolvedTiming === null) {
                return { timing: query_definition_1.QueryTiming.DYNAMIC, message: QUERY_NOT_DECLARED_IN_COMPONENT_MESSAGE };
            }
            else if (timingMismatch) {
                return { timing: null, message: 'Multiple components use the query with different timings.' };
            }
            return { timing: resolvedTiming };
        }
        /**
         * Gets the timing that has been resolved for a given query when it's used within the
         * specified class declaration. e.g. queries from an inherited class can be used.
         */
        _getQueryTimingFromClass(classDecl, queryName) {
            if (!classDecl.name) {
                return null;
            }
            const filePath = classDecl.getSourceFile().fileName;
            const queryKey = this._getViewQueryUniqueKey(filePath, classDecl.name.text, queryName);
            if (this.analyzedQueries.has(queryKey)) {
                return this.analyzedQueries.get(queryKey);
            }
            return null;
        }
        _parseTemplate(component, ngModule) {
            return this
                .compiler['_parseTemplate'](component, ngModule, ngModule.transitiveModule.directives)
                .template;
        }
        _createDiagnosticsError(diagnostics) {
            return new Error(ts.formatDiagnostics(diagnostics, this.host));
        }
        _getViewQueryUniqueKey(filePath, className, propName) {
            return `${(0, path_1.resolve)(filePath)}#${className}-${propName}`;
        }
        /** Figures out which queries are static and which ones are dynamic. */
        findStaticQueryIds(nodes, result = new Map()) {
            nodes.forEach((node) => {
                const staticQueryIds = new Set();
                const dynamicQueryIds = new Set();
                let queryMatches = undefined;
                if (node instanceof this.compilerModule.ElementAst) {
                    this.findStaticQueryIds(node.children, result);
                    node.children.forEach((child) => {
                        const childData = result.get(child);
                        childData.staticQueryIds.forEach(queryId => staticQueryIds.add(queryId));
                        childData.dynamicQueryIds.forEach(queryId => dynamicQueryIds.add(queryId));
                    });
                    queryMatches = node.queryMatches;
                }
                else if (node instanceof this.compilerModule.EmbeddedTemplateAst) {
                    this.findStaticQueryIds(node.children, result);
                    node.children.forEach((child) => {
                        const childData = result.get(child);
                        childData.staticQueryIds.forEach(queryId => dynamicQueryIds.add(queryId));
                        childData.dynamicQueryIds.forEach(queryId => dynamicQueryIds.add(queryId));
                    });
                    queryMatches = node.queryMatches;
                }
                if (queryMatches) {
                    queryMatches.forEach((match) => staticQueryIds.add(match.queryId));
                }
                dynamicQueryIds.forEach(queryId => staticQueryIds.delete(queryId));
                result.set(node, { staticQueryIds, dynamicQueryIds });
            });
            return result;
        }
    }
    exports.QueryTemplateStrategy = QueryTemplateStrategy;
    /** Splits queries into static and dynamic. */
    function staticViewQueryIds(nodeStaticQueryIds) {
        const staticQueryIds = new Set();
        const dynamicQueryIds = new Set();
        Array.from(nodeStaticQueryIds.values()).forEach((entry) => {
            entry.staticQueryIds.forEach(queryId => staticQueryIds.add(queryId));
            entry.dynamicQueryIds.forEach(queryId => dynamicQueryIds.add(queryId));
        });
        dynamicQueryIds.forEach(queryId => staticQueryIds.delete(queryId));
        return { staticQueryIds, dynamicQueryIds };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9zdHJhdGVnaWVzL3RlbXBsYXRlX3N0cmF0ZWd5L3RlbXBsYXRlX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUdILHdEQUFtRjtJQUNuRiwrQkFBNkI7SUFDN0IsaUNBQWlDO0lBR2pDLGtIQUF5RjtJQUd6RixNQUFNLHVDQUF1QyxHQUFHLCtDQUErQztRQUMzRixnREFBZ0QsQ0FBQztJQUVyRCxNQUFhLHFCQUFxQjtRQUtoQyxZQUNZLFdBQW1CLEVBQVUsYUFBK0IsRUFDNUQsSUFBcUIsRUFBVSxjQUFrRDtZQURqRixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUFVLGtCQUFhLEdBQWIsYUFBYSxDQUFrQjtZQUM1RCxTQUFJLEdBQUosSUFBSSxDQUFpQjtZQUFVLG1CQUFjLEdBQWQsY0FBYyxDQUFvQztZQU5yRixhQUFRLEdBQXFCLElBQUksQ0FBQztZQUNsQyxxQkFBZ0IsR0FBaUMsSUFBSSxDQUFDO1lBQ3RELG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7UUFJdUMsQ0FBQztRQUVqRzs7O1dBR0c7UUFDSCxLQUFLO1lBQ0gsTUFBTSxFQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUMsR0FBRyxJQUFBLGdDQUFpQixFQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUVqRSw4RkFBOEY7WUFDOUYsNkZBQTZGO1lBQzdGLDBGQUEwRjtZQUMxRixTQUFTO1lBQ1QsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFFMUIsTUFBTSxVQUFVLEdBQUcsSUFBQSw0QkFBYSxFQUFDLEVBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFB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LEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUNwRTtnQkFDRCxlQUFlLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFDLGNBQWMsRUFBRSxlQUFlLEVBQUMsQ0FBQyxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQztLQUNGO0lBM01ELHNEQTJNQztJQU9ELDhDQUE4QztJQUM5QyxTQUFTLGtCQUFrQixDQUFDLGtCQUE4RDtRQUV4RixNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBQ3pDLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFDMUMsS0FBSyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ3hELEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLEtBQUssQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLENBQUMsQ0FBQyxDQUFDO1FBQ0gsZUFBZSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNuRSxPQUFPLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBQyxDQUFDO0lBQzNDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUge0FvdENvbXBpbGVyLCBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsIENvbXBpbGVNZXRhZGF0YVJlc29sdmVyLCBDb21waWxlTmdNb2R1bGVNZXRhZGF0YSwgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YSwgRWxlbWVudEFzdCwgRW1iZWRkZWRUZW1wbGF0ZUFzdCwgTmdBbmFseXplZE1vZHVsZXMsIFF1ZXJ5TWF0Y2gsIFN0YXRpY1N5bWJvbCwgVGVtcGxhdGVBc3R9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7Y3JlYXRlUHJvZ3JhbSwgRGlhZ25vc3RpYywgcmVhZENvbmZpZ3VyYXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaSc7XG5pbXBvcnQge3Jlc29sdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Q2xhc3NNZXRhZGF0YU1hcH0gZnJvbSAnLi4vLi4vYW5ndWxhci9uZ19xdWVyeV92aXNpdG9yJztcbmltcG9ydCB7TmdRdWVyeURlZmluaXRpb24sIFF1ZXJ5VGltaW5nLCBRdWVyeVR5cGV9IGZyb20gJy4uLy4uL2FuZ3VsYXIvcXVlcnktZGVmaW5pdGlvbic7XG5pbXBvcnQge1RpbWluZ1Jlc3VsdCwgVGltaW5nU3RyYXRlZ3l9IGZyb20gJy4uL3RpbWluZy1zdHJhdGVneSc7XG5cbmNvbnN0IFFVRVJZX05PVF9ERUNMQVJFRF9JTl9DT01QT05FTlRfTUVTU0FHRSA9ICdUaW1pbmcgY291bGQgbm90IGJlIGRldGVybWluZWQuIFRoaXMgaGFwcGVucyAnICtcbiAgICAnaWYgdGhlIHF1ZXJ5IGlzIG5vdCBkZWNsYXJlZCBpbiBhbnkgY29tcG9uZW50Lic7XG5cbmV4cG9ydCBjbGFzcyBRdWVyeVRlbXBsYXRlU3RyYXRlZ3kgaW1wbGVtZW50cyBUaW1pbmdTdHJhdGVneSB7XG4gIHByaXZhdGUgY29tcGlsZXI6IEFvdENvbXBpbGVyfG51bGwgPSBudWxsO1xuICBwcml2YXRlIG1ldGFkYXRhUmVzb2x2ZXI6IENvbXBpbGVNZXRhZGF0YVJlc29sdmVyfG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFuYWx5emVkUXVlcmllcyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeVRpbWluZz4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgcHJvamVjdFBhdGg6IHN0cmluZywgcHJpdmF0ZSBjbGFzc01ldGFkYXRhOiBDbGFzc01ldGFkYXRhTWFwLFxuICAgICAgcHJpdmF0ZSBob3N0OiB0cy5Db21waWxlckhvc3QsIHByaXZhdGUgY29tcGlsZXJNb2R1bGU6IHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyJykpIHt9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgdGhlIHRlbXBsYXRlIHN0cmF0ZWd5IGJ5IGNyZWF0aW5nIHRoZSBBbmd1bGFyQ29tcGlsZXJQcm9ncmFtLiBSZXR1cm5zIGZhbHNlIGlmXG4gICAqIHRoZSBBT1QgY29tcGlsZXIgcHJvZ3JhbSBjb3VsZCBub3QgYmUgY3JlYXRlZCBkdWUgdG8gZmFpbHVyZSBkaWFnbm9zdGljcy5cbiAgICovXG4gIHNldHVwKCkge1xuICAgIGNvbnN0IHtyb290TmFtZXMsIG9wdGlvbnN9ID0gcmVhZENvbmZpZ3VyYXRpb24odGhpcy5wcm9qZWN0UGF0aCk7XG5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2NvbW1pdC9lYzQzODFkZDQwMWYwM2JkZWQ2NTI2NjViMDQ3YjZiOTBmMmI0MjVmIG1hZGUgSXZ5XG4gICAgLy8gdGhlIGRlZmF1bHQuIFRoaXMgYnJlYWtzIHRoZSBhc3N1bXB0aW9uIHRoYXQgXCJjcmVhdGVQcm9ncmFtXCIgZnJvbSBjb21waWxlci1jbGkgcmV0dXJucyB0aGVcbiAgICAvLyBOR0MgcHJvZ3JhbS4gSW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgdGhlIG1pZ3JhdGlvbiBydW5zIHByb3Blcmx5LCB3ZSBzZXQgXCJlbmFibGVJdnlcIiB0b1xuICAgIC8vIGZhbHNlLlxuICAgIG9wdGlvbnMuZW5hYmxlSXZ5ID0gZmFsc2U7XG5cbiAgICBjb25zdCBhb3RQcm9ncmFtID0gY3JlYXRlUHJvZ3JhbSh7cm9vdE5hbWVzLCBvcHRpb25zLCBob3N0OiB0aGlzLmhvc3R9KTtcblxuICAgIC8vIFRoZSBcIkFuZ3VsYXJDb21waWxlclByb2dyYW1cIiBkb2VzIG5vdCBleHBvc2UgdGhlIFwiQW90Q29tcGlsZXJcIiBpbnN0YW5jZSwgbm9yIGRvZXMgaXRcbiAgICAvLyBleHBvc2UgdGhlIGxvZ2ljIHRoYXQgaXMgbmVjZXNzYXJ5IHRvIGFuYWx5emUgdGhlIGRldGVybWluZWQgbW9kdWxlcy4gV2Ugd29yayBhcm91bmRcbiAgICAvLyB0aGlzIGJ5IGp1c3QgYWNjZXNzaW5nIHRoZSBuZWNlc3NhcnkgcHJpdmF0ZSBwcm9wZXJ0aWVzIHVzaW5nIHRoZSBicmFja2V0IG5vdGF0aW9uLlxuICAgIHRoaXMuY29tcGlsZXIgPSAoYW90UHJvZ3JhbSBhcyBhbnkpWydjb21waWxlciddO1xuICAgIHRoaXMubWV0YWRhdGFSZXNvbHZlciA9IHRoaXMuY29tcGlsZXIhWydfbWV0YWRhdGFSZXNvbHZlciddO1xuXG4gICAgLy8gTW9kaWZ5IHRoZSBcIkRpcmVjdGl2ZU5vcm1hbGl6ZXJcIiB0byBub3Qgbm9ybWFsaXplIGFueSByZWZlcmVuY2VkIGV4dGVybmFsIHN0eWxlc2hlZXRzLlxuICAgIC8vIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgaW4gQ0xJIHByb2plY3RzIHByZXByb2Nlc3NvciBmaWxlcyBhcmUgY29tbW9ubHkgcmVmZXJlbmNlZFxuICAgIC8vIGFuZCB3ZSBkb24ndCB3YW50IHRvIHBhcnNlIHRoZW0gaW4gb3JkZXIgdG8gZXh0cmFjdCByZWxhdGl2ZSBzdHlsZSByZWZlcmVuY2VzLiBUaGlzXG4gICAgLy8gYnJlYWtzIHRoZSBhbmFseXNpcyBvZiB0aGUgcHJvamVjdCBiZWNhdXNlIHdlIGluc3RhbnRpYXRlIGEgc3RhbmRhbG9uZSBBT1QgY29tcGlsZXJcbiAgICAvLyBwcm9ncmFtIHdoaWNoIGRvZXMgbm90IGNvbnRhaW4gdGhlIGN1c3RvbSBsb2dpYyBieSB0aGUgQW5ndWxhciBDTEkgV2VicGFjayBjb21waWxlciBwbHVnaW4uXG4gICAgY29uc3QgZGlyZWN0aXZlTm9ybWFsaXplciA9IHRoaXMubWV0YWRhdGFSZXNvbHZlciFbJ19kaXJlY3RpdmVOb3JtYWxpemVyJ107XG4gICAgZGlyZWN0aXZlTm9ybWFsaXplclsnX25vcm1hbGl6ZVN0eWxlc2hlZXQnXSA9IChtZXRhZGF0YTogQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YSkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyB0aGlzLmNvbXBpbGVyTW9kdWxlLkNvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEoXG4gICAgICAgICAge3N0eWxlczogbWV0YWRhdGEuc3R5bGVzLCBzdHlsZVVybHM6IFtdLCBtb2R1bGVVcmw6IG1ldGFkYXRhLm1vZHVsZVVybCF9KTtcbiAgICB9O1xuXG4gICAgLy8gUmV0cmlldmVzIHRoZSBhbmFseXplZCBtb2R1bGVzIG9mIHRoZSBjdXJyZW50IHByb2dyYW0uIFRoaXMgZGF0YSBjYW4gYmVcbiAgICAvLyB1c2VkIHRvIGRldGVybWluZSB0aGUgdGltaW5nIGZvciByZWdpc3RlcmVkIHF1ZXJpZXMuXG4gICAgY29uc3QgYW5hbHl6ZWRNb2R1bGVzID0gKGFvdFByb2dyYW0gYXMgYW55KVsnYW5hbHl6ZWRNb2R1bGVzJ10gYXMgTmdBbmFseXplZE1vZHVsZXM7XG5cbiAgICBjb25zdCBuZ1N0cnVjdHVyYWxEaWFnbm9zdGljcyA9IGFvdFByb2dyYW0uZ2V0TmdTdHJ1Y3R1cmFsRGlhZ25vc3RpY3MoKTtcbiAgICBpZiAobmdTdHJ1Y3R1cmFsRGlhZ25vc3RpY3MubGVuZ3RoKSB7XG4gICAgICB0aHJvdyB0aGlzLl9jcmVhdGVEaWFnbm9zdGljc0Vycm9yKG5nU3RydWN0dXJhbERpYWdub3N0aWNzKTtcbiAgICB9XG5cbiAgICBhbmFseXplZE1vZHVsZXMuZmlsZXMuZm9yRWFjaChmaWxlID0+IHtcbiAgICAgIGZpbGUuZGlyZWN0aXZlcy5mb3JFYWNoKGRpcmVjdGl2ZSA9PiB0aGlzLl9hbmFseXplRGlyZWN0aXZlKGRpcmVjdGl2ZSwgYW5hbHl6ZWRNb2R1bGVzKSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQW5hbHl6ZXMgYSBnaXZlbiBkaXJlY3RpdmUgYnkgZGV0ZXJtaW5pbmcgdGhlIHRpbWluZyBvZiBhbGwgbWF0Y2hlZCB2aWV3IHF1ZXJpZXMuICovXG4gIHByaXZhdGUgX2FuYWx5emVEaXJlY3RpdmUoc3ltYm9sOiBTdGF0aWNTeW1ib2wsIGFuYWx5emVkTW9kdWxlczogTmdBbmFseXplZE1vZHVsZXMpIHtcbiAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMubWV0YWRhdGFSZXNvbHZlciEuZ2V0RGlyZWN0aXZlTWV0YWRhdGEoc3ltYm9sKTtcbiAgICBjb25zdCBuZ01vZHVsZSA9IGFuYWx5emVkTW9kdWxlcy5uZ01vZHVsZUJ5UGlwZU9yRGlyZWN0aXZlLmdldChzeW1ib2wpO1xuXG4gICAgaWYgKCFtZXRhZGF0YS5pc0NvbXBvbmVudCB8fCAhbmdNb2R1bGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJzZWRUZW1wbGF0ZSA9IHRoaXMuX3BhcnNlVGVtcGxhdGUobWV0YWRhdGEsIG5nTW9kdWxlKTtcbiAgICBjb25zdCBxdWVyeVRpbWluZ01hcCA9IHRoaXMuZmluZFN0YXRpY1F1ZXJ5SWRzKHBhcnNlZFRlbXBsYXRlKTtcbiAgICBjb25zdCB7c3RhdGljUXVlcnlJZHN9ID0gc3RhdGljVmlld1F1ZXJ5SWRzKHF1ZXJ5VGltaW5nTWFwKTtcblxuICAgIG1ldGFkYXRhLnZpZXdRdWVyaWVzLmZvckVhY2goKHF1ZXJ5LCBpbmRleCkgPT4ge1xuICAgICAgLy8gUXVlcnkgaWRzIGFyZSBjb21wdXRlZCBieSBhZGRpbmcgXCJvbmVcIiB0byB0aGUgaW5kZXguIFRoaXMgaXMgZG9uZSB3aXRoaW5cbiAgICAgIC8vIHRoZSBcInZpZXdfY29tcGlsZXIudHNcIiBpbiBvcmRlciB0byBzdXBwb3J0IHVzaW5nIGEgYmxvb20gZmlsdGVyIGZvciBxdWVyaWVzLlxuICAgICAgY29uc3QgcXVlcnlJZCA9IGluZGV4ICsgMTtcbiAgICAgIGNvbnN0IHF1ZXJ5S2V5ID1cbiAgICAgICAgICB0aGlzLl9nZXRWaWV3UXVlcnlVbmlxdWVLZXkoc3ltYm9sLmZpbGVQYXRoLCBzeW1ib2wubmFtZSwgcXVlcnkucHJvcGVydHlOYW1lKTtcbiAgICAgIHRoaXMuYW5hbHl6ZWRRdWVyaWVzLnNldChcbiAgICAgICAgICBxdWVyeUtleSwgc3RhdGljUXVlcnlJZHMuaGFzKHF1ZXJ5SWQpID8gUXVlcnlUaW1pbmcuU1RBVElDIDogUXVlcnlUaW1pbmcuRFlOQU1JQyk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogRGV0ZWN0cyB0aGUgdGltaW5nIG9mIHRoZSBxdWVyeSBkZWZpbml0aW9uLiAqL1xuICBkZXRlY3RUaW1pbmcocXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uKTogVGltaW5nUmVzdWx0IHtcbiAgICBpZiAocXVlcnkudHlwZSA9PT0gUXVlcnlUeXBlLkNvbnRlbnRDaGlsZCkge1xuICAgICAgcmV0dXJuIHt0aW1pbmc6IG51bGwsIG1lc3NhZ2U6ICdDb250ZW50IHF1ZXJpZXMgY2Fubm90IGJlIG1pZ3JhdGVkIGF1dG9tYXRpY2FsbHkuJ307XG4gICAgfSBlbHNlIGlmICghcXVlcnkubmFtZSkge1xuICAgICAgLy8gSW4gY2FzZSB0aGUgcXVlcnkgcHJvcGVydHkgbmFtZSBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLCB3ZSBtYXJrIHRoaXNcbiAgICAgIC8vIHF1ZXJ5IGFzIHVucmVzb2x2ZWQuIE5HQyBjdXJyZW50bHkgc2tpcHMgdGhlc2UgdmlldyBxdWVyaWVzIGFzIHdlbGwuXG4gICAgICByZXR1cm4ge3RpbWluZzogbnVsbCwgbWVzc2FnZTogJ1F1ZXJ5IGlzIG5vdCBzdGF0aWNhbGx5IGFuYWx5emFibGUuJ307XG4gICAgfVxuXG4gICAgY29uc3QgcHJvcGVydHlOYW1lID0gcXVlcnkubmFtZTtcbiAgICBjb25zdCBjbGFzc01ldGFkYXRhID0gdGhpcy5jbGFzc01ldGFkYXRhLmdldChxdWVyeS5jb250YWluZXIpO1xuXG4gICAgLy8gSW4gY2FzZSB0aGVyZSBpcyBubyBjbGFzcyBtZXRhZGF0YSBvciB0aGVyZSBhcmUgbm8gZGVyaXZlZCBjbGFzc2VzIHRoYXRcbiAgICAvLyBjb3VsZCBhY2Nlc3MgdGhlIGN1cnJlbnQgcXVlcnksIHdlIGp1c3QgbG9vayBmb3IgdGhlIHF1ZXJ5IGFuYWx5c2lzIG9mXG4gICAgLy8gdGhlIGNsYXNzIHRoYXQgZGVjbGFyZXMgdGhlIHF1ZXJ5LiBlLmcuIG9ubHkgdGhlIHRlbXBsYXRlIG9mIHRoZSBjbGFzc1xuICAgIC8vIHRoYXQgZGVjbGFyZXMgdGhlIHZpZXcgcXVlcnkgYWZmZWN0cyB0aGUgcXVlcnkgdGltaW5nLlxuICAgIGlmICghY2xhc3NNZXRhZGF0YSB8fCAhY2xhc3NNZXRhZGF0YS5kZXJpdmVkQ2xhc3Nlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRpbWluZyA9IHRoaXMuX2dldFF1ZXJ5VGltaW5nRnJvbUNsYXNzKHF1ZXJ5LmNvbnRhaW5lciwgcHJvcGVydHlOYW1lKTtcblxuICAgICAgaWYgKHRpbWluZyA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4ge3RpbWluZzogbnVsbCwgbWVzc2FnZTogUVVFUllfTk9UX0RFQ0xBUkVEX0lOX0NPTVBPTkVOVF9NRVNTQUdFfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHt0aW1pbmd9O1xuICAgIH1cblxuICAgIGxldCByZXNvbHZlZFRpbWluZzogUXVlcnlUaW1pbmd8bnVsbCA9IG51bGw7XG4gICAgbGV0IHRpbWluZ01pc21hdGNoID0gZmFsc2U7XG5cbiAgICAvLyBJbiBjYXNlIHRoZXJlIGFyZSBtdWx0aXBsZSBjb21wb25lbnRzIHRoYXQgdXNlIHRoZSBzYW1lIHF1ZXJ5IChlLmcuIHRocm91Z2ggaW5oZXJpdGFuY2UpLFxuICAgIC8vIHdlIG5lZWQgdG8gY2hlY2sgaWYgYWxsIGNvbXBvbmVudHMgdXNlIHRoZSBxdWVyeSB3aXRoIHRoZSBzYW1lIHRpbWluZy4gSWYgdGhhdCBpcyBub3RcbiAgICAvLyB0aGUgY2FzZSwgdGhlIHF1ZXJ5IHRpbWluZyBpcyBhbWJpZ3VvdXMgYW5kIHRoZSBkZXZlbG9wZXIgbmVlZHMgdG8gZml4IHRoZSBxdWVyeSBtYW51YWxseS5cbiAgICBbcXVlcnkuY29udGFpbmVyLCAuLi5jbGFzc01ldGFkYXRhLmRlcml2ZWRDbGFzc2VzXS5mb3JFYWNoKGNsYXNzRGVjbCA9PiB7XG4gICAgICBjb25zdCBjbGFzc1RpbWluZyA9IHRoaXMuX2dldFF1ZXJ5VGltaW5nRnJvbUNsYXNzKGNsYXNzRGVjbCwgcHJvcGVydHlOYW1lKTtcblxuICAgICAgaWYgKGNsYXNzVGltaW5nID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gSW4gY2FzZSB0aGVyZSBpcyBubyByZXNvbHZlZCB0aW1pbmcgeWV0LCBzYXZlIHRoZSBuZXcgdGltaW5nLiBUaW1pbmdzIGZyb20gb3RoZXJcbiAgICAgIC8vIGNvbXBvbmVudHMgdGhhdCB1c2UgdGhlIHF1ZXJ5IHdpdGggYSBkaWZmZXJlbnQgdGltaW5nLCBjYXVzZSB0aGUgdGltaW5nIHRvIGJlXG4gICAgICAvLyBtaXNtYXRjaGVkLiBJbiB0aGF0IGNhc2Ugd2UgY2FuJ3QgZGV0ZWN0IGEgd29ya2luZyB0aW1pbmcgZm9yIGFsbCBjb21wb25lbnRzLlxuICAgICAgaWYgKHJlc29sdmVkVGltaW5nID09PSBudWxsKSB7XG4gICAgICAgIHJlc29sdmVkVGltaW5nID0gY2xhc3NUaW1pbmc7XG4gICAgICB9IGVsc2UgaWYgKHJlc29sdmVkVGltaW5nICE9PSBjbGFzc1RpbWluZykge1xuICAgICAgICB0aW1pbmdNaXNtYXRjaCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAocmVzb2x2ZWRUaW1pbmcgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB7dGltaW5nOiBRdWVyeVRpbWluZy5EWU5BTUlDLCBtZXNzYWdlOiBRVUVSWV9OT1RfREVDTEFSRURfSU5fQ09NUE9ORU5UX01FU1NBR0V9O1xuICAgIH0gZWxzZSBpZiAodGltaW5nTWlzbWF0Y2gpIHtcbiAgICAgIHJldHVybiB7dGltaW5nOiBudWxsLCBtZXNzYWdlOiAnTXVsdGlwbGUgY29tcG9uZW50cyB1c2UgdGhlIHF1ZXJ5IHdpdGggZGlmZmVyZW50IHRpbWluZ3MuJ307XG4gICAgfVxuICAgIHJldHVybiB7dGltaW5nOiByZXNvbHZlZFRpbWluZ307XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdGltaW5nIHRoYXQgaGFzIGJlZW4gcmVzb2x2ZWQgZm9yIGEgZ2l2ZW4gcXVlcnkgd2hlbiBpdCdzIHVzZWQgd2l0aGluIHRoZVxuICAgKiBzcGVjaWZpZWQgY2xhc3MgZGVjbGFyYXRpb24uIGUuZy4gcXVlcmllcyBmcm9tIGFuIGluaGVyaXRlZCBjbGFzcyBjYW4gYmUgdXNlZC5cbiAgICovXG4gIHByaXZhdGUgX2dldFF1ZXJ5VGltaW5nRnJvbUNsYXNzKGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnlOYW1lOiBzdHJpbmcpOiBRdWVyeVRpbWluZ1xuICAgICAgfG51bGwge1xuICAgIGlmICghY2xhc3NEZWNsLm5hbWUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBmaWxlUGF0aCA9IGNsYXNzRGVjbC5nZXRTb3VyY2VGaWxlKCkuZmlsZU5hbWU7XG4gICAgY29uc3QgcXVlcnlLZXkgPSB0aGlzLl9nZXRWaWV3UXVlcnlVbmlxdWVLZXkoZmlsZVBhdGgsIGNsYXNzRGVjbC5uYW1lLnRleHQsIHF1ZXJ5TmFtZSk7XG5cbiAgICBpZiAodGhpcy5hbmFseXplZFF1ZXJpZXMuaGFzKHF1ZXJ5S2V5KSkge1xuICAgICAgcmV0dXJuIHRoaXMuYW5hbHl6ZWRRdWVyaWVzLmdldChxdWVyeUtleSkhO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX3BhcnNlVGVtcGxhdGUoY29tcG9uZW50OiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsIG5nTW9kdWxlOiBDb21waWxlTmdNb2R1bGVNZXRhZGF0YSk6XG4gICAgICBUZW1wbGF0ZUFzdFtdIHtcbiAgICByZXR1cm4gdGhpc1xuICAgICAgICAuY29tcGlsZXIhWydfcGFyc2VUZW1wbGF0ZSddKGNvbXBvbmVudCwgbmdNb2R1bGUsIG5nTW9kdWxlLnRyYW5zaXRpdmVNb2R1bGUuZGlyZWN0aXZlcylcbiAgICAgICAgLnRlbXBsYXRlO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlRGlhZ25vc3RpY3NFcnJvcihkaWFnbm9zdGljczogUmVhZG9ubHlBcnJheTxEaWFnbm9zdGljPikge1xuICAgIHJldHVybiBuZXcgRXJyb3IodHMuZm9ybWF0RGlhZ25vc3RpY3MoZGlhZ25vc3RpY3MgYXMgdHMuRGlhZ25vc3RpY1tdLCB0aGlzLmhvc3QpKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldFZpZXdRdWVyeVVuaXF1ZUtleShmaWxlUGF0aDogc3RyaW5nLCBjbGFzc05hbWU6IHN0cmluZywgcHJvcE5hbWU6IHN0cmluZykge1xuICAgIHJldHVybiBgJHtyZXNvbHZlKGZpbGVQYXRoKX0jJHtjbGFzc05hbWV9LSR7cHJvcE5hbWV9YDtcbiAgfVxuXG4gIC8qKiBGaWd1cmVzIG91dCB3aGljaCBxdWVyaWVzIGFyZSBzdGF0aWMgYW5kIHdoaWNoIG9uZXMgYXJlIGR5bmFtaWMuICovXG4gIHByaXZhdGUgZmluZFN0YXRpY1F1ZXJ5SWRzKFxuICAgICAgbm9kZXM6IFRlbXBsYXRlQXN0W10sIHJlc3VsdCA9IG5ldyBNYXA8VGVtcGxhdGVBc3QsIFN0YXRpY0FuZER5bmFtaWNRdWVyeUlkcz4oKSk6XG4gICAgICBNYXA8VGVtcGxhdGVBc3QsIFN0YXRpY0FuZER5bmFtaWNRdWVyeUlkcz4ge1xuICAgIG5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRpY1F1ZXJ5SWRzID0gbmV3IFNldDxudW1iZXI+KCk7XG4gICAgICBjb25zdCBkeW5hbWljUXVlcnlJZHMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgICAgIGxldCBxdWVyeU1hdGNoZXM6IFF1ZXJ5TWF0Y2hbXSA9IHVuZGVmaW5lZCE7XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIHRoaXMuY29tcGlsZXJNb2R1bGUuRWxlbWVudEFzdCkge1xuICAgICAgICB0aGlzLmZpbmRTdGF0aWNRdWVyeUlkcyhub2RlLmNoaWxkcmVuLCByZXN1bHQpO1xuICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgICAgICAgY29uc3QgY2hpbGREYXRhID0gcmVzdWx0LmdldChjaGlsZCkhO1xuICAgICAgICAgIGNoaWxkRGF0YS5zdGF0aWNRdWVyeUlkcy5mb3JFYWNoKHF1ZXJ5SWQgPT4gc3RhdGljUXVlcnlJZHMuYWRkKHF1ZXJ5SWQpKTtcbiAgICAgICAgICBjaGlsZERhdGEuZHluYW1pY1F1ZXJ5SWRzLmZvckVhY2gocXVlcnlJZCA9PiBkeW5hbWljUXVlcnlJZHMuYWRkKHF1ZXJ5SWQpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHF1ZXJ5TWF0Y2hlcyA9IG5vZGUucXVlcnlNYXRjaGVzO1xuICAgICAgfSBlbHNlIGlmIChub2RlIGluc3RhbmNlb2YgdGhpcy5jb21waWxlck1vZHVsZS5FbWJlZGRlZFRlbXBsYXRlQXN0KSB7XG4gICAgICAgIHRoaXMuZmluZFN0YXRpY1F1ZXJ5SWRzKG5vZGUuY2hpbGRyZW4sIHJlc3VsdCk7XG4gICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICBjb25zdCBjaGlsZERhdGEgPSByZXN1bHQuZ2V0KGNoaWxkKSE7XG4gICAgICAgICAgY2hpbGREYXRhLnN0YXRpY1F1ZXJ5SWRzLmZvckVhY2gocXVlcnlJZCA9PiBkeW5hbWljUXVlcnlJZHMuYWRkKHF1ZXJ5SWQpKTtcbiAgICAgICAgICBjaGlsZERhdGEuZHluYW1pY1F1ZXJ5SWRzLmZvckVhY2gocXVlcnlJZCA9PiBkeW5hbWljUXVlcnlJZHMuYWRkKHF1ZXJ5SWQpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHF1ZXJ5TWF0Y2hlcyA9IG5vZGUucXVlcnlNYXRjaGVzO1xuICAgICAgfVxuICAgICAgaWYgKHF1ZXJ5TWF0Y2hlcykge1xuICAgICAgICBxdWVyeU1hdGNoZXMuZm9yRWFjaCgobWF0Y2gpID0+IHN0YXRpY1F1ZXJ5SWRzLmFkZChtYXRjaC5xdWVyeUlkKSk7XG4gICAgICB9XG4gICAgICBkeW5hbWljUXVlcnlJZHMuZm9yRWFjaChxdWVyeUlkID0+IHN0YXRpY1F1ZXJ5SWRzLmRlbGV0ZShxdWVyeUlkKSk7XG4gICAgICByZXN1bHQuc2V0KG5vZGUsIHtzdGF0aWNRdWVyeUlkcywgZHluYW1pY1F1ZXJ5SWRzfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuXG5pbnRlcmZhY2UgU3RhdGljQW5kRHluYW1pY1F1ZXJ5SWRzIHtcbiAgc3RhdGljUXVlcnlJZHM6IFNldDxudW1iZXI+O1xuICBkeW5hbWljUXVlcnlJZHM6IFNldDxudW1iZXI+O1xufVxuXG4vKiogU3BsaXRzIHF1ZXJpZXMgaW50byBzdGF0aWMgYW5kIGR5bmFtaWMuICovXG5mdW5jdGlvbiBzdGF0aWNWaWV3UXVlcnlJZHMobm9kZVN0YXRpY1F1ZXJ5SWRzOiBNYXA8VGVtcGxhdGVBc3QsIFN0YXRpY0FuZER5bmFtaWNRdWVyeUlkcz4pOlxuICAgIFN0YXRpY0FuZER5bmFtaWNRdWVyeUlkcyB7XG4gIGNvbnN0IHN0YXRpY1F1ZXJ5SWRzID0gbmV3IFNldDxudW1iZXI+KCk7XG4gIGNvbnN0IGR5bmFtaWNRdWVyeUlkcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICBBcnJheS5mcm9tKG5vZGVTdGF0aWNRdWVyeUlkcy52YWx1ZXMoKSkuZm9yRWFjaCgoZW50cnkpID0+IHtcbiAgICBlbnRyeS5zdGF0aWNRdWVyeUlkcy5mb3JFYWNoKHF1ZXJ5SWQgPT4gc3RhdGljUXVlcnlJZHMuYWRkKHF1ZXJ5SWQpKTtcbiAgICBlbnRyeS5keW5hbWljUXVlcnlJZHMuZm9yRWFjaChxdWVyeUlkID0+IGR5bmFtaWNRdWVyeUlkcy5hZGQocXVlcnlJZCkpO1xuICB9KTtcbiAgZHluYW1pY1F1ZXJ5SWRzLmZvckVhY2gocXVlcnlJZCA9PiBzdGF0aWNRdWVyeUlkcy5kZWxldGUocXVlcnlJZCkpO1xuICByZXR1cm4ge3N0YXRpY1F1ZXJ5SWRzLCBkeW5hbWljUXVlcnlJZHN9O1xufVxuIl19