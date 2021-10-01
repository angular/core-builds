/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
    const typescript_1 = __importDefault(require("typescript"));
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
            return new Error(typescript_1.default.formatDiagnostics(diagnostics, this.host));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9zdHJhdGVnaWVzL3RlbXBsYXRlX3N0cmF0ZWd5L3RlbXBsYXRlX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7OztJQUdILHdEQUFtRjtJQUNuRiwrQkFBNkI7SUFDN0IsNERBQTRCO0lBRzVCLGtIQUF5RjtJQUd6RixNQUFNLHVDQUF1QyxHQUFHLCtDQUErQztRQUMzRixnREFBZ0QsQ0FBQztJQUVyRCxNQUFhLHFCQUFxQjtRQUtoQyxZQUNZLFdBQW1CLEVBQVUsYUFBK0IsRUFDNUQsSUFBcUIsRUFBVSxjQUFrRDtZQURqRixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUFVLGtCQUFhLEdBQWIsYUFBYSxDQUFrQjtZQUM1RCxTQUFJLEdBQUosSUFBSSxDQUFpQjtZQUFVLG1CQUFjLEdBQWQsY0FBYyxDQUFvQztZQU5yRixhQUFRLEdBQXFCLElBQUksQ0FBQztZQUNsQyxxQkFBZ0IsR0FBaUMsSUFBSSxDQUFDO1lBQ3RELG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7UUFJdUMsQ0FBQztRQUVqRzs7O1dBR0c7UUFDSCxLQUFLO1lBQ0gsTUFBTSxFQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUMsR0FBRyxJQUFBLGdDQUFpQixFQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUVqRSw4RkFBOEY7WUFDOUYsNkZBQTZGO1lBQzdGLDBGQUEwRjtZQUMxRixTQUFTO1lBQ1QsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFFMUIsTUFBTSxVQUFVLEdBQUcsSUFBQSw0QkFBYSxFQUFDLEVBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUs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Z2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHtBb3RDb21waWxlciwgQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLCBDb21waWxlTWV0YWRhdGFSZXNvbHZlciwgQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGEsIENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEsIEVsZW1lbnRBc3QsIEVtYmVkZGVkVGVtcGxhdGVBc3QsIE5nQW5hbHl6ZWRNb2R1bGVzLCBRdWVyeU1hdGNoLCBTdGF0aWNTeW1ib2wsIFRlbXBsYXRlQXN0fSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge2NyZWF0ZVByb2dyYW0sIERpYWdub3N0aWMsIHJlYWRDb25maWd1cmF0aW9ufSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGknO1xuaW1wb3J0IHtyZXNvbHZlfSBmcm9tICdwYXRoJztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtDbGFzc01ldGFkYXRhTWFwfSBmcm9tICcuLi8uLi9hbmd1bGFyL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUaW1pbmcsIFF1ZXJ5VHlwZX0gZnJvbSAnLi4vLi4vYW5ndWxhci9xdWVyeS1kZWZpbml0aW9uJztcbmltcG9ydCB7VGltaW5nUmVzdWx0LCBUaW1pbmdTdHJhdGVneX0gZnJvbSAnLi4vdGltaW5nLXN0cmF0ZWd5JztcblxuY29uc3QgUVVFUllfTk9UX0RFQ0xBUkVEX0lOX0NPTVBPTkVOVF9NRVNTQUdFID0gJ1RpbWluZyBjb3VsZCBub3QgYmUgZGV0ZXJtaW5lZC4gVGhpcyBoYXBwZW5zICcgK1xuICAgICdpZiB0aGUgcXVlcnkgaXMgbm90IGRlY2xhcmVkIGluIGFueSBjb21wb25lbnQuJztcblxuZXhwb3J0IGNsYXNzIFF1ZXJ5VGVtcGxhdGVTdHJhdGVneSBpbXBsZW1lbnRzIFRpbWluZ1N0cmF0ZWd5IHtcbiAgcHJpdmF0ZSBjb21waWxlcjogQW90Q29tcGlsZXJ8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbWV0YWRhdGFSZXNvbHZlcjogQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXJ8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYW5hbHl6ZWRRdWVyaWVzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5VGltaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBwcm9qZWN0UGF0aDogc3RyaW5nLCBwcml2YXRlIGNsYXNzTWV0YWRhdGE6IENsYXNzTWV0YWRhdGFNYXAsXG4gICAgICBwcml2YXRlIGhvc3Q6IHRzLkNvbXBpbGVySG9zdCwgcHJpdmF0ZSBjb21waWxlck1vZHVsZTogdHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXInKSkge31cblxuICAvKipcbiAgICogU2V0cyB1cCB0aGUgdGVtcGxhdGUgc3RyYXRlZ3kgYnkgY3JlYXRpbmcgdGhlIEFuZ3VsYXJDb21waWxlclByb2dyYW0uIFJldHVybnMgZmFsc2UgaWZcbiAgICogdGhlIEFPVCBjb21waWxlciBwcm9ncmFtIGNvdWxkIG5vdCBiZSBjcmVhdGVkIGR1ZSB0byBmYWlsdXJlIGRpYWdub3N0aWNzLlxuICAgKi9cbiAgc2V0dXAoKSB7XG4gICAgY29uc3Qge3Jvb3ROYW1lcywgb3B0aW9uc30gPSByZWFkQ29uZmlndXJhdGlvbih0aGlzLnByb2plY3RQYXRoKTtcblxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvY29tbWl0L2VjNDM4MWRkNDAxZjAzYmRlZDY1MjY2NWIwNDdiNmI5MGYyYjQyNWYgbWFkZSBJdnlcbiAgICAvLyB0aGUgZGVmYXVsdC4gVGhpcyBicmVha3MgdGhlIGFzc3VtcHRpb24gdGhhdCBcImNyZWF0ZVByb2dyYW1cIiBmcm9tIGNvbXBpbGVyLWNsaSByZXR1cm5zIHRoZVxuICAgIC8vIE5HQyBwcm9ncmFtLiBJbiBvcmRlciB0byBlbnN1cmUgdGhhdCB0aGUgbWlncmF0aW9uIHJ1bnMgcHJvcGVybHksIHdlIHNldCBcImVuYWJsZUl2eVwiIHRvXG4gICAgLy8gZmFsc2UuXG4gICAgb3B0aW9ucy5lbmFibGVJdnkgPSBmYWxzZTtcblxuICAgIGNvbnN0IGFvdFByb2dyYW0gPSBjcmVhdGVQcm9ncmFtKHtyb290TmFtZXMsIG9wdGlvbnMsIGhvc3Q6IHRoaXMuaG9zdH0pO1xuXG4gICAgLy8gVGhlIFwiQW5ndWxhckNvbXBpbGVyUHJvZ3JhbVwiIGRvZXMgbm90IGV4cG9zZSB0aGUgXCJBb3RDb21waWxlclwiIGluc3RhbmNlLCBub3IgZG9lcyBpdFxuICAgIC8vIGV4cG9zZSB0aGUgbG9naWMgdGhhdCBpcyBuZWNlc3NhcnkgdG8gYW5hbHl6ZSB0aGUgZGV0ZXJtaW5lZCBtb2R1bGVzLiBXZSB3b3JrIGFyb3VuZFxuICAgIC8vIHRoaXMgYnkganVzdCBhY2Nlc3NpbmcgdGhlIG5lY2Vzc2FyeSBwcml2YXRlIHByb3BlcnRpZXMgdXNpbmcgdGhlIGJyYWNrZXQgbm90YXRpb24uXG4gICAgdGhpcy5jb21waWxlciA9IChhb3RQcm9ncmFtIGFzIGFueSlbJ2NvbXBpbGVyJ107XG4gICAgdGhpcy5tZXRhZGF0YVJlc29sdmVyID0gdGhpcy5jb21waWxlciFbJ19tZXRhZGF0YVJlc29sdmVyJ107XG5cbiAgICAvLyBNb2RpZnkgdGhlIFwiRGlyZWN0aXZlTm9ybWFsaXplclwiIHRvIG5vdCBub3JtYWxpemUgYW55IHJlZmVyZW5jZWQgZXh0ZXJuYWwgc3R5bGVzaGVldHMuXG4gICAgLy8gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBpbiBDTEkgcHJvamVjdHMgcHJlcHJvY2Vzc29yIGZpbGVzIGFyZSBjb21tb25seSByZWZlcmVuY2VkXG4gICAgLy8gYW5kIHdlIGRvbid0IHdhbnQgdG8gcGFyc2UgdGhlbSBpbiBvcmRlciB0byBleHRyYWN0IHJlbGF0aXZlIHN0eWxlIHJlZmVyZW5jZXMuIFRoaXNcbiAgICAvLyBicmVha3MgdGhlIGFuYWx5c2lzIG9mIHRoZSBwcm9qZWN0IGJlY2F1c2Ugd2UgaW5zdGFudGlhdGUgYSBzdGFuZGFsb25lIEFPVCBjb21waWxlclxuICAgIC8vIHByb2dyYW0gd2hpY2ggZG9lcyBub3QgY29udGFpbiB0aGUgY3VzdG9tIGxvZ2ljIGJ5IHRoZSBBbmd1bGFyIENMSSBXZWJwYWNrIGNvbXBpbGVyIHBsdWdpbi5cbiAgICBjb25zdCBkaXJlY3RpdmVOb3JtYWxpemVyID0gdGhpcy5tZXRhZGF0YVJlc29sdmVyIVsnX2RpcmVjdGl2ZU5vcm1hbGl6ZXInXTtcbiAgICBkaXJlY3RpdmVOb3JtYWxpemVyWydfbm9ybWFsaXplU3R5bGVzaGVldCddID0gKG1ldGFkYXRhOiBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IHRoaXMuY29tcGlsZXJNb2R1bGUuQ29tcGlsZVN0eWxlc2hlZXRNZXRhZGF0YShcbiAgICAgICAgICB7c3R5bGVzOiBtZXRhZGF0YS5zdHlsZXMsIHN0eWxlVXJsczogW10sIG1vZHVsZVVybDogbWV0YWRhdGEubW9kdWxlVXJsIX0pO1xuICAgIH07XG5cbiAgICAvLyBSZXRyaWV2ZXMgdGhlIGFuYWx5emVkIG1vZHVsZXMgb2YgdGhlIGN1cnJlbnQgcHJvZ3JhbS4gVGhpcyBkYXRhIGNhbiBiZVxuICAgIC8vIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSB0aW1pbmcgZm9yIHJlZ2lzdGVyZWQgcXVlcmllcy5cbiAgICBjb25zdCBhbmFseXplZE1vZHVsZXMgPSAoYW90UHJvZ3JhbSBhcyBhbnkpWydhbmFseXplZE1vZHVsZXMnXSBhcyBOZ0FuYWx5emVkTW9kdWxlcztcblxuICAgIGNvbnN0IG5nU3RydWN0dXJhbERpYWdub3N0aWNzID0gYW90UHJvZ3JhbS5nZXROZ1N0cnVjdHVyYWxEaWFnbm9zdGljcygpO1xuICAgIGlmIChuZ1N0cnVjdHVyYWxEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IHRoaXMuX2NyZWF0ZURpYWdub3N0aWNzRXJyb3IobmdTdHJ1Y3R1cmFsRGlhZ25vc3RpY3MpO1xuICAgIH1cblxuICAgIGFuYWx5emVkTW9kdWxlcy5maWxlcy5mb3JFYWNoKGZpbGUgPT4ge1xuICAgICAgZmlsZS5kaXJlY3RpdmVzLmZvckVhY2goZGlyZWN0aXZlID0+IHRoaXMuX2FuYWx5emVEaXJlY3RpdmUoZGlyZWN0aXZlLCBhbmFseXplZE1vZHVsZXMpKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBBbmFseXplcyBhIGdpdmVuIGRpcmVjdGl2ZSBieSBkZXRlcm1pbmluZyB0aGUgdGltaW5nIG9mIGFsbCBtYXRjaGVkIHZpZXcgcXVlcmllcy4gKi9cbiAgcHJpdmF0ZSBfYW5hbHl6ZURpcmVjdGl2ZShzeW1ib2w6IFN0YXRpY1N5bWJvbCwgYW5hbHl6ZWRNb2R1bGVzOiBOZ0FuYWx5emVkTW9kdWxlcykge1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5tZXRhZGF0YVJlc29sdmVyIS5nZXREaXJlY3RpdmVNZXRhZGF0YShzeW1ib2wpO1xuICAgIGNvbnN0IG5nTW9kdWxlID0gYW5hbHl6ZWRNb2R1bGVzLm5nTW9kdWxlQnlQaXBlT3JEaXJlY3RpdmUuZ2V0KHN5bWJvbCk7XG5cbiAgICBpZiAoIW1ldGFkYXRhLmlzQ29tcG9uZW50IHx8ICFuZ01vZHVsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBhcnNlZFRlbXBsYXRlID0gdGhpcy5fcGFyc2VUZW1wbGF0ZShtZXRhZGF0YSwgbmdNb2R1bGUpO1xuICAgIGNvbnN0IHF1ZXJ5VGltaW5nTWFwID0gdGhpcy5maW5kU3RhdGljUXVlcnlJZHMocGFyc2VkVGVtcGxhdGUpO1xuICAgIGNvbnN0IHtzdGF0aWNRdWVyeUlkc30gPSBzdGF0aWNWaWV3UXVlcnlJZHMocXVlcnlUaW1pbmdNYXApO1xuXG4gICAgbWV0YWRhdGEudmlld1F1ZXJpZXMuZm9yRWFjaCgocXVlcnksIGluZGV4KSA9PiB7XG4gICAgICAvLyBRdWVyeSBpZHMgYXJlIGNvbXB1dGVkIGJ5IGFkZGluZyBcIm9uZVwiIHRvIHRoZSBpbmRleC4gVGhpcyBpcyBkb25lIHdpdGhpblxuICAgICAgLy8gdGhlIFwidmlld19jb21waWxlci50c1wiIGluIG9yZGVyIHRvIHN1cHBvcnQgdXNpbmcgYSBibG9vbSBmaWx0ZXIgZm9yIHF1ZXJpZXMuXG4gICAgICBjb25zdCBxdWVyeUlkID0gaW5kZXggKyAxO1xuICAgICAgY29uc3QgcXVlcnlLZXkgPVxuICAgICAgICAgIHRoaXMuX2dldFZpZXdRdWVyeVVuaXF1ZUtleShzeW1ib2wuZmlsZVBhdGgsIHN5bWJvbC5uYW1lLCBxdWVyeS5wcm9wZXJ0eU5hbWUpO1xuICAgICAgdGhpcy5hbmFseXplZFF1ZXJpZXMuc2V0KFxuICAgICAgICAgIHF1ZXJ5S2V5LCBzdGF0aWNRdWVyeUlkcy5oYXMocXVlcnlJZCkgPyBRdWVyeVRpbWluZy5TVEFUSUMgOiBRdWVyeVRpbWluZy5EWU5BTUlDKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBEZXRlY3RzIHRoZSB0aW1pbmcgb2YgdGhlIHF1ZXJ5IGRlZmluaXRpb24uICovXG4gIGRldGVjdFRpbWluZyhxdWVyeTogTmdRdWVyeURlZmluaXRpb24pOiBUaW1pbmdSZXN1bHQge1xuICAgIGlmIChxdWVyeS50eXBlID09PSBRdWVyeVR5cGUuQ29udGVudENoaWxkKSB7XG4gICAgICByZXR1cm4ge3RpbWluZzogbnVsbCwgbWVzc2FnZTogJ0NvbnRlbnQgcXVlcmllcyBjYW5ub3QgYmUgbWlncmF0ZWQgYXV0b21hdGljYWxseS4nfTtcbiAgICB9IGVsc2UgaWYgKCFxdWVyeS5uYW1lKSB7XG4gICAgICAvLyBJbiBjYXNlIHRoZSBxdWVyeSBwcm9wZXJ0eSBuYW1lIGlzIG5vdCBzdGF0aWNhbGx5IGFuYWx5emFibGUsIHdlIG1hcmsgdGhpc1xuICAgICAgLy8gcXVlcnkgYXMgdW5yZXNvbHZlZC4gTkdDIGN1cnJlbnRseSBza2lwcyB0aGVzZSB2aWV3IHF1ZXJpZXMgYXMgd2VsbC5cbiAgICAgIHJldHVybiB7dGltaW5nOiBudWxsLCBtZXNzYWdlOiAnUXVlcnkgaXMgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS4nfTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSBxdWVyeS5uYW1lO1xuICAgIGNvbnN0IGNsYXNzTWV0YWRhdGEgPSB0aGlzLmNsYXNzTWV0YWRhdGEuZ2V0KHF1ZXJ5LmNvbnRhaW5lcik7XG5cbiAgICAvLyBJbiBjYXNlIHRoZXJlIGlzIG5vIGNsYXNzIG1ldGFkYXRhIG9yIHRoZXJlIGFyZSBubyBkZXJpdmVkIGNsYXNzZXMgdGhhdFxuICAgIC8vIGNvdWxkIGFjY2VzcyB0aGUgY3VycmVudCBxdWVyeSwgd2UganVzdCBsb29rIGZvciB0aGUgcXVlcnkgYW5hbHlzaXMgb2ZcbiAgICAvLyB0aGUgY2xhc3MgdGhhdCBkZWNsYXJlcyB0aGUgcXVlcnkuIGUuZy4gb25seSB0aGUgdGVtcGxhdGUgb2YgdGhlIGNsYXNzXG4gICAgLy8gdGhhdCBkZWNsYXJlcyB0aGUgdmlldyBxdWVyeSBhZmZlY3RzIHRoZSBxdWVyeSB0aW1pbmcuXG4gICAgaWYgKCFjbGFzc01ldGFkYXRhIHx8ICFjbGFzc01ldGFkYXRhLmRlcml2ZWRDbGFzc2VzLmxlbmd0aCkge1xuICAgICAgY29uc3QgdGltaW5nID0gdGhpcy5fZ2V0UXVlcnlUaW1pbmdGcm9tQ2xhc3MocXVlcnkuY29udGFpbmVyLCBwcm9wZXJ0eU5hbWUpO1xuXG4gICAgICBpZiAodGltaW5nID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB7dGltaW5nOiBudWxsLCBtZXNzYWdlOiBRVUVSWV9OT1RfREVDTEFSRURfSU5fQ09NUE9ORU5UX01FU1NBR0V9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge3RpbWluZ307XG4gICAgfVxuXG4gICAgbGV0IHJlc29sdmVkVGltaW5nOiBRdWVyeVRpbWluZ3xudWxsID0gbnVsbDtcbiAgICBsZXQgdGltaW5nTWlzbWF0Y2ggPSBmYWxzZTtcblxuICAgIC8vIEluIGNhc2UgdGhlcmUgYXJlIG11bHRpcGxlIGNvbXBvbmVudHMgdGhhdCB1c2UgdGhlIHNhbWUgcXVlcnkgKGUuZy4gdGhyb3VnaCBpbmhlcml0YW5jZSksXG4gICAgLy8gd2UgbmVlZCB0byBjaGVjayBpZiBhbGwgY29tcG9uZW50cyB1c2UgdGhlIHF1ZXJ5IHdpdGggdGhlIHNhbWUgdGltaW5nLiBJZiB0aGF0IGlzIG5vdFxuICAgIC8vIHRoZSBjYXNlLCB0aGUgcXVlcnkgdGltaW5nIGlzIGFtYmlndW91cyBhbmQgdGhlIGRldmVsb3BlciBuZWVkcyB0byBmaXggdGhlIHF1ZXJ5IG1hbnVhbGx5LlxuICAgIFtxdWVyeS5jb250YWluZXIsIC4uLmNsYXNzTWV0YWRhdGEuZGVyaXZlZENsYXNzZXNdLmZvckVhY2goY2xhc3NEZWNsID0+IHtcbiAgICAgIGNvbnN0IGNsYXNzVGltaW5nID0gdGhpcy5fZ2V0UXVlcnlUaW1pbmdGcm9tQ2xhc3MoY2xhc3NEZWNsLCBwcm9wZXJ0eU5hbWUpO1xuXG4gICAgICBpZiAoY2xhc3NUaW1pbmcgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBJbiBjYXNlIHRoZXJlIGlzIG5vIHJlc29sdmVkIHRpbWluZyB5ZXQsIHNhdmUgdGhlIG5ldyB0aW1pbmcuIFRpbWluZ3MgZnJvbSBvdGhlclxuICAgICAgLy8gY29tcG9uZW50cyB0aGF0IHVzZSB0aGUgcXVlcnkgd2l0aCBhIGRpZmZlcmVudCB0aW1pbmcsIGNhdXNlIHRoZSB0aW1pbmcgdG8gYmVcbiAgICAgIC8vIG1pc21hdGNoZWQuIEluIHRoYXQgY2FzZSB3ZSBjYW4ndCBkZXRlY3QgYSB3b3JraW5nIHRpbWluZyBmb3IgYWxsIGNvbXBvbmVudHMuXG4gICAgICBpZiAocmVzb2x2ZWRUaW1pbmcgPT09IG51bGwpIHtcbiAgICAgICAgcmVzb2x2ZWRUaW1pbmcgPSBjbGFzc1RpbWluZztcbiAgICAgIH0gZWxzZSBpZiAocmVzb2x2ZWRUaW1pbmcgIT09IGNsYXNzVGltaW5nKSB7XG4gICAgICAgIHRpbWluZ01pc21hdGNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChyZXNvbHZlZFRpbWluZyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHt0aW1pbmc6IFF1ZXJ5VGltaW5nLkRZTkFNSUMsIG1lc3NhZ2U6IFFVRVJZX05PVF9ERUNMQVJFRF9JTl9DT01QT05FTlRfTUVTU0FHRX07XG4gICAgfSBlbHNlIGlmICh0aW1pbmdNaXNtYXRjaCkge1xuICAgICAgcmV0dXJuIHt0aW1pbmc6IG51bGwsIG1lc3NhZ2U6ICdNdWx0aXBsZSBjb21wb25lbnRzIHVzZSB0aGUgcXVlcnkgd2l0aCBkaWZmZXJlbnQgdGltaW5ncy4nfTtcbiAgICB9XG4gICAgcmV0dXJuIHt0aW1pbmc6IHJlc29sdmVkVGltaW5nfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0aW1pbmcgdGhhdCBoYXMgYmVlbiByZXNvbHZlZCBmb3IgYSBnaXZlbiBxdWVyeSB3aGVuIGl0J3MgdXNlZCB3aXRoaW4gdGhlXG4gICAqIHNwZWNpZmllZCBjbGFzcyBkZWNsYXJhdGlvbi4gZS5nLiBxdWVyaWVzIGZyb20gYW4gaW5oZXJpdGVkIGNsYXNzIGNhbiBiZSB1c2VkLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0UXVlcnlUaW1pbmdGcm9tQ2xhc3MoY2xhc3NEZWNsOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBxdWVyeU5hbWU6IHN0cmluZyk6IFF1ZXJ5VGltaW5nXG4gICAgICB8bnVsbCB7XG4gICAgaWYgKCFjbGFzc0RlY2wubmFtZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGZpbGVQYXRoID0gY2xhc3NEZWNsLmdldFNvdXJjZUZpbGUoKS5maWxlTmFtZTtcbiAgICBjb25zdCBxdWVyeUtleSA9IHRoaXMuX2dldFZpZXdRdWVyeVVuaXF1ZUtleShmaWxlUGF0aCwgY2xhc3NEZWNsLm5hbWUudGV4dCwgcXVlcnlOYW1lKTtcblxuICAgIGlmICh0aGlzLmFuYWx5emVkUXVlcmllcy5oYXMocXVlcnlLZXkpKSB7XG4gICAgICByZXR1cm4gdGhpcy5hbmFseXplZFF1ZXJpZXMuZ2V0KHF1ZXJ5S2V5KSE7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfcGFyc2VUZW1wbGF0ZShjb21wb25lbnQ6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSwgbmdNb2R1bGU6IENvbXBpbGVOZ01vZHVsZU1ldGFkYXRhKTpcbiAgICAgIFRlbXBsYXRlQXN0W10ge1xuICAgIHJldHVybiB0aGlzXG4gICAgICAgIC5jb21waWxlciFbJ19wYXJzZVRlbXBsYXRlJ10oY29tcG9uZW50LCBuZ01vZHVsZSwgbmdNb2R1bGUudHJhbnNpdGl2ZU1vZHVsZS5kaXJlY3RpdmVzKVxuICAgICAgICAudGVtcGxhdGU7XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVEaWFnbm9zdGljc0Vycm9yKGRpYWdub3N0aWNzOiBSZWFkb25seUFycmF5PERpYWdub3N0aWM+KSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcih0cy5mb3JtYXREaWFnbm9zdGljcyhkaWFnbm9zdGljcyBhcyB0cy5EaWFnbm9zdGljW10sIHRoaXMuaG9zdCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0Vmlld1F1ZXJ5VW5pcXVlS2V5KGZpbGVQYXRoOiBzdHJpbmcsIGNsYXNzTmFtZTogc3RyaW5nLCBwcm9wTmFtZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGAke3Jlc29sdmUoZmlsZVBhdGgpfSMke2NsYXNzTmFtZX0tJHtwcm9wTmFtZX1gO1xuICB9XG5cbiAgLyoqIEZpZ3VyZXMgb3V0IHdoaWNoIHF1ZXJpZXMgYXJlIHN0YXRpYyBhbmQgd2hpY2ggb25lcyBhcmUgZHluYW1pYy4gKi9cbiAgcHJpdmF0ZSBmaW5kU3RhdGljUXVlcnlJZHMoXG4gICAgICBub2RlczogVGVtcGxhdGVBc3RbXSwgcmVzdWx0ID0gbmV3IE1hcDxUZW1wbGF0ZUFzdCwgU3RhdGljQW5kRHluYW1pY1F1ZXJ5SWRzPigpKTpcbiAgICAgIE1hcDxUZW1wbGF0ZUFzdCwgU3RhdGljQW5kRHluYW1pY1F1ZXJ5SWRzPiB7XG4gICAgbm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGljUXVlcnlJZHMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgICAgIGNvbnN0IGR5bmFtaWNRdWVyeUlkcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICAgICAgbGV0IHF1ZXJ5TWF0Y2hlczogUXVlcnlNYXRjaFtdID0gdW5kZWZpbmVkITtcbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgdGhpcy5jb21waWxlck1vZHVsZS5FbGVtZW50QXN0KSB7XG4gICAgICAgIHRoaXMuZmluZFN0YXRpY1F1ZXJ5SWRzKG5vZGUuY2hpbGRyZW4sIHJlc3VsdCk7XG4gICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICBjb25zdCBjaGlsZERhdGEgPSByZXN1bHQuZ2V0KGNoaWxkKSE7XG4gICAgICAgICAgY2hpbGREYXRhLnN0YXRpY1F1ZXJ5SWRzLmZvckVhY2gocXVlcnlJZCA9PiBzdGF0aWNRdWVyeUlkcy5hZGQocXVlcnlJZCkpO1xuICAgICAgICAgIGNoaWxkRGF0YS5keW5hbWljUXVlcnlJZHMuZm9yRWFjaChxdWVyeUlkID0+IGR5bmFtaWNRdWVyeUlkcy5hZGQocXVlcnlJZCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcXVlcnlNYXRjaGVzID0gbm9kZS5xdWVyeU1hdGNoZXM7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUgaW5zdGFuY2VvZiB0aGlzLmNvbXBpbGVyTW9kdWxlLkVtYmVkZGVkVGVtcGxhdGVBc3QpIHtcbiAgICAgICAgdGhpcy5maW5kU3RhdGljUXVlcnlJZHMobm9kZS5jaGlsZHJlbiwgcmVzdWx0KTtcbiAgICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNoaWxkRGF0YSA9IHJlc3VsdC5nZXQoY2hpbGQpITtcbiAgICAgICAgICBjaGlsZERhdGEuc3RhdGljUXVlcnlJZHMuZm9yRWFjaChxdWVyeUlkID0+IGR5bmFtaWNRdWVyeUlkcy5hZGQocXVlcnlJZCkpO1xuICAgICAgICAgIGNoaWxkRGF0YS5keW5hbWljUXVlcnlJZHMuZm9yRWFjaChxdWVyeUlkID0+IGR5bmFtaWNRdWVyeUlkcy5hZGQocXVlcnlJZCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcXVlcnlNYXRjaGVzID0gbm9kZS5xdWVyeU1hdGNoZXM7XG4gICAgICB9XG4gICAgICBpZiAocXVlcnlNYXRjaGVzKSB7XG4gICAgICAgIHF1ZXJ5TWF0Y2hlcy5mb3JFYWNoKChtYXRjaCkgPT4gc3RhdGljUXVlcnlJZHMuYWRkKG1hdGNoLnF1ZXJ5SWQpKTtcbiAgICAgIH1cbiAgICAgIGR5bmFtaWNRdWVyeUlkcy5mb3JFYWNoKHF1ZXJ5SWQgPT4gc3RhdGljUXVlcnlJZHMuZGVsZXRlKHF1ZXJ5SWQpKTtcbiAgICAgIHJlc3VsdC5zZXQobm9kZSwge3N0YXRpY1F1ZXJ5SWRzLCBkeW5hbWljUXVlcnlJZHN9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG5cbmludGVyZmFjZSBTdGF0aWNBbmREeW5hbWljUXVlcnlJZHMge1xuICBzdGF0aWNRdWVyeUlkczogU2V0PG51bWJlcj47XG4gIGR5bmFtaWNRdWVyeUlkczogU2V0PG51bWJlcj47XG59XG5cbi8qKiBTcGxpdHMgcXVlcmllcyBpbnRvIHN0YXRpYyBhbmQgZHluYW1pYy4gKi9cbmZ1bmN0aW9uIHN0YXRpY1ZpZXdRdWVyeUlkcyhub2RlU3RhdGljUXVlcnlJZHM6IE1hcDxUZW1wbGF0ZUFzdCwgU3RhdGljQW5kRHluYW1pY1F1ZXJ5SWRzPik6XG4gICAgU3RhdGljQW5kRHluYW1pY1F1ZXJ5SWRzIHtcbiAgY29uc3Qgc3RhdGljUXVlcnlJZHMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgY29uc3QgZHluYW1pY1F1ZXJ5SWRzID0gbmV3IFNldDxudW1iZXI+KCk7XG4gIEFycmF5LmZyb20obm9kZVN0YXRpY1F1ZXJ5SWRzLnZhbHVlcygpKS5mb3JFYWNoKChlbnRyeSkgPT4ge1xuICAgIGVudHJ5LnN0YXRpY1F1ZXJ5SWRzLmZvckVhY2gocXVlcnlJZCA9PiBzdGF0aWNRdWVyeUlkcy5hZGQocXVlcnlJZCkpO1xuICAgIGVudHJ5LmR5bmFtaWNRdWVyeUlkcy5mb3JFYWNoKHF1ZXJ5SWQgPT4gZHluYW1pY1F1ZXJ5SWRzLmFkZChxdWVyeUlkKSk7XG4gIH0pO1xuICBkeW5hbWljUXVlcnlJZHMuZm9yRWFjaChxdWVyeUlkID0+IHN0YXRpY1F1ZXJ5SWRzLmRlbGV0ZShxdWVyeUlkKSk7XG4gIHJldHVybiB7c3RhdGljUXVlcnlJZHMsIGR5bmFtaWNRdWVyeUlkc307XG59XG4iXX0=