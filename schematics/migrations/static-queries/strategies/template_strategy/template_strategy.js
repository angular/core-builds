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
            const queryTimingMap = compiler_1.findStaticQueryIds(parsedTemplate);
            const { staticQueryIds } = compiler_1.staticViewQueryIds(queryTimingMap);
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9zdHJhdGVnaWVzL3RlbXBsYXRlX3N0cmF0ZWd5L3RlbXBsYXRlX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsZ0RBQTJPO0lBQzNPLHdEQUFtRjtJQUNuRiwrQkFBNkI7SUFDN0IsaUNBQWlDO0lBR2pDLGtIQUF5RjtJQUd6RixNQUFNLHVDQUF1QyxHQUFHLCtDQUErQztRQUMzRixnREFBZ0QsQ0FBQztJQUVyRCxNQUFhLHFCQUFxQjtRQUtoQyxZQUNZLFdBQW1CLEVBQVUsYUFBK0IsRUFDNUQsSUFBcUI7WUFEckIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFBVSxrQkFBYSxHQUFiLGFBQWEsQ0FBa0I7WUFDNUQsU0FBSSxHQUFKLElBQUksQ0FBaUI7WUFOekIsYUFBUSxHQUFxQixJQUFJLENBQUM7WUFDbEMscUJBQWdCLEdBQWlDLElBQUksQ0FBQztZQUN0RCxvQkFBZSxHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1FBSXJCLENBQUM7UUFFckM7OztXQUdHO1FBQ0gsS0FBSztZQUNILE1BQU0sRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLEdBQUcsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRWpFLDhGQUE4RjtZQUM5Riw2RkFBNkY7WUFDN0YsMEZBQTBGO1lBQzFGLFNBQVM7WUFDVCxPQUFPLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztZQUUxQixNQUFNLFVBQVUsR0FBRyw0QkFBYSxDQUFDLEVBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBQyxDQUFDLENBQUM7WUFFeEUsdUZB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LENBQUM7UUFDZCxDQUFDO1FBRU8sY0FBYyxDQUFDLFNBQW1DLEVBQUUsUUFBaUM7WUFFM0YsT0FBTyxJQUFJO2lCQUNOLFFBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQztpQkFDdkYsUUFBUSxDQUFDO1FBQ2hCLENBQUM7UUFFTyx1QkFBdUIsQ0FBQyxXQUFzQztZQUNwRSxPQUFPLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxXQUE4QixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3BGLENBQUM7UUFFTyxzQkFBc0IsQ0FBQyxRQUFnQixFQUFFLFNBQWlCLEVBQUUsUUFBZ0I7WUFDbEYsT0FBTyxHQUFHLGNBQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxTQUFTLElBQUksUUFBUSxFQUFFLENBQUM7UUFDekQsQ0FBQztLQUNGO0lBektELHNEQXlLQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBb3RDb21waWxlciwgQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLCBDb21waWxlTWV0YWRhdGFSZXNvbHZlciwgQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGEsIENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEsIE5nQW5hbHl6ZWRNb2R1bGVzLCBTdGF0aWNTeW1ib2wsIFRlbXBsYXRlQXN0LCBmaW5kU3RhdGljUXVlcnlJZHMsIHN0YXRpY1ZpZXdRdWVyeUlkc30gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtEaWFnbm9zdGljLCBjcmVhdGVQcm9ncmFtLCByZWFkQ29uZmlndXJhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJztcbmltcG9ydCB7cmVzb2x2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtDbGFzc01ldGFkYXRhTWFwfSBmcm9tICcuLi8uLi9hbmd1bGFyL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUaW1pbmcsIFF1ZXJ5VHlwZX0gZnJvbSAnLi4vLi4vYW5ndWxhci9xdWVyeS1kZWZpbml0aW9uJztcbmltcG9ydCB7VGltaW5nUmVzdWx0LCBUaW1pbmdTdHJhdGVneX0gZnJvbSAnLi4vdGltaW5nLXN0cmF0ZWd5JztcblxuY29uc3QgUVVFUllfTk9UX0RFQ0xBUkVEX0lOX0NPTVBPTkVOVF9NRVNTQUdFID0gJ1RpbWluZyBjb3VsZCBub3QgYmUgZGV0ZXJtaW5lZC4gVGhpcyBoYXBwZW5zICcgK1xuICAgICdpZiB0aGUgcXVlcnkgaXMgbm90IGRlY2xhcmVkIGluIGFueSBjb21wb25lbnQuJztcblxuZXhwb3J0IGNsYXNzIFF1ZXJ5VGVtcGxhdGVTdHJhdGVneSBpbXBsZW1lbnRzIFRpbWluZ1N0cmF0ZWd5IHtcbiAgcHJpdmF0ZSBjb21waWxlcjogQW90Q29tcGlsZXJ8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbWV0YWRhdGFSZXNvbHZlcjogQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXJ8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYW5hbHl6ZWRRdWVyaWVzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5VGltaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBwcm9qZWN0UGF0aDogc3RyaW5nLCBwcml2YXRlIGNsYXNzTWV0YWRhdGE6IENsYXNzTWV0YWRhdGFNYXAsXG4gICAgICBwcml2YXRlIGhvc3Q6IHRzLkNvbXBpbGVySG9zdCkge31cblxuICAvKipcbiAgICogU2V0cyB1cCB0aGUgdGVtcGxhdGUgc3RyYXRlZ3kgYnkgY3JlYXRpbmcgdGhlIEFuZ3VsYXJDb21waWxlclByb2dyYW0uIFJldHVybnMgZmFsc2UgaWZcbiAgICogdGhlIEFPVCBjb21waWxlciBwcm9ncmFtIGNvdWxkIG5vdCBiZSBjcmVhdGVkIGR1ZSB0byBmYWlsdXJlIGRpYWdub3N0aWNzLlxuICAgKi9cbiAgc2V0dXAoKSB7XG4gICAgY29uc3Qge3Jvb3ROYW1lcywgb3B0aW9uc30gPSByZWFkQ29uZmlndXJhdGlvbih0aGlzLnByb2plY3RQYXRoKTtcblxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvY29tbWl0L2VjNDM4MWRkNDAxZjAzYmRlZDY1MjY2NWIwNDdiNmI5MGYyYjQyNWYgbWFkZSBJdnlcbiAgICAvLyB0aGUgZGVmYXVsdC4gVGhpcyBicmVha3MgdGhlIGFzc3VtcHRpb24gdGhhdCBcImNyZWF0ZVByb2dyYW1cIiBmcm9tIGNvbXBpbGVyLWNsaSByZXR1cm5zIHRoZVxuICAgIC8vIE5HQyBwcm9ncmFtLiBJbiBvcmRlciB0byBlbnN1cmUgdGhhdCB0aGUgbWlncmF0aW9uIHJ1bnMgcHJvcGVybHksIHdlIHNldCBcImVuYWJsZUl2eVwiIHRvXG4gICAgLy8gZmFsc2UuXG4gICAgb3B0aW9ucy5lbmFibGVJdnkgPSBmYWxzZTtcblxuICAgIGNvbnN0IGFvdFByb2dyYW0gPSBjcmVhdGVQcm9ncmFtKHtyb290TmFtZXMsIG9wdGlvbnMsIGhvc3Q6IHRoaXMuaG9zdH0pO1xuXG4gICAgLy8gVGhlIFwiQW5ndWxhckNvbXBpbGVyUHJvZ3JhbVwiIGRvZXMgbm90IGV4cG9zZSB0aGUgXCJBb3RDb21waWxlclwiIGluc3RhbmNlLCBub3IgZG9lcyBpdFxuICAgIC8vIGV4cG9zZSB0aGUgbG9naWMgdGhhdCBpcyBuZWNlc3NhcnkgdG8gYW5hbHl6ZSB0aGUgZGV0ZXJtaW5lZCBtb2R1bGVzLiBXZSB3b3JrIGFyb3VuZFxuICAgIC8vIHRoaXMgYnkganVzdCBhY2Nlc3NpbmcgdGhlIG5lY2Vzc2FyeSBwcml2YXRlIHByb3BlcnRpZXMgdXNpbmcgdGhlIGJyYWNrZXQgbm90YXRpb24uXG4gICAgdGhpcy5jb21waWxlciA9IChhb3RQcm9ncmFtIGFzIGFueSlbJ2NvbXBpbGVyJ107XG4gICAgdGhpcy5tZXRhZGF0YVJlc29sdmVyID0gdGhpcy5jb21waWxlciAhWydfbWV0YWRhdGFSZXNvbHZlciddO1xuXG4gICAgLy8gTW9kaWZ5IHRoZSBcIkRpcmVjdGl2ZU5vcm1hbGl6ZXJcIiB0byBub3Qgbm9ybWFsaXplIGFueSByZWZlcmVuY2VkIGV4dGVybmFsIHN0eWxlc2hlZXRzLlxuICAgIC8vIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgaW4gQ0xJIHByb2plY3RzIHByZXByb2Nlc3NvciBmaWxlcyBhcmUgY29tbW9ubHkgcmVmZXJlbmNlZFxuICAgIC8vIGFuZCB3ZSBkb24ndCB3YW50IHRvIHBhcnNlIHRoZW0gaW4gb3JkZXIgdG8gZXh0cmFjdCByZWxhdGl2ZSBzdHlsZSByZWZlcmVuY2VzLiBUaGlzXG4gICAgLy8gYnJlYWtzIHRoZSBhbmFseXNpcyBvZiB0aGUgcHJvamVjdCBiZWNhdXNlIHdlIGluc3RhbnRpYXRlIGEgc3RhbmRhbG9uZSBBT1QgY29tcGlsZXJcbiAgICAvLyBwcm9ncmFtIHdoaWNoIGRvZXMgbm90IGNvbnRhaW4gdGhlIGN1c3RvbSBsb2dpYyBieSB0aGUgQW5ndWxhciBDTEkgV2VicGFjayBjb21waWxlciBwbHVnaW4uXG4gICAgY29uc3QgZGlyZWN0aXZlTm9ybWFsaXplciA9IHRoaXMubWV0YWRhdGFSZXNvbHZlciAhWydfZGlyZWN0aXZlTm9ybWFsaXplciddO1xuICAgIGRpcmVjdGl2ZU5vcm1hbGl6ZXJbJ19ub3JtYWxpemVTdHlsZXNoZWV0J10gPSBmdW5jdGlvbihtZXRhZGF0YTogQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YSkge1xuICAgICAgcmV0dXJuIG5ldyBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhKFxuICAgICAgICAgIHtzdHlsZXM6IG1ldGFkYXRhLnN0eWxlcywgc3R5bGVVcmxzOiBbXSwgbW9kdWxlVXJsOiBtZXRhZGF0YS5tb2R1bGVVcmwgIX0pO1xuICAgIH07XG5cbiAgICAvLyBSZXRyaWV2ZXMgdGhlIGFuYWx5emVkIG1vZHVsZXMgb2YgdGhlIGN1cnJlbnQgcHJvZ3JhbS4gVGhpcyBkYXRhIGNhbiBiZVxuICAgIC8vIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSB0aW1pbmcgZm9yIHJlZ2lzdGVyZWQgcXVlcmllcy5cbiAgICBjb25zdCBhbmFseXplZE1vZHVsZXMgPSAoYW90UHJvZ3JhbSBhcyBhbnkpWydhbmFseXplZE1vZHVsZXMnXSBhcyBOZ0FuYWx5emVkTW9kdWxlcztcblxuICAgIGNvbnN0IG5nU3RydWN0dXJhbERpYWdub3N0aWNzID0gYW90UHJvZ3JhbS5nZXROZ1N0cnVjdHVyYWxEaWFnbm9zdGljcygpO1xuICAgIGlmIChuZ1N0cnVjdHVyYWxEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IHRoaXMuX2NyZWF0ZURpYWdub3N0aWNzRXJyb3IobmdTdHJ1Y3R1cmFsRGlhZ25vc3RpY3MpO1xuICAgIH1cblxuICAgIGFuYWx5emVkTW9kdWxlcy5maWxlcy5mb3JFYWNoKGZpbGUgPT4ge1xuICAgICAgZmlsZS5kaXJlY3RpdmVzLmZvckVhY2goZGlyZWN0aXZlID0+IHRoaXMuX2FuYWx5emVEaXJlY3RpdmUoZGlyZWN0aXZlLCBhbmFseXplZE1vZHVsZXMpKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBBbmFseXplcyBhIGdpdmVuIGRpcmVjdGl2ZSBieSBkZXRlcm1pbmluZyB0aGUgdGltaW5nIG9mIGFsbCBtYXRjaGVkIHZpZXcgcXVlcmllcy4gKi9cbiAgcHJpdmF0ZSBfYW5hbHl6ZURpcmVjdGl2ZShzeW1ib2w6IFN0YXRpY1N5bWJvbCwgYW5hbHl6ZWRNb2R1bGVzOiBOZ0FuYWx5emVkTW9kdWxlcykge1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5tZXRhZGF0YVJlc29sdmVyICEuZ2V0RGlyZWN0aXZlTWV0YWRhdGEoc3ltYm9sKTtcbiAgICBjb25zdCBuZ01vZHVsZSA9IGFuYWx5emVkTW9kdWxlcy5uZ01vZHVsZUJ5UGlwZU9yRGlyZWN0aXZlLmdldChzeW1ib2wpO1xuXG4gICAgaWYgKCFtZXRhZGF0YS5pc0NvbXBvbmVudCB8fCAhbmdNb2R1bGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJzZWRUZW1wbGF0ZSA9IHRoaXMuX3BhcnNlVGVtcGxhdGUobWV0YWRhdGEsIG5nTW9kdWxlKTtcbiAgICBjb25zdCBxdWVyeVRpbWluZ01hcCA9IGZpbmRTdGF0aWNRdWVyeUlkcyhwYXJzZWRUZW1wbGF0ZSk7XG4gICAgY29uc3Qge3N0YXRpY1F1ZXJ5SWRzfSA9IHN0YXRpY1ZpZXdRdWVyeUlkcyhxdWVyeVRpbWluZ01hcCk7XG5cbiAgICBtZXRhZGF0YS52aWV3UXVlcmllcy5mb3JFYWNoKChxdWVyeSwgaW5kZXgpID0+IHtcbiAgICAgIC8vIFF1ZXJ5IGlkcyBhcmUgY29tcHV0ZWQgYnkgYWRkaW5nIFwib25lXCIgdG8gdGhlIGluZGV4LiBUaGlzIGlzIGRvbmUgd2l0aGluXG4gICAgICAvLyB0aGUgXCJ2aWV3X2NvbXBpbGVyLnRzXCIgaW4gb3JkZXIgdG8gc3VwcG9ydCB1c2luZyBhIGJsb29tIGZpbHRlciBmb3IgcXVlcmllcy5cbiAgICAgIGNvbnN0IHF1ZXJ5SWQgPSBpbmRleCArIDE7XG4gICAgICBjb25zdCBxdWVyeUtleSA9XG4gICAgICAgICAgdGhpcy5fZ2V0Vmlld1F1ZXJ5VW5pcXVlS2V5KHN5bWJvbC5maWxlUGF0aCwgc3ltYm9sLm5hbWUsIHF1ZXJ5LnByb3BlcnR5TmFtZSk7XG4gICAgICB0aGlzLmFuYWx5emVkUXVlcmllcy5zZXQoXG4gICAgICAgICAgcXVlcnlLZXksIHN0YXRpY1F1ZXJ5SWRzLmhhcyhxdWVyeUlkKSA/IFF1ZXJ5VGltaW5nLlNUQVRJQyA6IFF1ZXJ5VGltaW5nLkRZTkFNSUMpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIERldGVjdHMgdGhlIHRpbWluZyBvZiB0aGUgcXVlcnkgZGVmaW5pdGlvbi4gKi9cbiAgZGV0ZWN0VGltaW5nKHF1ZXJ5OiBOZ1F1ZXJ5RGVmaW5pdGlvbik6IFRpbWluZ1Jlc3VsdCB7XG4gICAgaWYgKHF1ZXJ5LnR5cGUgPT09IFF1ZXJ5VHlwZS5Db250ZW50Q2hpbGQpIHtcbiAgICAgIHJldHVybiB7dGltaW5nOiBudWxsLCBtZXNzYWdlOiAnQ29udGVudCBxdWVyaWVzIGNhbm5vdCBiZSBtaWdyYXRlZCBhdXRvbWF0aWNhbGx5Lid9O1xuICAgIH0gZWxzZSBpZiAoIXF1ZXJ5Lm5hbWUpIHtcbiAgICAgIC8vIEluIGNhc2UgdGhlIHF1ZXJ5IHByb3BlcnR5IG5hbWUgaXMgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZSwgd2UgbWFyayB0aGlzXG4gICAgICAvLyBxdWVyeSBhcyB1bnJlc29sdmVkLiBOR0MgY3VycmVudGx5IHNraXBzIHRoZXNlIHZpZXcgcXVlcmllcyBhcyB3ZWxsLlxuICAgICAgcmV0dXJuIHt0aW1pbmc6IG51bGwsIG1lc3NhZ2U6ICdRdWVyeSBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLid9O1xuICAgIH1cblxuICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IHF1ZXJ5Lm5hbWU7XG4gICAgY29uc3QgY2xhc3NNZXRhZGF0YSA9IHRoaXMuY2xhc3NNZXRhZGF0YS5nZXQocXVlcnkuY29udGFpbmVyKTtcblxuICAgIC8vIEluIGNhc2UgdGhlcmUgaXMgbm8gY2xhc3MgbWV0YWRhdGEgb3IgdGhlcmUgYXJlIG5vIGRlcml2ZWQgY2xhc3NlcyB0aGF0XG4gICAgLy8gY291bGQgYWNjZXNzIHRoZSBjdXJyZW50IHF1ZXJ5LCB3ZSBqdXN0IGxvb2sgZm9yIHRoZSBxdWVyeSBhbmFseXNpcyBvZlxuICAgIC8vIHRoZSBjbGFzcyB0aGF0IGRlY2xhcmVzIHRoZSBxdWVyeS4gZS5nLiBvbmx5IHRoZSB0ZW1wbGF0ZSBvZiB0aGUgY2xhc3NcbiAgICAvLyB0aGF0IGRlY2xhcmVzIHRoZSB2aWV3IHF1ZXJ5IGFmZmVjdHMgdGhlIHF1ZXJ5IHRpbWluZy5cbiAgICBpZiAoIWNsYXNzTWV0YWRhdGEgfHwgIWNsYXNzTWV0YWRhdGEuZGVyaXZlZENsYXNzZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCB0aW1pbmcgPSB0aGlzLl9nZXRRdWVyeVRpbWluZ0Zyb21DbGFzcyhxdWVyeS5jb250YWluZXIsIHByb3BlcnR5TmFtZSk7XG5cbiAgICAgIGlmICh0aW1pbmcgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHt0aW1pbmc6IG51bGwsIG1lc3NhZ2U6IFFVRVJZX05PVF9ERUNMQVJFRF9JTl9DT01QT05FTlRfTUVTU0FHRX07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7dGltaW5nfTtcbiAgICB9XG5cbiAgICBsZXQgcmVzb2x2ZWRUaW1pbmc6IFF1ZXJ5VGltaW5nfG51bGwgPSBudWxsO1xuICAgIGxldCB0aW1pbmdNaXNtYXRjaCA9IGZhbHNlO1xuXG4gICAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgbXVsdGlwbGUgY29tcG9uZW50cyB0aGF0IHVzZSB0aGUgc2FtZSBxdWVyeSAoZS5nLiB0aHJvdWdoIGluaGVyaXRhbmNlKSxcbiAgICAvLyB3ZSBuZWVkIHRvIGNoZWNrIGlmIGFsbCBjb21wb25lbnRzIHVzZSB0aGUgcXVlcnkgd2l0aCB0aGUgc2FtZSB0aW1pbmcuIElmIHRoYXQgaXMgbm90XG4gICAgLy8gdGhlIGNhc2UsIHRoZSBxdWVyeSB0aW1pbmcgaXMgYW1iaWd1b3VzIGFuZCB0aGUgZGV2ZWxvcGVyIG5lZWRzIHRvIGZpeCB0aGUgcXVlcnkgbWFudWFsbHkuXG4gICAgW3F1ZXJ5LmNvbnRhaW5lciwgLi4uY2xhc3NNZXRhZGF0YS5kZXJpdmVkQ2xhc3Nlc10uZm9yRWFjaChjbGFzc0RlY2wgPT4ge1xuICAgICAgY29uc3QgY2xhc3NUaW1pbmcgPSB0aGlzLl9nZXRRdWVyeVRpbWluZ0Zyb21DbGFzcyhjbGFzc0RlY2wsIHByb3BlcnR5TmFtZSk7XG5cbiAgICAgIGlmIChjbGFzc1RpbWluZyA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIEluIGNhc2UgdGhlcmUgaXMgbm8gcmVzb2x2ZWQgdGltaW5nIHlldCwgc2F2ZSB0aGUgbmV3IHRpbWluZy4gVGltaW5ncyBmcm9tIG90aGVyXG4gICAgICAvLyBjb21wb25lbnRzIHRoYXQgdXNlIHRoZSBxdWVyeSB3aXRoIGEgZGlmZmVyZW50IHRpbWluZywgY2F1c2UgdGhlIHRpbWluZyB0byBiZVxuICAgICAgLy8gbWlzbWF0Y2hlZC4gSW4gdGhhdCBjYXNlIHdlIGNhbid0IGRldGVjdCBhIHdvcmtpbmcgdGltaW5nIGZvciBhbGwgY29tcG9uZW50cy5cbiAgICAgIGlmIChyZXNvbHZlZFRpbWluZyA9PT0gbnVsbCkge1xuICAgICAgICByZXNvbHZlZFRpbWluZyA9IGNsYXNzVGltaW5nO1xuICAgICAgfSBlbHNlIGlmIChyZXNvbHZlZFRpbWluZyAhPT0gY2xhc3NUaW1pbmcpIHtcbiAgICAgICAgdGltaW5nTWlzbWF0Y2ggPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKHJlc29sdmVkVGltaW5nID09PSBudWxsKSB7XG4gICAgICByZXR1cm4ge3RpbWluZzogUXVlcnlUaW1pbmcuRFlOQU1JQywgbWVzc2FnZTogUVVFUllfTk9UX0RFQ0xBUkVEX0lOX0NPTVBPTkVOVF9NRVNTQUdFfTtcbiAgICB9IGVsc2UgaWYgKHRpbWluZ01pc21hdGNoKSB7XG4gICAgICByZXR1cm4ge3RpbWluZzogbnVsbCwgbWVzc2FnZTogJ011bHRpcGxlIGNvbXBvbmVudHMgdXNlIHRoZSBxdWVyeSB3aXRoIGRpZmZlcmVudCB0aW1pbmdzLid9O1xuICAgIH1cbiAgICByZXR1cm4ge3RpbWluZzogcmVzb2x2ZWRUaW1pbmd9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHRpbWluZyB0aGF0IGhhcyBiZWVuIHJlc29sdmVkIGZvciBhIGdpdmVuIHF1ZXJ5IHdoZW4gaXQncyB1c2VkIHdpdGhpbiB0aGVcbiAgICogc3BlY2lmaWVkIGNsYXNzIGRlY2xhcmF0aW9uLiBlLmcuIHF1ZXJpZXMgZnJvbSBhbiBpbmhlcml0ZWQgY2xhc3MgY2FuIGJlIHVzZWQuXG4gICAqL1xuICBwcml2YXRlIF9nZXRRdWVyeVRpbWluZ0Zyb21DbGFzcyhjbGFzc0RlY2w6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHF1ZXJ5TmFtZTogc3RyaW5nKTogUXVlcnlUaW1pbmdcbiAgICAgIHxudWxsIHtcbiAgICBpZiAoIWNsYXNzRGVjbC5uYW1lKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgZmlsZVBhdGggPSBjbGFzc0RlY2wuZ2V0U291cmNlRmlsZSgpLmZpbGVOYW1lO1xuICAgIGNvbnN0IHF1ZXJ5S2V5ID0gdGhpcy5fZ2V0Vmlld1F1ZXJ5VW5pcXVlS2V5KGZpbGVQYXRoLCBjbGFzc0RlY2wubmFtZS50ZXh0LCBxdWVyeU5hbWUpO1xuXG4gICAgaWYgKHRoaXMuYW5hbHl6ZWRRdWVyaWVzLmhhcyhxdWVyeUtleSkpIHtcbiAgICAgIHJldHVybiB0aGlzLmFuYWx5emVkUXVlcmllcy5nZXQocXVlcnlLZXkpICE7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfcGFyc2VUZW1wbGF0ZShjb21wb25lbnQ6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSwgbmdNb2R1bGU6IENvbXBpbGVOZ01vZHVsZU1ldGFkYXRhKTpcbiAgICAgIFRlbXBsYXRlQXN0W10ge1xuICAgIHJldHVybiB0aGlzXG4gICAgICAgIC5jb21waWxlciAhWydfcGFyc2VUZW1wbGF0ZSddKGNvbXBvbmVudCwgbmdNb2R1bGUsIG5nTW9kdWxlLnRyYW5zaXRpdmVNb2R1bGUuZGlyZWN0aXZlcylcbiAgICAgICAgLnRlbXBsYXRlO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlRGlhZ25vc3RpY3NFcnJvcihkaWFnbm9zdGljczogUmVhZG9ubHlBcnJheTxEaWFnbm9zdGljPikge1xuICAgIHJldHVybiBuZXcgRXJyb3IodHMuZm9ybWF0RGlhZ25vc3RpY3MoZGlhZ25vc3RpY3MgYXMgdHMuRGlhZ25vc3RpY1tdLCB0aGlzLmhvc3QpKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldFZpZXdRdWVyeVVuaXF1ZUtleShmaWxlUGF0aDogc3RyaW5nLCBjbGFzc05hbWU6IHN0cmluZywgcHJvcE5hbWU6IHN0cmluZykge1xuICAgIHJldHVybiBgJHtyZXNvbHZlKGZpbGVQYXRoKX0jJHtjbGFzc05hbWV9LSR7cHJvcE5hbWV9YDtcbiAgfVxufVxuIl19