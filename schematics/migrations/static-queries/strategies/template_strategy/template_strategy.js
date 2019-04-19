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
        define("@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy", ["require", "exports", "@angular/compiler", "@angular/compiler-cli", "path", "@angular/core/schematics/utils/typescript/property_name", "@angular/core/schematics/migrations/static-queries/angular/query-definition"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const compiler_1 = require("@angular/compiler");
    const compiler_cli_1 = require("@angular/compiler-cli");
    const path_1 = require("path");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
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
            const ngDiagnostics = [
                ...aotProgram.getNgStructuralDiagnostics(),
                ...aotProgram.getNgSemanticDiagnostics(),
            ];
            if (ngDiagnostics.length) {
                this._printDiagnosticFailures(ngDiagnostics);
                return false;
            }
            analyzedModules.files.forEach(file => {
                file.directives.forEach(directive => this._analyzeDirective(directive, analyzedModules));
            });
            return true;
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
            else if (!property_name_1.hasPropertyNameText(query.property.name)) {
                // In case the query property name is not statically analyzable, we mark this
                // query as unresolved. NGC currently skips these view queries as well.
                return { timing: null, message: 'Query is not statically analyzable.' };
            }
            const propertyName = query.property.name.text;
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
        _printDiagnosticFailures(diagnostics) {
            console.error('Could not create Angular AOT compiler to determine query timing.');
            console.error('The following diagnostics were detected:\n');
            console.error(diagnostics.map(d => d.messageText).join(`\n`));
        }
        _getViewQueryUniqueKey(filePath, className, propName) {
            return `${path_1.resolve(filePath)}#${className}-${propName}`;
        }
    }
    exports.QueryTemplateStrategy = QueryTemplateStrategy;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9zdHJhdGVnaWVzL3RlbXBsYXRlX3N0cmF0ZWd5L3RlbXBsYXRlX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsZ0RBQTJPO0lBQzNPLHdEQUFtRjtJQUNuRiwrQkFBNkI7SUFHN0IsMkZBQStFO0lBRS9FLGtIQUF5RjtJQUd6RixNQUFNLHVDQUF1QyxHQUFHLCtDQUErQztRQUMzRixnREFBZ0QsQ0FBQztJQUVyRCxNQUFhLHFCQUFxQjtRQUtoQyxZQUNZLFdBQW1CLEVBQVUsYUFBK0IsRUFDNUQsSUFBcUI7WUFEckIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFBVSxrQkFBYSxHQUFiLGFBQWEsQ0FBa0I7WUFDNUQsU0FBSSxHQUFKLElBQUksQ0FBaUI7WUFOekIsYUFBUSxHQUFxQixJQUFJLENBQUM7WUFDbEMscUJBQWdCLEdBQWlDLElBQUksQ0FBQztZQUN0RCxvQkFBZSxHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1FBSXJCLENBQUM7UUFFckM7OztXQUdHO1FBQ0gsS0FBSztZQUNILE1BQU0sRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLEdBQUcsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sVUFBVSxHQUFHLDRCQUFhLENBQUMsRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQztZQUV4RSx1RkFBdUY7WUFDdkYsdUZBQXVGO1lBQ3ZGLHNGQUFzRjtZQUN0RixJQUFJLENBQUMsUUFBUSxHQUFJLFVBQWtCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFD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QUcsQ0FBQyxRQUFRLENBQUcsQ0FBQzthQUM3QztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVPLGNBQWMsQ0FBQyxTQUFtQyxFQUFFLFFBQWlDO1lBRTNGLE9BQU8sSUFBSTtpQkFDTixRQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUM7aUJBQ3ZGLFFBQVEsQ0FBQztRQUNoQixDQUFDO1FBRU8sd0JBQXdCLENBQUMsV0FBeUM7WUFDeEUsT0FBTyxDQUFDLEtBQUssQ0FBQyxrRUFBa0UsQ0FBQyxDQUFDO1lBQ2xGLE9BQU8sQ0FBQyxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztZQUM1RCxPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVPLHNCQUFzQixDQUFDLFFBQWdCLEVBQUUsU0FBaUIsRUFBRSxRQUFnQjtZQUNsRixPQUFPLEdBQUcsY0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLFNBQVMsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUN6RCxDQUFDO0tBQ0Y7SUExS0Qsc0RBMEtDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FvdENvbXBpbGVyLCBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsIENvbXBpbGVNZXRhZGF0YVJlc29sdmVyLCBDb21waWxlTmdNb2R1bGVNZXRhZGF0YSwgQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YSwgTmdBbmFseXplZE1vZHVsZXMsIFN0YXRpY1N5bWJvbCwgVGVtcGxhdGVBc3QsIGZpbmRTdGF0aWNRdWVyeUlkcywgc3RhdGljVmlld1F1ZXJ5SWRzfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0RpYWdub3N0aWMsIGNyZWF0ZVByb2dyYW0sIHJlYWRDb25maWd1cmF0aW9ufSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGknO1xuaW1wb3J0IHtyZXNvbHZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2hhc1Byb3BlcnR5TmFtZVRleHR9IGZyb20gJy4uLy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZSc7XG5pbXBvcnQge0NsYXNzTWV0YWRhdGFNYXB9IGZyb20gJy4uLy4uL2FuZ3VsYXIvbmdfcXVlcnlfdmlzaXRvcic7XG5pbXBvcnQge05nUXVlcnlEZWZpbml0aW9uLCBRdWVyeVRpbWluZywgUXVlcnlUeXBlfSBmcm9tICcuLi8uLi9hbmd1bGFyL3F1ZXJ5LWRlZmluaXRpb24nO1xuaW1wb3J0IHtUaW1pbmdSZXN1bHQsIFRpbWluZ1N0cmF0ZWd5fSBmcm9tICcuLi90aW1pbmctc3RyYXRlZ3knO1xuXG5jb25zdCBRVUVSWV9OT1RfREVDTEFSRURfSU5fQ09NUE9ORU5UX01FU1NBR0UgPSAnVGltaW5nIGNvdWxkIG5vdCBiZSBkZXRlcm1pbmVkLiBUaGlzIGhhcHBlbnMgJyArXG4gICAgJ2lmIHRoZSBxdWVyeSBpcyBub3QgZGVjbGFyZWQgaW4gYW55IGNvbXBvbmVudC4nO1xuXG5leHBvcnQgY2xhc3MgUXVlcnlUZW1wbGF0ZVN0cmF0ZWd5IGltcGxlbWVudHMgVGltaW5nU3RyYXRlZ3kge1xuICBwcml2YXRlIGNvbXBpbGVyOiBBb3RDb21waWxlcnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBtZXRhZGF0YVJlc29sdmVyOiBDb21waWxlTWV0YWRhdGFSZXNvbHZlcnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhbmFseXplZFF1ZXJpZXMgPSBuZXcgTWFwPHN0cmluZywgUXVlcnlUaW1pbmc+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHByb2plY3RQYXRoOiBzdHJpbmcsIHByaXZhdGUgY2xhc3NNZXRhZGF0YTogQ2xhc3NNZXRhZGF0YU1hcCxcbiAgICAgIHByaXZhdGUgaG9zdDogdHMuQ29tcGlsZXJIb3N0KSB7fVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHRoZSB0ZW1wbGF0ZSBzdHJhdGVneSBieSBjcmVhdGluZyB0aGUgQW5ndWxhckNvbXBpbGVyUHJvZ3JhbS4gUmV0dXJucyBmYWxzZSBpZlxuICAgKiB0aGUgQU9UIGNvbXBpbGVyIHByb2dyYW0gY291bGQgbm90IGJlIGNyZWF0ZWQgZHVlIHRvIGZhaWx1cmUgZGlhZ25vc3RpY3MuXG4gICAqL1xuICBzZXR1cCgpIHtcbiAgICBjb25zdCB7cm9vdE5hbWVzLCBvcHRpb25zfSA9IHJlYWRDb25maWd1cmF0aW9uKHRoaXMucHJvamVjdFBhdGgpO1xuICAgIGNvbnN0IGFvdFByb2dyYW0gPSBjcmVhdGVQcm9ncmFtKHtyb290TmFtZXMsIG9wdGlvbnMsIGhvc3Q6IHRoaXMuaG9zdH0pO1xuXG4gICAgLy8gVGhlIFwiQW5ndWxhckNvbXBpbGVyUHJvZ3JhbVwiIGRvZXMgbm90IGV4cG9zZSB0aGUgXCJBb3RDb21waWxlclwiIGluc3RhbmNlLCBub3IgZG9lcyBpdFxuICAgIC8vIGV4cG9zZSB0aGUgbG9naWMgdGhhdCBpcyBuZWNlc3NhcnkgdG8gYW5hbHl6ZSB0aGUgZGV0ZXJtaW5lZCBtb2R1bGVzLiBXZSB3b3JrIGFyb3VuZFxuICAgIC8vIHRoaXMgYnkganVzdCBhY2Nlc3NpbmcgdGhlIG5lY2Vzc2FyeSBwcml2YXRlIHByb3BlcnRpZXMgdXNpbmcgdGhlIGJyYWNrZXQgbm90YXRpb24uXG4gICAgdGhpcy5jb21waWxlciA9IChhb3RQcm9ncmFtIGFzIGFueSlbJ2NvbXBpbGVyJ107XG4gICAgdGhpcy5tZXRhZGF0YVJlc29sdmVyID0gdGhpcy5jb21waWxlciAhWydfbWV0YWRhdGFSZXNvbHZlciddO1xuXG4gICAgLy8gTW9kaWZ5IHRoZSBcIkRpcmVjdGl2ZU5vcm1hbGl6ZXJcIiB0byBub3Qgbm9ybWFsaXplIGFueSByZWZlcmVuY2VkIGV4dGVybmFsIHN0eWxlc2hlZXRzLlxuICAgIC8vIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgaW4gQ0xJIHByb2plY3RzIHByZXByb2Nlc3NvciBmaWxlcyBhcmUgY29tbW9ubHkgcmVmZXJlbmNlZFxuICAgIC8vIGFuZCB3ZSBkb24ndCB3YW50IHRvIHBhcnNlIHRoZW0gaW4gb3JkZXIgdG8gZXh0cmFjdCByZWxhdGl2ZSBzdHlsZSByZWZlcmVuY2VzLiBUaGlzXG4gICAgLy8gYnJlYWtzIHRoZSBhbmFseXNpcyBvZiB0aGUgcHJvamVjdCBiZWNhdXNlIHdlIGluc3RhbnRpYXRlIGEgc3RhbmRhbG9uZSBBT1QgY29tcGlsZXJcbiAgICAvLyBwcm9ncmFtIHdoaWNoIGRvZXMgbm90IGNvbnRhaW4gdGhlIGN1c3RvbSBsb2dpYyBieSB0aGUgQW5ndWxhciBDTEkgV2VicGFjayBjb21waWxlciBwbHVnaW4uXG4gICAgY29uc3QgZGlyZWN0aXZlTm9ybWFsaXplciA9IHRoaXMubWV0YWRhdGFSZXNvbHZlciAhWydfZGlyZWN0aXZlTm9ybWFsaXplciddO1xuICAgIGRpcmVjdGl2ZU5vcm1hbGl6ZXJbJ19ub3JtYWxpemVTdHlsZXNoZWV0J10gPSBmdW5jdGlvbihtZXRhZGF0YTogQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YSkge1xuICAgICAgcmV0dXJuIG5ldyBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhKFxuICAgICAgICAgIHtzdHlsZXM6IG1ldGFkYXRhLnN0eWxlcywgc3R5bGVVcmxzOiBbXSwgbW9kdWxlVXJsOiBtZXRhZGF0YS5tb2R1bGVVcmwgIX0pO1xuICAgIH07XG5cbiAgICAvLyBSZXRyaWV2ZXMgdGhlIGFuYWx5emVkIG1vZHVsZXMgb2YgdGhlIGN1cnJlbnQgcHJvZ3JhbS4gVGhpcyBkYXRhIGNhbiBiZVxuICAgIC8vIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSB0aW1pbmcgZm9yIHJlZ2lzdGVyZWQgcXVlcmllcy5cbiAgICBjb25zdCBhbmFseXplZE1vZHVsZXMgPSAoYW90UHJvZ3JhbSBhcyBhbnkpWydhbmFseXplZE1vZHVsZXMnXSBhcyBOZ0FuYWx5emVkTW9kdWxlcztcblxuICAgIGNvbnN0IG5nRGlhZ25vc3RpY3MgPSBbXG4gICAgICAuLi5hb3RQcm9ncmFtLmdldE5nU3RydWN0dXJhbERpYWdub3N0aWNzKCksXG4gICAgICAuLi5hb3RQcm9ncmFtLmdldE5nU2VtYW50aWNEaWFnbm9zdGljcygpLFxuICAgIF07XG5cbiAgICBpZiAobmdEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX3ByaW50RGlhZ25vc3RpY0ZhaWx1cmVzKG5nRGlhZ25vc3RpY3MpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGFuYWx5emVkTW9kdWxlcy5maWxlcy5mb3JFYWNoKGZpbGUgPT4ge1xuICAgICAgZmlsZS5kaXJlY3RpdmVzLmZvckVhY2goZGlyZWN0aXZlID0+IHRoaXMuX2FuYWx5emVEaXJlY3RpdmUoZGlyZWN0aXZlLCBhbmFseXplZE1vZHVsZXMpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBBbmFseXplcyBhIGdpdmVuIGRpcmVjdGl2ZSBieSBkZXRlcm1pbmluZyB0aGUgdGltaW5nIG9mIGFsbCBtYXRjaGVkIHZpZXcgcXVlcmllcy4gKi9cbiAgcHJpdmF0ZSBfYW5hbHl6ZURpcmVjdGl2ZShzeW1ib2w6IFN0YXRpY1N5bWJvbCwgYW5hbHl6ZWRNb2R1bGVzOiBOZ0FuYWx5emVkTW9kdWxlcykge1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5tZXRhZGF0YVJlc29sdmVyICEuZ2V0RGlyZWN0aXZlTWV0YWRhdGEoc3ltYm9sKTtcbiAgICBjb25zdCBuZ01vZHVsZSA9IGFuYWx5emVkTW9kdWxlcy5uZ01vZHVsZUJ5UGlwZU9yRGlyZWN0aXZlLmdldChzeW1ib2wpO1xuXG4gICAgaWYgKCFtZXRhZGF0YS5pc0NvbXBvbmVudCB8fCAhbmdNb2R1bGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJzZWRUZW1wbGF0ZSA9IHRoaXMuX3BhcnNlVGVtcGxhdGUobWV0YWRhdGEsIG5nTW9kdWxlKTtcbiAgICBjb25zdCBxdWVyeVRpbWluZ01hcCA9IGZpbmRTdGF0aWNRdWVyeUlkcyhwYXJzZWRUZW1wbGF0ZSk7XG4gICAgY29uc3Qge3N0YXRpY1F1ZXJ5SWRzfSA9IHN0YXRpY1ZpZXdRdWVyeUlkcyhxdWVyeVRpbWluZ01hcCk7XG5cbiAgICBtZXRhZGF0YS52aWV3UXVlcmllcy5mb3JFYWNoKChxdWVyeSwgaW5kZXgpID0+IHtcbiAgICAgIC8vIFF1ZXJ5IGlkcyBhcmUgY29tcHV0ZWQgYnkgYWRkaW5nIFwib25lXCIgdG8gdGhlIGluZGV4LiBUaGlzIGlzIGRvbmUgd2l0aGluXG4gICAgICAvLyB0aGUgXCJ2aWV3X2NvbXBpbGVyLnRzXCIgaW4gb3JkZXIgdG8gc3VwcG9ydCB1c2luZyBhIGJsb29tIGZpbHRlciBmb3IgcXVlcmllcy5cbiAgICAgIGNvbnN0IHF1ZXJ5SWQgPSBpbmRleCArIDE7XG4gICAgICBjb25zdCBxdWVyeUtleSA9XG4gICAgICAgICAgdGhpcy5fZ2V0Vmlld1F1ZXJ5VW5pcXVlS2V5KHN5bWJvbC5maWxlUGF0aCwgc3ltYm9sLm5hbWUsIHF1ZXJ5LnByb3BlcnR5TmFtZSk7XG4gICAgICB0aGlzLmFuYWx5emVkUXVlcmllcy5zZXQoXG4gICAgICAgICAgcXVlcnlLZXksIHN0YXRpY1F1ZXJ5SWRzLmhhcyhxdWVyeUlkKSA/IFF1ZXJ5VGltaW5nLlNUQVRJQyA6IFF1ZXJ5VGltaW5nLkRZTkFNSUMpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIERldGVjdHMgdGhlIHRpbWluZyBvZiB0aGUgcXVlcnkgZGVmaW5pdGlvbi4gKi9cbiAgZGV0ZWN0VGltaW5nKHF1ZXJ5OiBOZ1F1ZXJ5RGVmaW5pdGlvbik6IFRpbWluZ1Jlc3VsdCB7XG4gICAgaWYgKHF1ZXJ5LnR5cGUgPT09IFF1ZXJ5VHlwZS5Db250ZW50Q2hpbGQpIHtcbiAgICAgIHJldHVybiB7dGltaW5nOiBudWxsLCBtZXNzYWdlOiAnQ29udGVudCBxdWVyaWVzIGNhbm5vdCBiZSBtaWdyYXRlZCBhdXRvbWF0aWNhbGx5Lid9O1xuICAgIH0gZWxzZSBpZiAoIWhhc1Byb3BlcnR5TmFtZVRleHQocXVlcnkucHJvcGVydHkubmFtZSkpIHtcbiAgICAgIC8vIEluIGNhc2UgdGhlIHF1ZXJ5IHByb3BlcnR5IG5hbWUgaXMgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZSwgd2UgbWFyayB0aGlzXG4gICAgICAvLyBxdWVyeSBhcyB1bnJlc29sdmVkLiBOR0MgY3VycmVudGx5IHNraXBzIHRoZXNlIHZpZXcgcXVlcmllcyBhcyB3ZWxsLlxuICAgICAgcmV0dXJuIHt0aW1pbmc6IG51bGwsIG1lc3NhZ2U6ICdRdWVyeSBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLid9O1xuICAgIH1cblxuICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IHF1ZXJ5LnByb3BlcnR5Lm5hbWUudGV4dDtcbiAgICBjb25zdCBjbGFzc01ldGFkYXRhID0gdGhpcy5jbGFzc01ldGFkYXRhLmdldChxdWVyeS5jb250YWluZXIpO1xuXG4gICAgLy8gSW4gY2FzZSB0aGVyZSBpcyBubyBjbGFzcyBtZXRhZGF0YSBvciB0aGVyZSBhcmUgbm8gZGVyaXZlZCBjbGFzc2VzIHRoYXRcbiAgICAvLyBjb3VsZCBhY2Nlc3MgdGhlIGN1cnJlbnQgcXVlcnksIHdlIGp1c3QgbG9vayBmb3IgdGhlIHF1ZXJ5IGFuYWx5c2lzIG9mXG4gICAgLy8gdGhlIGNsYXNzIHRoYXQgZGVjbGFyZXMgdGhlIHF1ZXJ5LiBlLmcuIG9ubHkgdGhlIHRlbXBsYXRlIG9mIHRoZSBjbGFzc1xuICAgIC8vIHRoYXQgZGVjbGFyZXMgdGhlIHZpZXcgcXVlcnkgYWZmZWN0cyB0aGUgcXVlcnkgdGltaW5nLlxuICAgIGlmICghY2xhc3NNZXRhZGF0YSB8fCAhY2xhc3NNZXRhZGF0YS5kZXJpdmVkQ2xhc3Nlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRpbWluZyA9IHRoaXMuX2dldFF1ZXJ5VGltaW5nRnJvbUNsYXNzKHF1ZXJ5LmNvbnRhaW5lciwgcHJvcGVydHlOYW1lKTtcblxuICAgICAgaWYgKHRpbWluZyA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4ge3RpbWluZzogbnVsbCwgbWVzc2FnZTogUVVFUllfTk9UX0RFQ0xBUkVEX0lOX0NPTVBPTkVOVF9NRVNTQUdFfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHt0aW1pbmd9O1xuICAgIH1cblxuICAgIGxldCByZXNvbHZlZFRpbWluZzogUXVlcnlUaW1pbmd8bnVsbCA9IG51bGw7XG4gICAgbGV0IHRpbWluZ01pc21hdGNoID0gZmFsc2U7XG5cbiAgICAvLyBJbiBjYXNlIHRoZXJlIGFyZSBtdWx0aXBsZSBjb21wb25lbnRzIHRoYXQgdXNlIHRoZSBzYW1lIHF1ZXJ5IChlLmcuIHRocm91Z2ggaW5oZXJpdGFuY2UpLFxuICAgIC8vIHdlIG5lZWQgdG8gY2hlY2sgaWYgYWxsIGNvbXBvbmVudHMgdXNlIHRoZSBxdWVyeSB3aXRoIHRoZSBzYW1lIHRpbWluZy4gSWYgdGhhdCBpcyBub3RcbiAgICAvLyB0aGUgY2FzZSwgdGhlIHF1ZXJ5IHRpbWluZyBpcyBhbWJpZ3VvdXMgYW5kIHRoZSBkZXZlbG9wZXIgbmVlZHMgdG8gZml4IHRoZSBxdWVyeSBtYW51YWxseS5cbiAgICBbcXVlcnkuY29udGFpbmVyLCAuLi5jbGFzc01ldGFkYXRhLmRlcml2ZWRDbGFzc2VzXS5mb3JFYWNoKGNsYXNzRGVjbCA9PiB7XG4gICAgICBjb25zdCBjbGFzc1RpbWluZyA9IHRoaXMuX2dldFF1ZXJ5VGltaW5nRnJvbUNsYXNzKGNsYXNzRGVjbCwgcHJvcGVydHlOYW1lKTtcblxuICAgICAgaWYgKGNsYXNzVGltaW5nID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gSW4gY2FzZSB0aGVyZSBpcyBubyByZXNvbHZlZCB0aW1pbmcgeWV0LCBzYXZlIHRoZSBuZXcgdGltaW5nLiBUaW1pbmdzIGZyb20gb3RoZXJcbiAgICAgIC8vIGNvbXBvbmVudHMgdGhhdCB1c2UgdGhlIHF1ZXJ5IHdpdGggYSBkaWZmZXJlbnQgdGltaW5nLCBjYXVzZSB0aGUgdGltaW5nIHRvIGJlXG4gICAgICAvLyBtaXNtYXRjaGVkLiBJbiB0aGF0IGNhc2Ugd2UgY2FuJ3QgZGV0ZWN0IGEgd29ya2luZyB0aW1pbmcgZm9yIGFsbCBjb21wb25lbnRzLlxuICAgICAgaWYgKHJlc29sdmVkVGltaW5nID09PSBudWxsKSB7XG4gICAgICAgIHJlc29sdmVkVGltaW5nID0gY2xhc3NUaW1pbmc7XG4gICAgICB9IGVsc2UgaWYgKHJlc29sdmVkVGltaW5nICE9PSBjbGFzc1RpbWluZykge1xuICAgICAgICB0aW1pbmdNaXNtYXRjaCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAocmVzb2x2ZWRUaW1pbmcgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB7dGltaW5nOiBRdWVyeVRpbWluZy5EWU5BTUlDLCBtZXNzYWdlOiBRVUVSWV9OT1RfREVDTEFSRURfSU5fQ09NUE9ORU5UX01FU1NBR0V9O1xuICAgIH0gZWxzZSBpZiAodGltaW5nTWlzbWF0Y2gpIHtcbiAgICAgIHJldHVybiB7dGltaW5nOiBudWxsLCBtZXNzYWdlOiAnTXVsdGlwbGUgY29tcG9uZW50cyB1c2UgdGhlIHF1ZXJ5IHdpdGggZGlmZmVyZW50IHRpbWluZ3MuJ307XG4gICAgfVxuICAgIHJldHVybiB7dGltaW5nOiByZXNvbHZlZFRpbWluZ307XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdGltaW5nIHRoYXQgaGFzIGJlZW4gcmVzb2x2ZWQgZm9yIGEgZ2l2ZW4gcXVlcnkgd2hlbiBpdCdzIHVzZWQgd2l0aGluIHRoZVxuICAgKiBzcGVjaWZpZWQgY2xhc3MgZGVjbGFyYXRpb24uIGUuZy4gcXVlcmllcyBmcm9tIGFuIGluaGVyaXRlZCBjbGFzcyBjYW4gYmUgdXNlZC5cbiAgICovXG4gIHByaXZhdGUgX2dldFF1ZXJ5VGltaW5nRnJvbUNsYXNzKGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnlOYW1lOiBzdHJpbmcpOiBRdWVyeVRpbWluZ1xuICAgICAgfG51bGwge1xuICAgIGlmICghY2xhc3NEZWNsLm5hbWUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBmaWxlUGF0aCA9IGNsYXNzRGVjbC5nZXRTb3VyY2VGaWxlKCkuZmlsZU5hbWU7XG4gICAgY29uc3QgcXVlcnlLZXkgPSB0aGlzLl9nZXRWaWV3UXVlcnlVbmlxdWVLZXkoZmlsZVBhdGgsIGNsYXNzRGVjbC5uYW1lLnRleHQsIHF1ZXJ5TmFtZSk7XG5cbiAgICBpZiAodGhpcy5hbmFseXplZFF1ZXJpZXMuaGFzKHF1ZXJ5S2V5KSkge1xuICAgICAgcmV0dXJuIHRoaXMuYW5hbHl6ZWRRdWVyaWVzLmdldChxdWVyeUtleSkgITtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIF9wYXJzZVRlbXBsYXRlKGNvbXBvbmVudDogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLCBuZ01vZHVsZTogQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGEpOlxuICAgICAgVGVtcGxhdGVBc3RbXSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgICAgICAgLmNvbXBpbGVyICFbJ19wYXJzZVRlbXBsYXRlJ10oY29tcG9uZW50LCBuZ01vZHVsZSwgbmdNb2R1bGUudHJhbnNpdGl2ZU1vZHVsZS5kaXJlY3RpdmVzKVxuICAgICAgICAudGVtcGxhdGU7XG4gIH1cblxuICBwcml2YXRlIF9wcmludERpYWdub3N0aWNGYWlsdXJlcyhkaWFnbm9zdGljczogKHRzLkRpYWdub3N0aWN8RGlhZ25vc3RpYylbXSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0NvdWxkIG5vdCBjcmVhdGUgQW5ndWxhciBBT1QgY29tcGlsZXIgdG8gZGV0ZXJtaW5lIHF1ZXJ5IHRpbWluZy4nKTtcbiAgICBjb25zb2xlLmVycm9yKCdUaGUgZm9sbG93aW5nIGRpYWdub3N0aWNzIHdlcmUgZGV0ZWN0ZWQ6XFxuJyk7XG4gICAgY29uc29sZS5lcnJvcihkaWFnbm9zdGljcy5tYXAoZCA9PiBkLm1lc3NhZ2VUZXh0KS5qb2luKGBcXG5gKSk7XG4gIH1cblxuICBwcml2YXRlIF9nZXRWaWV3UXVlcnlVbmlxdWVLZXkoZmlsZVBhdGg6IHN0cmluZywgY2xhc3NOYW1lOiBzdHJpbmcsIHByb3BOYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYCR7cmVzb2x2ZShmaWxlUGF0aCl9IyR7Y2xhc3NOYW1lfS0ke3Byb3BOYW1lfWA7XG4gIH1cbn1cbiJdfQ==