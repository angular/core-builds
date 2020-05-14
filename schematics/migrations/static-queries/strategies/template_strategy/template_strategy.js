/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
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
        define("@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy", ["require", "exports", "@angular/compiler", "@angular/compiler-cli", "path", "typescript", "@angular/core/schematics/migrations/static-queries/angular/query-definition"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QueryTemplateStrategy = void 0;
    const compiler_1 = require("@angular/compiler");
    const compiler_cli_1 = require("@angular/compiler-cli");
    const path_1 = require("path");
    const ts = require("typescript");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
    const QUERY_NOT_DECLARED_IN_COMPONENT_MESSAGE = 'Timing could not be determined. This happens ' +
        'if the query is not declared in any component.';
    class QueryTemplateStrategy {
        constructor(projectPath, classMetadata, host) {
            this.projectPath = projectPath;
            this.classMetadata = classMetadata;
            this.host = host;
            this.compiler = null;
            this.metadataResolver = null;
            this.analyzedQueries = new Map();
        }
        /**
         * Sets up the template strategy by creating the AngularCompilerProgram. Returns false if
         * the AOT compiler program could not be created due to failure diagnostics.
         */
        setup() {
            const { rootNames, options } = compiler_cli_1.readConfiguration(this.projectPath);
            // https://github.com/angular/angular/commit/ec4381dd401f03bded652665b047b6b90f2b425f made Ivy
            // the default. This breaks the assumption that "createProgram" from compiler-cli returns the
            // NGC program. In order to ensure that the migration runs properly, we set "enableIvy" to
            // false.
            options.enableIvy = false;
            const aotProgram = compiler_cli_1.createProgram({ rootNames, options, host: this.host });
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
            directiveNormalizer['_normalizeStylesheet'] = function (metadata) {
                return new compiler_1.CompileStylesheetMetadata({ styles: metadata.styles, styleUrls: [], moduleUrl: metadata.moduleUrl });
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
            const queryTimingMap = findStaticQueryIds(parsedTemplate);
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
            return `${path_1.resolve(filePath)}#${className}-${propName}`;
        }
    }
    exports.QueryTemplateStrategy = QueryTemplateStrategy;
    /** Figures out which queries are static and which ones are dynamic. */
    function findStaticQueryIds(nodes, result = new Map()) {
        nodes.forEach((node) => {
            const staticQueryIds = new Set();
            const dynamicQueryIds = new Set();
            let queryMatches = undefined;
            if (node instanceof compiler_1.ElementAst) {
                findStaticQueryIds(node.children, result);
                node.children.forEach((child) => {
                    const childData = result.get(child);
                    childData.staticQueryIds.forEach(queryId => staticQueryIds.add(queryId));
                    childData.dynamicQueryIds.forEach(queryId => dynamicQueryIds.add(queryId));
                });
                queryMatches = node.queryMatches;
            }
            else if (node instanceof compiler_1.EmbeddedTemplateAst) {
                findStaticQueryIds(node.children, result);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9zdHJhdGVnaWVzL3RlbXBsYXRlX3N0cmF0ZWd5L3RlbXBsYXRlX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGdEQUFnUDtJQUNoUCx3REFBbUY7SUFDbkYsK0JBQTZCO0lBQzdCLGlDQUFpQztJQUdqQyxrSEFBeUY7SUFHekYsTUFBTSx1Q0FBdUMsR0FBRywrQ0FBK0M7UUFDM0YsZ0RBQWdELENBQUM7SUFFckQsTUFBYSxxQkFBcUI7UUFLaEMsWUFDWSxXQUFtQixFQUFVLGFBQStCLEVBQzVELElBQXFCO1lBRHJCLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQVUsa0JBQWEsR0FBYixhQUFhLENBQWtCO1lBQzVELFNBQUksR0FBSixJQUFJLENBQWlCO1lBTnpCLGFBQVEsR0FBcUIsSUFBSSxDQUFDO1lBQ2xDLHFCQUFnQixHQUFpQyxJQUFJLENBQUM7WUFDdEQsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztRQUlyQixDQUFDO1FBRXJDOzs7V0FHRztRQUNILEtBQUs7WUFDSCxNQUFNLEVBQUMsU0FBUyxFQUFFLE9BQU8sRUFBQyxHQUFHLGdDQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUVqRSw4RkFBOEY7WUFDOUYsNkZBQTZGO1lBQzdGLDBGQUEwRjtZQUMxRixTQUFTO1lBQ1QsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFFMUIsTUFBTSxVQUFVLEdBQUcsNEJBQWEsQ0FBQyxFQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDO1lBRXhFLHVG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QUNuRSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFDLGNBQWMsRUFBRSxlQUFlLEVBQUMsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELDhDQUE4QztJQUM5QyxTQUFTLGtCQUFrQixDQUFDLGtCQUE4RDtRQUV4RixNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBQ3pDLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFDMUMsS0FBSyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ3hELEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLEtBQUssQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLENBQUMsQ0FBQyxDQUFDO1FBQ0gsZUFBZSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNuRSxPQUFPLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBQyxDQUFDO0lBQzNDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QW90Q29tcGlsZXIsIENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSwgQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXIsIENvbXBpbGVOZ01vZHVsZU1ldGFkYXRhLCBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhLCBFbGVtZW50QXN0LCBFbWJlZGRlZFRlbXBsYXRlQXN0LCBOZ0FuYWx5emVkTW9kdWxlcywgUXVlcnlNYXRjaCwgU3RhdGljU3ltYm9sLCBUZW1wbGF0ZUFzdH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtjcmVhdGVQcm9ncmFtLCBEaWFnbm9zdGljLCByZWFkQ29uZmlndXJhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJztcbmltcG9ydCB7cmVzb2x2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtDbGFzc01ldGFkYXRhTWFwfSBmcm9tICcuLi8uLi9hbmd1bGFyL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUaW1pbmcsIFF1ZXJ5VHlwZX0gZnJvbSAnLi4vLi4vYW5ndWxhci9xdWVyeS1kZWZpbml0aW9uJztcbmltcG9ydCB7VGltaW5nUmVzdWx0LCBUaW1pbmdTdHJhdGVneX0gZnJvbSAnLi4vdGltaW5nLXN0cmF0ZWd5JztcblxuY29uc3QgUVVFUllfTk9UX0RFQ0xBUkVEX0lOX0NPTVBPTkVOVF9NRVNTQUdFID0gJ1RpbWluZyBjb3VsZCBub3QgYmUgZGV0ZXJtaW5lZC4gVGhpcyBoYXBwZW5zICcgK1xuICAgICdpZiB0aGUgcXVlcnkgaXMgbm90IGRlY2xhcmVkIGluIGFueSBjb21wb25lbnQuJztcblxuZXhwb3J0IGNsYXNzIFF1ZXJ5VGVtcGxhdGVTdHJhdGVneSBpbXBsZW1lbnRzIFRpbWluZ1N0cmF0ZWd5IHtcbiAgcHJpdmF0ZSBjb21waWxlcjogQW90Q29tcGlsZXJ8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbWV0YWRhdGFSZXNvbHZlcjogQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXJ8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYW5hbHl6ZWRRdWVyaWVzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5VGltaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBwcm9qZWN0UGF0aDogc3RyaW5nLCBwcml2YXRlIGNsYXNzTWV0YWRhdGE6IENsYXNzTWV0YWRhdGFNYXAsXG4gICAgICBwcml2YXRlIGhvc3Q6IHRzLkNvbXBpbGVySG9zdCkge31cblxuICAvKipcbiAgICogU2V0cyB1cCB0aGUgdGVtcGxhdGUgc3RyYXRlZ3kgYnkgY3JlYXRpbmcgdGhlIEFuZ3VsYXJDb21waWxlclByb2dyYW0uIFJldHVybnMgZmFsc2UgaWZcbiAgICogdGhlIEFPVCBjb21waWxlciBwcm9ncmFtIGNvdWxkIG5vdCBiZSBjcmVhdGVkIGR1ZSB0byBmYWlsdXJlIGRpYWdub3N0aWNzLlxuICAgKi9cbiAgc2V0dXAoKSB7XG4gICAgY29uc3Qge3Jvb3ROYW1lcywgb3B0aW9uc30gPSByZWFkQ29uZmlndXJhdGlvbih0aGlzLnByb2plY3RQYXRoKTtcblxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvY29tbWl0L2VjNDM4MWRkNDAxZjAzYmRlZDY1MjY2NWIwNDdiNmI5MGYyYjQyNWYgbWFkZSBJdnlcbiAgICAvLyB0aGUgZGVmYXVsdC4gVGhpcyBicmVha3MgdGhlIGFzc3VtcHRpb24gdGhhdCBcImNyZWF0ZVByb2dyYW1cIiBmcm9tIGNvbXBpbGVyLWNsaSByZXR1cm5zIHRoZVxuICAgIC8vIE5HQyBwcm9ncmFtLiBJbiBvcmRlciB0byBlbnN1cmUgdGhhdCB0aGUgbWlncmF0aW9uIHJ1bnMgcHJvcGVybHksIHdlIHNldCBcImVuYWJsZUl2eVwiIHRvXG4gICAgLy8gZmFsc2UuXG4gICAgb3B0aW9ucy5lbmFibGVJdnkgPSBmYWxzZTtcblxuICAgIGNvbnN0IGFvdFByb2dyYW0gPSBjcmVhdGVQcm9ncmFtKHtyb290TmFtZXMsIG9wdGlvbnMsIGhvc3Q6IHRoaXMuaG9zdH0pO1xuXG4gICAgLy8gVGhlIFwiQW5ndWxhckNvbXBpbGVyUHJvZ3JhbVwiIGRvZXMgbm90IGV4cG9zZSB0aGUgXCJBb3RDb21waWxlclwiIGluc3RhbmNlLCBub3IgZG9lcyBpdFxuICAgIC8vIGV4cG9zZSB0aGUgbG9naWMgdGhhdCBpcyBuZWNlc3NhcnkgdG8gYW5hbHl6ZSB0aGUgZGV0ZXJtaW5lZCBtb2R1bGVzLiBXZSB3b3JrIGFyb3VuZFxuICAgIC8vIHRoaXMgYnkganVzdCBhY2Nlc3NpbmcgdGhlIG5lY2Vzc2FyeSBwcml2YXRlIHByb3BlcnRpZXMgdXNpbmcgdGhlIGJyYWNrZXQgbm90YXRpb24uXG4gICAgdGhpcy5jb21waWxlciA9IChhb3RQcm9ncmFtIGFzIGFueSlbJ2NvbXBpbGVyJ107XG4gICAgdGhpcy5tZXRhZGF0YVJlc29sdmVyID0gdGhpcy5jb21waWxlciFbJ19tZXRhZGF0YVJlc29sdmVyJ107XG5cbiAgICAvLyBNb2RpZnkgdGhlIFwiRGlyZWN0aXZlTm9ybWFsaXplclwiIHRvIG5vdCBub3JtYWxpemUgYW55IHJlZmVyZW5jZWQgZXh0ZXJuYWwgc3R5bGVzaGVldHMuXG4gICAgLy8gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBpbiBDTEkgcHJvamVjdHMgcHJlcHJvY2Vzc29yIGZpbGVzIGFyZSBjb21tb25seSByZWZlcmVuY2VkXG4gICAgLy8gYW5kIHdlIGRvbid0IHdhbnQgdG8gcGFyc2UgdGhlbSBpbiBvcmRlciB0byBleHRyYWN0IHJlbGF0aXZlIHN0eWxlIHJlZmVyZW5jZXMuIFRoaXNcbiAgICAvLyBicmVha3MgdGhlIGFuYWx5c2lzIG9mIHRoZSBwcm9qZWN0IGJlY2F1c2Ugd2UgaW5zdGFudGlhdGUgYSBzdGFuZGFsb25lIEFPVCBjb21waWxlclxuICAgIC8vIHByb2dyYW0gd2hpY2ggZG9lcyBub3QgY29udGFpbiB0aGUgY3VzdG9tIGxvZ2ljIGJ5IHRoZSBBbmd1bGFyIENMSSBXZWJwYWNrIGNvbXBpbGVyIHBsdWdpbi5cbiAgICBjb25zdCBkaXJlY3RpdmVOb3JtYWxpemVyID0gdGhpcy5tZXRhZGF0YVJlc29sdmVyIVsnX2RpcmVjdGl2ZU5vcm1hbGl6ZXInXTtcbiAgICBkaXJlY3RpdmVOb3JtYWxpemVyWydfbm9ybWFsaXplU3R5bGVzaGVldCddID0gZnVuY3Rpb24obWV0YWRhdGE6IENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEpIHtcbiAgICAgIHJldHVybiBuZXcgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YShcbiAgICAgICAgICB7c3R5bGVzOiBtZXRhZGF0YS5zdHlsZXMsIHN0eWxlVXJsczogW10sIG1vZHVsZVVybDogbWV0YWRhdGEubW9kdWxlVXJsIX0pO1xuICAgIH07XG5cbiAgICAvLyBSZXRyaWV2ZXMgdGhlIGFuYWx5emVkIG1vZHVsZXMgb2YgdGhlIGN1cnJlbnQgcHJvZ3JhbS4gVGhpcyBkYXRhIGNhbiBiZVxuICAgIC8vIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSB0aW1pbmcgZm9yIHJlZ2lzdGVyZWQgcXVlcmllcy5cbiAgICBjb25zdCBhbmFseXplZE1vZHVsZXMgPSAoYW90UHJvZ3JhbSBhcyBhbnkpWydhbmFseXplZE1vZHVsZXMnXSBhcyBOZ0FuYWx5emVkTW9kdWxlcztcblxuICAgIGNvbnN0IG5nU3RydWN0dXJhbERpYWdub3N0aWNzID0gYW90UHJvZ3JhbS5nZXROZ1N0cnVjdHVyYWxEaWFnbm9zdGljcygpO1xuICAgIGlmIChuZ1N0cnVjdHVyYWxEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IHRoaXMuX2NyZWF0ZURpYWdub3N0aWNzRXJyb3IobmdTdHJ1Y3R1cmFsRGlhZ25vc3RpY3MpO1xuICAgIH1cblxuICAgIGFuYWx5emVkTW9kdWxlcy5maWxlcy5mb3JFYWNoKGZpbGUgPT4ge1xuICAgICAgZmlsZS5kaXJlY3RpdmVzLmZvckVhY2goZGlyZWN0aXZlID0+IHRoaXMuX2FuYWx5emVEaXJlY3RpdmUoZGlyZWN0aXZlLCBhbmFseXplZE1vZHVsZXMpKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBBbmFseXplcyBhIGdpdmVuIGRpcmVjdGl2ZSBieSBkZXRlcm1pbmluZyB0aGUgdGltaW5nIG9mIGFsbCBtYXRjaGVkIHZpZXcgcXVlcmllcy4gKi9cbiAgcHJpdmF0ZSBfYW5hbHl6ZURpcmVjdGl2ZShzeW1ib2w6IFN0YXRpY1N5bWJvbCwgYW5hbHl6ZWRNb2R1bGVzOiBOZ0FuYWx5emVkTW9kdWxlcykge1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5tZXRhZGF0YVJlc29sdmVyIS5nZXREaXJlY3RpdmVNZXRhZGF0YShzeW1ib2wpO1xuICAgIGNvbnN0IG5nTW9kdWxlID0gYW5hbHl6ZWRNb2R1bGVzLm5nTW9kdWxlQnlQaXBlT3JEaXJlY3RpdmUuZ2V0KHN5bWJvbCk7XG5cbiAgICBpZiAoIW1ldGFkYXRhLmlzQ29tcG9uZW50IHx8ICFuZ01vZHVsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBhcnNlZFRlbXBsYXRlID0gdGhpcy5fcGFyc2VUZW1wbGF0ZShtZXRhZGF0YSwgbmdNb2R1bGUpO1xuICAgIGNvbnN0IHF1ZXJ5VGltaW5nTWFwID0gZmluZFN0YXRpY1F1ZXJ5SWRzKHBhcnNlZFRlbXBsYXRlKTtcbiAgICBjb25zdCB7c3RhdGljUXVlcnlJZHN9ID0gc3RhdGljVmlld1F1ZXJ5SWRzKHF1ZXJ5VGltaW5nTWFwKTtcblxuICAgIG1ldGFkYXRhLnZpZXdRdWVyaWVzLmZvckVhY2goKHF1ZXJ5LCBpbmRleCkgPT4ge1xuICAgICAgLy8gUXVlcnkgaWRzIGFyZSBjb21wdXRlZCBieSBhZGRpbmcgXCJvbmVcIiB0byB0aGUgaW5kZXguIFRoaXMgaXMgZG9uZSB3aXRoaW5cbiAgICAgIC8vIHRoZSBcInZpZXdfY29tcGlsZXIudHNcIiBpbiBvcmRlciB0byBzdXBwb3J0IHVzaW5nIGEgYmxvb20gZmlsdGVyIGZvciBxdWVyaWVzLlxuICAgICAgY29uc3QgcXVlcnlJZCA9IGluZGV4ICsgMTtcbiAgICAgIGNvbnN0IHF1ZXJ5S2V5ID1cbiAgICAgICAgICB0aGlzLl9nZXRWaWV3UXVlcnlVbmlxdWVLZXkoc3ltYm9sLmZpbGVQYXRoLCBzeW1ib2wubmFtZSwgcXVlcnkucHJvcGVydHlOYW1lKTtcbiAgICAgIHRoaXMuYW5hbHl6ZWRRdWVyaWVzLnNldChcbiAgICAgICAgICBxdWVyeUtleSwgc3RhdGljUXVlcnlJZHMuaGFzKHF1ZXJ5SWQpID8gUXVlcnlUaW1pbmcuU1RBVElDIDogUXVlcnlUaW1pbmcuRFlOQU1JQyk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogRGV0ZWN0cyB0aGUgdGltaW5nIG9mIHRoZSBxdWVyeSBkZWZpbml0aW9uLiAqL1xuICBkZXRlY3RUaW1pbmcocXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uKTogVGltaW5nUmVzdWx0IHtcbiAgICBpZiAocXVlcnkudHlwZSA9PT0gUXVlcnlUeXBlLkNvbnRlbnRDaGlsZCkge1xuICAgICAgcmV0dXJuIHt0aW1pbmc6IG51bGwsIG1lc3NhZ2U6ICdDb250ZW50IHF1ZXJpZXMgY2Fubm90IGJlIG1pZ3JhdGVkIGF1dG9tYXRpY2FsbHkuJ307XG4gICAgfSBlbHNlIGlmICghcXVlcnkubmFtZSkge1xuICAgICAgLy8gSW4gY2FzZSB0aGUgcXVlcnkgcHJvcGVydHkgbmFtZSBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLCB3ZSBtYXJrIHRoaXNcbiAgICAgIC8vIHF1ZXJ5IGFzIHVucmVzb2x2ZWQuIE5HQyBjdXJyZW50bHkgc2tpcHMgdGhlc2UgdmlldyBxdWVyaWVzIGFzIHdlbGwuXG4gICAgICByZXR1cm4ge3RpbWluZzogbnVsbCwgbWVzc2FnZTogJ1F1ZXJ5IGlzIG5vdCBzdGF0aWNhbGx5IGFuYWx5emFibGUuJ307XG4gICAgfVxuXG4gICAgY29uc3QgcHJvcGVydHlOYW1lID0gcXVlcnkubmFtZTtcbiAgICBjb25zdCBjbGFzc01ldGFkYXRhID0gdGhpcy5jbGFzc01ldGFkYXRhLmdldChxdWVyeS5jb250YWluZXIpO1xuXG4gICAgLy8gSW4gY2FzZSB0aGVyZSBpcyBubyBjbGFzcyBtZXRhZGF0YSBvciB0aGVyZSBhcmUgbm8gZGVyaXZlZCBjbGFzc2VzIHRoYXRcbiAgICAvLyBjb3VsZCBhY2Nlc3MgdGhlIGN1cnJlbnQgcXVlcnksIHdlIGp1c3QgbG9vayBmb3IgdGhlIHF1ZXJ5IGFuYWx5c2lzIG9mXG4gICAgLy8gdGhlIGNsYXNzIHRoYXQgZGVjbGFyZXMgdGhlIHF1ZXJ5LiBlLmcuIG9ubHkgdGhlIHRlbXBsYXRlIG9mIHRoZSBjbGFzc1xuICAgIC8vIHRoYXQgZGVjbGFyZXMgdGhlIHZpZXcgcXVlcnkgYWZmZWN0cyB0aGUgcXVlcnkgdGltaW5nLlxuICAgIGlmICghY2xhc3NNZXRhZGF0YSB8fCAhY2xhc3NNZXRhZGF0YS5kZXJpdmVkQ2xhc3Nlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRpbWluZyA9IHRoaXMuX2dldFF1ZXJ5VGltaW5nRnJvbUNsYXNzKHF1ZXJ5LmNvbnRhaW5lciwgcHJvcGVydHlOYW1lKTtcblxuICAgICAgaWYgKHRpbWluZyA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4ge3RpbWluZzogbnVsbCwgbWVzc2FnZTogUVVFUllfTk9UX0RFQ0xBUkVEX0lOX0NPTVBPTkVOVF9NRVNTQUdFfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHt0aW1pbmd9O1xuICAgIH1cblxuICAgIGxldCByZXNvbHZlZFRpbWluZzogUXVlcnlUaW1pbmd8bnVsbCA9IG51bGw7XG4gICAgbGV0IHRpbWluZ01pc21hdGNoID0gZmFsc2U7XG5cbiAgICAvLyBJbiBjYXNlIHRoZXJlIGFyZSBtdWx0aXBsZSBjb21wb25lbnRzIHRoYXQgdXNlIHRoZSBzYW1lIHF1ZXJ5IChlLmcuIHRocm91Z2ggaW5oZXJpdGFuY2UpLFxuICAgIC8vIHdlIG5lZWQgdG8gY2hlY2sgaWYgYWxsIGNvbXBvbmVudHMgdXNlIHRoZSBxdWVyeSB3aXRoIHRoZSBzYW1lIHRpbWluZy4gSWYgdGhhdCBpcyBub3RcbiAgICAvLyB0aGUgY2FzZSwgdGhlIHF1ZXJ5IHRpbWluZyBpcyBhbWJpZ3VvdXMgYW5kIHRoZSBkZXZlbG9wZXIgbmVlZHMgdG8gZml4IHRoZSBxdWVyeSBtYW51YWxseS5cbiAgICBbcXVlcnkuY29udGFpbmVyLCAuLi5jbGFzc01ldGFkYXRhLmRlcml2ZWRDbGFzc2VzXS5mb3JFYWNoKGNsYXNzRGVjbCA9PiB7XG4gICAgICBjb25zdCBjbGFzc1RpbWluZyA9IHRoaXMuX2dldFF1ZXJ5VGltaW5nRnJvbUNsYXNzKGNsYXNzRGVjbCwgcHJvcGVydHlOYW1lKTtcblxuICAgICAgaWYgKGNsYXNzVGltaW5nID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gSW4gY2FzZSB0aGVyZSBpcyBubyByZXNvbHZlZCB0aW1pbmcgeWV0LCBzYXZlIHRoZSBuZXcgdGltaW5nLiBUaW1pbmdzIGZyb20gb3RoZXJcbiAgICAgIC8vIGNvbXBvbmVudHMgdGhhdCB1c2UgdGhlIHF1ZXJ5IHdpdGggYSBkaWZmZXJlbnQgdGltaW5nLCBjYXVzZSB0aGUgdGltaW5nIHRvIGJlXG4gICAgICAvLyBtaXNtYXRjaGVkLiBJbiB0aGF0IGNhc2Ugd2UgY2FuJ3QgZGV0ZWN0IGEgd29ya2luZyB0aW1pbmcgZm9yIGFsbCBjb21wb25lbnRzLlxuICAgICAgaWYgKHJlc29sdmVkVGltaW5nID09PSBudWxsKSB7XG4gICAgICAgIHJlc29sdmVkVGltaW5nID0gY2xhc3NUaW1pbmc7XG4gICAgICB9IGVsc2UgaWYgKHJlc29sdmVkVGltaW5nICE9PSBjbGFzc1RpbWluZykge1xuICAgICAgICB0aW1pbmdNaXNtYXRjaCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAocmVzb2x2ZWRUaW1pbmcgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB7dGltaW5nOiBRdWVyeVRpbWluZy5EWU5BTUlDLCBtZXNzYWdlOiBRVUVSWV9OT1RfREVDTEFSRURfSU5fQ09NUE9ORU5UX01FU1NBR0V9O1xuICAgIH0gZWxzZSBpZiAodGltaW5nTWlzbWF0Y2gpIHtcbiAgICAgIHJldHVybiB7dGltaW5nOiBudWxsLCBtZXNzYWdlOiAnTXVsdGlwbGUgY29tcG9uZW50cyB1c2UgdGhlIHF1ZXJ5IHdpdGggZGlmZmVyZW50IHRpbWluZ3MuJ307XG4gICAgfVxuICAgIHJldHVybiB7dGltaW5nOiByZXNvbHZlZFRpbWluZ307XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdGltaW5nIHRoYXQgaGFzIGJlZW4gcmVzb2x2ZWQgZm9yIGEgZ2l2ZW4gcXVlcnkgd2hlbiBpdCdzIHVzZWQgd2l0aGluIHRoZVxuICAgKiBzcGVjaWZpZWQgY2xhc3MgZGVjbGFyYXRpb24uIGUuZy4gcXVlcmllcyBmcm9tIGFuIGluaGVyaXRlZCBjbGFzcyBjYW4gYmUgdXNlZC5cbiAgICovXG4gIHByaXZhdGUgX2dldFF1ZXJ5VGltaW5nRnJvbUNsYXNzKGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnlOYW1lOiBzdHJpbmcpOiBRdWVyeVRpbWluZ1xuICAgICAgfG51bGwge1xuICAgIGlmICghY2xhc3NEZWNsLm5hbWUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBmaWxlUGF0aCA9IGNsYXNzRGVjbC5nZXRTb3VyY2VGaWxlKCkuZmlsZU5hbWU7XG4gICAgY29uc3QgcXVlcnlLZXkgPSB0aGlzLl9nZXRWaWV3UXVlcnlVbmlxdWVLZXkoZmlsZVBhdGgsIGNsYXNzRGVjbC5uYW1lLnRleHQsIHF1ZXJ5TmFtZSk7XG5cbiAgICBpZiAodGhpcy5hbmFseXplZFF1ZXJpZXMuaGFzKHF1ZXJ5S2V5KSkge1xuICAgICAgcmV0dXJuIHRoaXMuYW5hbHl6ZWRRdWVyaWVzLmdldChxdWVyeUtleSkhO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX3BhcnNlVGVtcGxhdGUoY29tcG9uZW50OiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsIG5nTW9kdWxlOiBDb21waWxlTmdNb2R1bGVNZXRhZGF0YSk6XG4gICAgICBUZW1wbGF0ZUFzdFtdIHtcbiAgICByZXR1cm4gdGhpc1xuICAgICAgICAuY29tcGlsZXIhWydfcGFyc2VUZW1wbGF0ZSddKGNvbXBvbmVudCwgbmdNb2R1bGUsIG5nTW9kdWxlLnRyYW5zaXRpdmVNb2R1bGUuZGlyZWN0aXZlcylcbiAgICAgICAgLnRlbXBsYXRlO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlRGlhZ25vc3RpY3NFcnJvcihkaWFnbm9zdGljczogUmVhZG9ubHlBcnJheTxEaWFnbm9zdGljPikge1xuICAgIHJldHVybiBuZXcgRXJyb3IodHMuZm9ybWF0RGlhZ25vc3RpY3MoZGlhZ25vc3RpY3MgYXMgdHMuRGlhZ25vc3RpY1tdLCB0aGlzLmhvc3QpKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldFZpZXdRdWVyeVVuaXF1ZUtleShmaWxlUGF0aDogc3RyaW5nLCBjbGFzc05hbWU6IHN0cmluZywgcHJvcE5hbWU6IHN0cmluZykge1xuICAgIHJldHVybiBgJHtyZXNvbHZlKGZpbGVQYXRoKX0jJHtjbGFzc05hbWV9LSR7cHJvcE5hbWV9YDtcbiAgfVxufVxuXG5pbnRlcmZhY2UgU3RhdGljQW5kRHluYW1pY1F1ZXJ5SWRzIHtcbiAgc3RhdGljUXVlcnlJZHM6IFNldDxudW1iZXI+O1xuICBkeW5hbWljUXVlcnlJZHM6IFNldDxudW1iZXI+O1xufVxuXG4vKiogRmlndXJlcyBvdXQgd2hpY2ggcXVlcmllcyBhcmUgc3RhdGljIGFuZCB3aGljaCBvbmVzIGFyZSBkeW5hbWljLiAqL1xuZnVuY3Rpb24gZmluZFN0YXRpY1F1ZXJ5SWRzKFxuICAgIG5vZGVzOiBUZW1wbGF0ZUFzdFtdLCByZXN1bHQgPSBuZXcgTWFwPFRlbXBsYXRlQXN0LCBTdGF0aWNBbmREeW5hbWljUXVlcnlJZHM+KCkpOlxuICAgIE1hcDxUZW1wbGF0ZUFzdCwgU3RhdGljQW5kRHluYW1pY1F1ZXJ5SWRzPiB7XG4gIG5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICBjb25zdCBzdGF0aWNRdWVyeUlkcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICAgIGNvbnN0IGR5bmFtaWNRdWVyeUlkcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICAgIGxldCBxdWVyeU1hdGNoZXM6IFF1ZXJ5TWF0Y2hbXSA9IHVuZGVmaW5lZCE7XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50QXN0KSB7XG4gICAgICBmaW5kU3RhdGljUXVlcnlJZHMobm9kZS5jaGlsZHJlbiwgcmVzdWx0KTtcbiAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgY29uc3QgY2hpbGREYXRhID0gcmVzdWx0LmdldChjaGlsZCkhO1xuICAgICAgICBjaGlsZERhdGEuc3RhdGljUXVlcnlJZHMuZm9yRWFjaChxdWVyeUlkID0+IHN0YXRpY1F1ZXJ5SWRzLmFkZChxdWVyeUlkKSk7XG4gICAgICAgIGNoaWxkRGF0YS5keW5hbWljUXVlcnlJZHMuZm9yRWFjaChxdWVyeUlkID0+IGR5bmFtaWNRdWVyeUlkcy5hZGQocXVlcnlJZCkpO1xuICAgICAgfSk7XG4gICAgICBxdWVyeU1hdGNoZXMgPSBub2RlLnF1ZXJ5TWF0Y2hlcztcbiAgICB9IGVsc2UgaWYgKG5vZGUgaW5zdGFuY2VvZiBFbWJlZGRlZFRlbXBsYXRlQXN0KSB7XG4gICAgICBmaW5kU3RhdGljUXVlcnlJZHMobm9kZS5jaGlsZHJlbiwgcmVzdWx0KTtcbiAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgY29uc3QgY2hpbGREYXRhID0gcmVzdWx0LmdldChjaGlsZCkhO1xuICAgICAgICBjaGlsZERhdGEuc3RhdGljUXVlcnlJZHMuZm9yRWFjaChxdWVyeUlkID0+IGR5bmFtaWNRdWVyeUlkcy5hZGQocXVlcnlJZCkpO1xuICAgICAgICBjaGlsZERhdGEuZHluYW1pY1F1ZXJ5SWRzLmZvckVhY2gocXVlcnlJZCA9PiBkeW5hbWljUXVlcnlJZHMuYWRkKHF1ZXJ5SWQpKTtcbiAgICAgIH0pO1xuICAgICAgcXVlcnlNYXRjaGVzID0gbm9kZS5xdWVyeU1hdGNoZXM7XG4gICAgfVxuICAgIGlmIChxdWVyeU1hdGNoZXMpIHtcbiAgICAgIHF1ZXJ5TWF0Y2hlcy5mb3JFYWNoKChtYXRjaCkgPT4gc3RhdGljUXVlcnlJZHMuYWRkKG1hdGNoLnF1ZXJ5SWQpKTtcbiAgICB9XG4gICAgZHluYW1pY1F1ZXJ5SWRzLmZvckVhY2gocXVlcnlJZCA9PiBzdGF0aWNRdWVyeUlkcy5kZWxldGUocXVlcnlJZCkpO1xuICAgIHJlc3VsdC5zZXQobm9kZSwge3N0YXRpY1F1ZXJ5SWRzLCBkeW5hbWljUXVlcnlJZHN9KTtcbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKiBTcGxpdHMgcXVlcmllcyBpbnRvIHN0YXRpYyBhbmQgZHluYW1pYy4gKi9cbmZ1bmN0aW9uIHN0YXRpY1ZpZXdRdWVyeUlkcyhub2RlU3RhdGljUXVlcnlJZHM6IE1hcDxUZW1wbGF0ZUFzdCwgU3RhdGljQW5kRHluYW1pY1F1ZXJ5SWRzPik6XG4gICAgU3RhdGljQW5kRHluYW1pY1F1ZXJ5SWRzIHtcbiAgY29uc3Qgc3RhdGljUXVlcnlJZHMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgY29uc3QgZHluYW1pY1F1ZXJ5SWRzID0gbmV3IFNldDxudW1iZXI+KCk7XG4gIEFycmF5LmZyb20obm9kZVN0YXRpY1F1ZXJ5SWRzLnZhbHVlcygpKS5mb3JFYWNoKChlbnRyeSkgPT4ge1xuICAgIGVudHJ5LnN0YXRpY1F1ZXJ5SWRzLmZvckVhY2gocXVlcnlJZCA9PiBzdGF0aWNRdWVyeUlkcy5hZGQocXVlcnlJZCkpO1xuICAgIGVudHJ5LmR5bmFtaWNRdWVyeUlkcy5mb3JFYWNoKHF1ZXJ5SWQgPT4gZHluYW1pY1F1ZXJ5SWRzLmFkZChxdWVyeUlkKSk7XG4gIH0pO1xuICBkeW5hbWljUXVlcnlJZHMuZm9yRWFjaChxdWVyeUlkID0+IHN0YXRpY1F1ZXJ5SWRzLmRlbGV0ZShxdWVyeUlkKSk7XG4gIHJldHVybiB7c3RhdGljUXVlcnlJZHMsIGR5bmFtaWNRdWVyeUlkc307XG59XG4iXX0=