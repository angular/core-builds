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
            console.error('Please make sure that there is no compilation failure. The migration');
            console.error('can be rerun with: "ng update @angular/core --from 7 --to 8 --migrate-only"');
        }
        _getViewQueryUniqueKey(filePath, className, propName) {
            return `${path_1.resolve(filePath)}#${className}-${propName}`;
        }
    }
    exports.QueryTemplateStrategy = QueryTemplateStrategy;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9zdHJhdGVnaWVzL3RlbXBsYXRlX3N0cmF0ZWd5L3RlbXBsYXRlX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsZ0RBQTJPO0lBQzNPLHdEQUFtRjtJQUNuRiwrQkFBNkI7SUFHN0IsMkZBQStFO0lBRS9FLGtIQUF5RjtJQUd6RixNQUFNLHVDQUF1QyxHQUFHLCtDQUErQztRQUMzRixnREFBZ0QsQ0FBQztJQUVyRCxNQUFhLHFCQUFxQjtRQUtoQyxZQUNZLFdBQW1CLEVBQVUsYUFBK0IsRUFDNUQsSUFBcUI7WUFEckIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFBVSxrQkFBYSxHQUFiLGFBQWEsQ0FBa0I7WUFDNUQsU0FBSSxHQUFKLElBQUksQ0FBaUI7WUFOekIsYUFBUSxHQUFxQixJQUFJLENBQUM7WUFDbEMscUJBQWdCLEdBQWlDLElBQUksQ0FBQztZQUN0RCxvQkFBZSxHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1FBSXJCLENBQUM7UUFFckM7OztXQUdHO1FBQ0gsS0FBSztZQUNILE1BQU0sRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLEdBQUcsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sVUFBVSxHQUFHLDRCQUFhLENBQUMsRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQztZQUV4RSx1RkFBdUY7WUFDdkYsdUZBQXVGO1lBQ3ZGLHNGQUFzRjtZQUN0RixJQUFJLENBQUMsUUFBUSxHQUFJLFVBQWtCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxRQUFVLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUU3RCx5RkFBeUY7WUFDekYsdUZBQXVGO1lBQ3ZGLHNGQUFzRjtZQUN0RixzRkFBc0Y7WUFDdEYsOEZBQThGO1lBQzlGLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLGdCQUFrQixDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDNUUsbUJBQW1CLENBQUMsc0JBQXNCLENBQUMsR0FBRyxVQUFTLFFBQW1DO2dCQUN4RixPQUFPLElBQUksb0NBQXlCLENBQ2hDLEVBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVcsRUFBQyxDQUFDLENBQUM7WUFDakYsQ0FBQyxDQUFDO1lBRUYsMEVBQTBFO1lBQzFFLHVEQUF1RDtZQUN2RCxNQUFNLGVBQWUsR0FBSSxVQUFrQixDQUFDLGlCQUFpQixDQUFzQixDQUFDO1lBRXBGLE1BQU0sYUFBYSxHQUFHO2dCQUNwQixHQUFHLFVBQVUsQ0FBQywwQkFBMEIsRUFBRTtnQkFDMUMsR0FBRyxVQUFVLENBQUMsd0JBQXdCLEVBQUU7YUFDekMsQ0FBQztZQUVGLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRTtnQkFDeEIsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLEtBQUssQ0FBQzthQUNkO1lBRUQsZUFBZSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ25DLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQzNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRUQsd0ZBQXdGO1FBQ2hGLGlCQUFpQixDQUFDLE1BQW9CLEVBQUUsZUFBa0M7WUFDaEYsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGdCQUFrQixDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFdkUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ3RDLE9BQU87YUFDUjtZQUVELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sY0FBYyxHQUFHLDZCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzFELE1BQU0sRUFBQyxjQUFjLEVBQUMsR0FBRyw2QkFBa0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUU1RCxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDNUMsMkVBQTJFO2dCQUMzRSwrRUFBK0U7Z0JBQy9FLE1BQU0sT0FBTyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7Z0JBQzFCLE1BQU0sUUFBUSxHQUNWLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNsRixJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FDcEIsUUFBUSxFQUFFLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLDhCQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyw4QkFBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hGLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELGtEQUFrRDtRQUNsRCxZQUFZLENBQUMsS0FBd0I7WUFDbkMsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLDRCQUFTLENBQUMsWUFBWSxFQUFFO2dCQUN6QyxPQUFPLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsbURBQW1ELEVBQUMsQ0FBQzthQUNyRjtpQkFBTSxJQUFJLENBQUMsbUNBQW1CLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDcEQsNkVBQTZFO2dCQUM3RSx1RUFBdUU7Z0JBQ3ZFLE9BQU8sRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxxQ0FBcUMsRUFBQyxDQUFDO2FBQ3ZFO1lBRUQsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQzlDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUU5RCwwRUFBMEU7WUFDMUUseUVBQXlFO1lBQ3pFLHlFQUF5RTtZQUN6RSx5REFBeUQ7WUFDekQsSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFO2dCQUMxRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFFNUUsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO29CQUNuQixPQUFPLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsdUNBQXVDLEVBQUMsQ0FBQztpQkFDekU7Z0JBRUQsT0FBTyxFQUFDLE1BQU0sRUFBQyxDQUFDO2FBQ2pCO1lBRUQsSUFBSSxjQUFjLEdBQXFCLElBQUksQ0FBQztZQUM1QyxJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7WUFFM0IsNEZBQTRGO1lBQzVGLHdGQUF3RjtZQUN4Riw2RkFBNkY7WUFDN0YsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDckUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFFM0UsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO29CQUN4QixPQUFPO2lCQUNSO2dCQUVELG1GQUFtRjtnQkFDbkYsZ0ZBQWdGO2dCQUNoRixnRkFBZ0Y7Z0JBQ2hGLElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtvQkFDM0IsY0FBYyxHQUFHLFdBQVcsQ0FBQztpQkFDOUI7cUJBQU0sSUFBSSxjQUFjLEtBQUssV0FBVyxFQUFFO29CQUN6QyxjQUFjLEdBQUcsSUFBSSxDQUFDO2lCQUN2QjtZQUNILENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxjQUFjLEtBQUssSUFBSSxFQUFFO2dCQUMzQixPQUFPLEVBQUMsTUFBTSxFQUFFLDhCQUFXLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSx1Q0FBdUMsRUFBQyxDQUFDO2FBQ3hGO2lCQUFNLElBQUksY0FBYyxFQUFFO2dCQUN6QixPQUFPLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsMkRBQTJELEVBQUMsQ0FBQzthQUM3RjtZQUNELE9BQU8sRUFBQyxNQUFNLEVBQUUsY0FBYyxFQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVEOzs7V0FHRztRQUNLLHdCQUF3QixDQUFDLFNBQThCLEVBQUUsU0FBaUI7WUFFaEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUU7Z0JBQ25CLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFDRCxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsUUFBUSxDQUFDO1lBQ3BELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFdkYsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDdEMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUcsQ0FBQzthQUM3QztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVPLGNBQWMsQ0FBQyxTQUFtQyxFQUFFLFFBQWlDO1lBRTNGLE9BQU8sSUFBSTtpQkFDTixRQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUM7aUJBQ3ZGLFFBQVEsQ0FBQztRQUNoQixDQUFDO1FBRU8sd0JBQXdCLENBQUMsV0FBeUM7WUFDeEUsT0FBTyxDQUFDLEtBQUssQ0FBQyxrRUFBa0UsQ0FBQyxDQUFDO1lBQ2xGLE9BQU8sQ0FBQyxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztZQUM1RCxPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUQsT0FBTyxDQUFDLEtBQUssQ0FBQyxzRUFBc0UsQ0FBQyxDQUFDO1lBQ3RGLE9BQU8sQ0FBQyxLQUFLLENBQUMsNkVBQTZFLENBQUMsQ0FBQztRQUMvRixDQUFDO1FBRU8sc0JBQXNCLENBQUMsUUFBZ0IsRUFBRSxTQUFpQixFQUFFLFFBQWdCO1lBQ2xGLE9BQU8sR0FBRyxjQUFPLENBQUMsUUFBUSxDQUFDLElBQUksU0FBUyxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ3pELENBQUM7S0FDRjtJQTVLRCxzREE0S0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QW90Q29tcGlsZXIsIENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSwgQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXIsIENvbXBpbGVOZ01vZHVsZU1ldGFkYXRhLCBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhLCBOZ0FuYWx5emVkTW9kdWxlcywgU3RhdGljU3ltYm9sLCBUZW1wbGF0ZUFzdCwgZmluZFN0YXRpY1F1ZXJ5SWRzLCBzdGF0aWNWaWV3UXVlcnlJZHN9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7RGlhZ25vc3RpYywgY3JlYXRlUHJvZ3JhbSwgcmVhZENvbmZpZ3VyYXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaSc7XG5pbXBvcnQge3Jlc29sdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7aGFzUHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcbmltcG9ydCB7Q2xhc3NNZXRhZGF0YU1hcH0gZnJvbSAnLi4vLi4vYW5ndWxhci9uZ19xdWVyeV92aXNpdG9yJztcbmltcG9ydCB7TmdRdWVyeURlZmluaXRpb24sIFF1ZXJ5VGltaW5nLCBRdWVyeVR5cGV9IGZyb20gJy4uLy4uL2FuZ3VsYXIvcXVlcnktZGVmaW5pdGlvbic7XG5pbXBvcnQge1RpbWluZ1Jlc3VsdCwgVGltaW5nU3RyYXRlZ3l9IGZyb20gJy4uL3RpbWluZy1zdHJhdGVneSc7XG5cbmNvbnN0IFFVRVJZX05PVF9ERUNMQVJFRF9JTl9DT01QT05FTlRfTUVTU0FHRSA9ICdUaW1pbmcgY291bGQgbm90IGJlIGRldGVybWluZWQuIFRoaXMgaGFwcGVucyAnICtcbiAgICAnaWYgdGhlIHF1ZXJ5IGlzIG5vdCBkZWNsYXJlZCBpbiBhbnkgY29tcG9uZW50Lic7XG5cbmV4cG9ydCBjbGFzcyBRdWVyeVRlbXBsYXRlU3RyYXRlZ3kgaW1wbGVtZW50cyBUaW1pbmdTdHJhdGVneSB7XG4gIHByaXZhdGUgY29tcGlsZXI6IEFvdENvbXBpbGVyfG51bGwgPSBudWxsO1xuICBwcml2YXRlIG1ldGFkYXRhUmVzb2x2ZXI6IENvbXBpbGVNZXRhZGF0YVJlc29sdmVyfG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFuYWx5emVkUXVlcmllcyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeVRpbWluZz4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgcHJvamVjdFBhdGg6IHN0cmluZywgcHJpdmF0ZSBjbGFzc01ldGFkYXRhOiBDbGFzc01ldGFkYXRhTWFwLFxuICAgICAgcHJpdmF0ZSBob3N0OiB0cy5Db21waWxlckhvc3QpIHt9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgdGhlIHRlbXBsYXRlIHN0cmF0ZWd5IGJ5IGNyZWF0aW5nIHRoZSBBbmd1bGFyQ29tcGlsZXJQcm9ncmFtLiBSZXR1cm5zIGZhbHNlIGlmXG4gICAqIHRoZSBBT1QgY29tcGlsZXIgcHJvZ3JhbSBjb3VsZCBub3QgYmUgY3JlYXRlZCBkdWUgdG8gZmFpbHVyZSBkaWFnbm9zdGljcy5cbiAgICovXG4gIHNldHVwKCkge1xuICAgIGNvbnN0IHtyb290TmFtZXMsIG9wdGlvbnN9ID0gcmVhZENvbmZpZ3VyYXRpb24odGhpcy5wcm9qZWN0UGF0aCk7XG4gICAgY29uc3QgYW90UHJvZ3JhbSA9IGNyZWF0ZVByb2dyYW0oe3Jvb3ROYW1lcywgb3B0aW9ucywgaG9zdDogdGhpcy5ob3N0fSk7XG5cbiAgICAvLyBUaGUgXCJBbmd1bGFyQ29tcGlsZXJQcm9ncmFtXCIgZG9lcyBub3QgZXhwb3NlIHRoZSBcIkFvdENvbXBpbGVyXCIgaW5zdGFuY2UsIG5vciBkb2VzIGl0XG4gICAgLy8gZXhwb3NlIHRoZSBsb2dpYyB0aGF0IGlzIG5lY2Vzc2FyeSB0byBhbmFseXplIHRoZSBkZXRlcm1pbmVkIG1vZHVsZXMuIFdlIHdvcmsgYXJvdW5kXG4gICAgLy8gdGhpcyBieSBqdXN0IGFjY2Vzc2luZyB0aGUgbmVjZXNzYXJ5IHByaXZhdGUgcHJvcGVydGllcyB1c2luZyB0aGUgYnJhY2tldCBub3RhdGlvbi5cbiAgICB0aGlzLmNvbXBpbGVyID0gKGFvdFByb2dyYW0gYXMgYW55KVsnY29tcGlsZXInXTtcbiAgICB0aGlzLm1ldGFkYXRhUmVzb2x2ZXIgPSB0aGlzLmNvbXBpbGVyICFbJ19tZXRhZGF0YVJlc29sdmVyJ107XG5cbiAgICAvLyBNb2RpZnkgdGhlIFwiRGlyZWN0aXZlTm9ybWFsaXplclwiIHRvIG5vdCBub3JtYWxpemUgYW55IHJlZmVyZW5jZWQgZXh0ZXJuYWwgc3R5bGVzaGVldHMuXG4gICAgLy8gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBpbiBDTEkgcHJvamVjdHMgcHJlcHJvY2Vzc29yIGZpbGVzIGFyZSBjb21tb25seSByZWZlcmVuY2VkXG4gICAgLy8gYW5kIHdlIGRvbid0IHdhbnQgdG8gcGFyc2UgdGhlbSBpbiBvcmRlciB0byBleHRyYWN0IHJlbGF0aXZlIHN0eWxlIHJlZmVyZW5jZXMuIFRoaXNcbiAgICAvLyBicmVha3MgdGhlIGFuYWx5c2lzIG9mIHRoZSBwcm9qZWN0IGJlY2F1c2Ugd2UgaW5zdGFudGlhdGUgYSBzdGFuZGFsb25lIEFPVCBjb21waWxlclxuICAgIC8vIHByb2dyYW0gd2hpY2ggZG9lcyBub3QgY29udGFpbiB0aGUgY3VzdG9tIGxvZ2ljIGJ5IHRoZSBBbmd1bGFyIENMSSBXZWJwYWNrIGNvbXBpbGVyIHBsdWdpbi5cbiAgICBjb25zdCBkaXJlY3RpdmVOb3JtYWxpemVyID0gdGhpcy5tZXRhZGF0YVJlc29sdmVyICFbJ19kaXJlY3RpdmVOb3JtYWxpemVyJ107XG4gICAgZGlyZWN0aXZlTm9ybWFsaXplclsnX25vcm1hbGl6ZVN0eWxlc2hlZXQnXSA9IGZ1bmN0aW9uKG1ldGFkYXRhOiBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhKSB7XG4gICAgICByZXR1cm4gbmV3IENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEoXG4gICAgICAgICAge3N0eWxlczogbWV0YWRhdGEuc3R5bGVzLCBzdHlsZVVybHM6IFtdLCBtb2R1bGVVcmw6IG1ldGFkYXRhLm1vZHVsZVVybCAhfSk7XG4gICAgfTtcblxuICAgIC8vIFJldHJpZXZlcyB0aGUgYW5hbHl6ZWQgbW9kdWxlcyBvZiB0aGUgY3VycmVudCBwcm9ncmFtLiBUaGlzIGRhdGEgY2FuIGJlXG4gICAgLy8gdXNlZCB0byBkZXRlcm1pbmUgdGhlIHRpbWluZyBmb3IgcmVnaXN0ZXJlZCBxdWVyaWVzLlxuICAgIGNvbnN0IGFuYWx5emVkTW9kdWxlcyA9IChhb3RQcm9ncmFtIGFzIGFueSlbJ2FuYWx5emVkTW9kdWxlcyddIGFzIE5nQW5hbHl6ZWRNb2R1bGVzO1xuXG4gICAgY29uc3QgbmdEaWFnbm9zdGljcyA9IFtcbiAgICAgIC4uLmFvdFByb2dyYW0uZ2V0TmdTdHJ1Y3R1cmFsRGlhZ25vc3RpY3MoKSxcbiAgICAgIC4uLmFvdFByb2dyYW0uZ2V0TmdTZW1hbnRpY0RpYWdub3N0aWNzKCksXG4gICAgXTtcblxuICAgIGlmIChuZ0RpYWdub3N0aWNzLmxlbmd0aCkge1xuICAgICAgdGhpcy5fcHJpbnREaWFnbm9zdGljRmFpbHVyZXMobmdEaWFnbm9zdGljcyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgYW5hbHl6ZWRNb2R1bGVzLmZpbGVzLmZvckVhY2goZmlsZSA9PiB7XG4gICAgICBmaWxlLmRpcmVjdGl2ZXMuZm9yRWFjaChkaXJlY3RpdmUgPT4gdGhpcy5fYW5hbHl6ZURpcmVjdGl2ZShkaXJlY3RpdmUsIGFuYWx5emVkTW9kdWxlcykpO1xuICAgIH0pO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqIEFuYWx5emVzIGEgZ2l2ZW4gZGlyZWN0aXZlIGJ5IGRldGVybWluaW5nIHRoZSB0aW1pbmcgb2YgYWxsIG1hdGNoZWQgdmlldyBxdWVyaWVzLiAqL1xuICBwcml2YXRlIF9hbmFseXplRGlyZWN0aXZlKHN5bWJvbDogU3RhdGljU3ltYm9sLCBhbmFseXplZE1vZHVsZXM6IE5nQW5hbHl6ZWRNb2R1bGVzKSB7XG4gICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLm1ldGFkYXRhUmVzb2x2ZXIgIS5nZXREaXJlY3RpdmVNZXRhZGF0YShzeW1ib2wpO1xuICAgIGNvbnN0IG5nTW9kdWxlID0gYW5hbHl6ZWRNb2R1bGVzLm5nTW9kdWxlQnlQaXBlT3JEaXJlY3RpdmUuZ2V0KHN5bWJvbCk7XG5cbiAgICBpZiAoIW1ldGFkYXRhLmlzQ29tcG9uZW50IHx8ICFuZ01vZHVsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBhcnNlZFRlbXBsYXRlID0gdGhpcy5fcGFyc2VUZW1wbGF0ZShtZXRhZGF0YSwgbmdNb2R1bGUpO1xuICAgIGNvbnN0IHF1ZXJ5VGltaW5nTWFwID0gZmluZFN0YXRpY1F1ZXJ5SWRzKHBhcnNlZFRlbXBsYXRlKTtcbiAgICBjb25zdCB7c3RhdGljUXVlcnlJZHN9ID0gc3RhdGljVmlld1F1ZXJ5SWRzKHF1ZXJ5VGltaW5nTWFwKTtcblxuICAgIG1ldGFkYXRhLnZpZXdRdWVyaWVzLmZvckVhY2goKHF1ZXJ5LCBpbmRleCkgPT4ge1xuICAgICAgLy8gUXVlcnkgaWRzIGFyZSBjb21wdXRlZCBieSBhZGRpbmcgXCJvbmVcIiB0byB0aGUgaW5kZXguIFRoaXMgaXMgZG9uZSB3aXRoaW5cbiAgICAgIC8vIHRoZSBcInZpZXdfY29tcGlsZXIudHNcIiBpbiBvcmRlciB0byBzdXBwb3J0IHVzaW5nIGEgYmxvb20gZmlsdGVyIGZvciBxdWVyaWVzLlxuICAgICAgY29uc3QgcXVlcnlJZCA9IGluZGV4ICsgMTtcbiAgICAgIGNvbnN0IHF1ZXJ5S2V5ID1cbiAgICAgICAgICB0aGlzLl9nZXRWaWV3UXVlcnlVbmlxdWVLZXkoc3ltYm9sLmZpbGVQYXRoLCBzeW1ib2wubmFtZSwgcXVlcnkucHJvcGVydHlOYW1lKTtcbiAgICAgIHRoaXMuYW5hbHl6ZWRRdWVyaWVzLnNldChcbiAgICAgICAgICBxdWVyeUtleSwgc3RhdGljUXVlcnlJZHMuaGFzKHF1ZXJ5SWQpID8gUXVlcnlUaW1pbmcuU1RBVElDIDogUXVlcnlUaW1pbmcuRFlOQU1JQyk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogRGV0ZWN0cyB0aGUgdGltaW5nIG9mIHRoZSBxdWVyeSBkZWZpbml0aW9uLiAqL1xuICBkZXRlY3RUaW1pbmcocXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uKTogVGltaW5nUmVzdWx0IHtcbiAgICBpZiAocXVlcnkudHlwZSA9PT0gUXVlcnlUeXBlLkNvbnRlbnRDaGlsZCkge1xuICAgICAgcmV0dXJuIHt0aW1pbmc6IG51bGwsIG1lc3NhZ2U6ICdDb250ZW50IHF1ZXJpZXMgY2Fubm90IGJlIG1pZ3JhdGVkIGF1dG9tYXRpY2FsbHkuJ307XG4gICAgfSBlbHNlIGlmICghaGFzUHJvcGVydHlOYW1lVGV4dChxdWVyeS5wcm9wZXJ0eS5uYW1lKSkge1xuICAgICAgLy8gSW4gY2FzZSB0aGUgcXVlcnkgcHJvcGVydHkgbmFtZSBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLCB3ZSBtYXJrIHRoaXNcbiAgICAgIC8vIHF1ZXJ5IGFzIHVucmVzb2x2ZWQuIE5HQyBjdXJyZW50bHkgc2tpcHMgdGhlc2UgdmlldyBxdWVyaWVzIGFzIHdlbGwuXG4gICAgICByZXR1cm4ge3RpbWluZzogbnVsbCwgbWVzc2FnZTogJ1F1ZXJ5IGlzIG5vdCBzdGF0aWNhbGx5IGFuYWx5emFibGUuJ307XG4gICAgfVxuXG4gICAgY29uc3QgcHJvcGVydHlOYW1lID0gcXVlcnkucHJvcGVydHkubmFtZS50ZXh0O1xuICAgIGNvbnN0IGNsYXNzTWV0YWRhdGEgPSB0aGlzLmNsYXNzTWV0YWRhdGEuZ2V0KHF1ZXJ5LmNvbnRhaW5lcik7XG5cbiAgICAvLyBJbiBjYXNlIHRoZXJlIGlzIG5vIGNsYXNzIG1ldGFkYXRhIG9yIHRoZXJlIGFyZSBubyBkZXJpdmVkIGNsYXNzZXMgdGhhdFxuICAgIC8vIGNvdWxkIGFjY2VzcyB0aGUgY3VycmVudCBxdWVyeSwgd2UganVzdCBsb29rIGZvciB0aGUgcXVlcnkgYW5hbHlzaXMgb2ZcbiAgICAvLyB0aGUgY2xhc3MgdGhhdCBkZWNsYXJlcyB0aGUgcXVlcnkuIGUuZy4gb25seSB0aGUgdGVtcGxhdGUgb2YgdGhlIGNsYXNzXG4gICAgLy8gdGhhdCBkZWNsYXJlcyB0aGUgdmlldyBxdWVyeSBhZmZlY3RzIHRoZSBxdWVyeSB0aW1pbmcuXG4gICAgaWYgKCFjbGFzc01ldGFkYXRhIHx8ICFjbGFzc01ldGFkYXRhLmRlcml2ZWRDbGFzc2VzLmxlbmd0aCkge1xuICAgICAgY29uc3QgdGltaW5nID0gdGhpcy5fZ2V0UXVlcnlUaW1pbmdGcm9tQ2xhc3MocXVlcnkuY29udGFpbmVyLCBwcm9wZXJ0eU5hbWUpO1xuXG4gICAgICBpZiAodGltaW5nID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB7dGltaW5nOiBudWxsLCBtZXNzYWdlOiBRVUVSWV9OT1RfREVDTEFSRURfSU5fQ09NUE9ORU5UX01FU1NBR0V9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge3RpbWluZ307XG4gICAgfVxuXG4gICAgbGV0IHJlc29sdmVkVGltaW5nOiBRdWVyeVRpbWluZ3xudWxsID0gbnVsbDtcbiAgICBsZXQgdGltaW5nTWlzbWF0Y2ggPSBmYWxzZTtcblxuICAgIC8vIEluIGNhc2UgdGhlcmUgYXJlIG11bHRpcGxlIGNvbXBvbmVudHMgdGhhdCB1c2UgdGhlIHNhbWUgcXVlcnkgKGUuZy4gdGhyb3VnaCBpbmhlcml0YW5jZSksXG4gICAgLy8gd2UgbmVlZCB0byBjaGVjayBpZiBhbGwgY29tcG9uZW50cyB1c2UgdGhlIHF1ZXJ5IHdpdGggdGhlIHNhbWUgdGltaW5nLiBJZiB0aGF0IGlzIG5vdFxuICAgIC8vIHRoZSBjYXNlLCB0aGUgcXVlcnkgdGltaW5nIGlzIGFtYmlndW91cyBhbmQgdGhlIGRldmVsb3BlciBuZWVkcyB0byBmaXggdGhlIHF1ZXJ5IG1hbnVhbGx5LlxuICAgIFtxdWVyeS5jb250YWluZXIsIC4uLmNsYXNzTWV0YWRhdGEuZGVyaXZlZENsYXNzZXNdLmZvckVhY2goY2xhc3NEZWNsID0+IHtcbiAgICAgIGNvbnN0IGNsYXNzVGltaW5nID0gdGhpcy5fZ2V0UXVlcnlUaW1pbmdGcm9tQ2xhc3MoY2xhc3NEZWNsLCBwcm9wZXJ0eU5hbWUpO1xuXG4gICAgICBpZiAoY2xhc3NUaW1pbmcgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBJbiBjYXNlIHRoZXJlIGlzIG5vIHJlc29sdmVkIHRpbWluZyB5ZXQsIHNhdmUgdGhlIG5ldyB0aW1pbmcuIFRpbWluZ3MgZnJvbSBvdGhlclxuICAgICAgLy8gY29tcG9uZW50cyB0aGF0IHVzZSB0aGUgcXVlcnkgd2l0aCBhIGRpZmZlcmVudCB0aW1pbmcsIGNhdXNlIHRoZSB0aW1pbmcgdG8gYmVcbiAgICAgIC8vIG1pc21hdGNoZWQuIEluIHRoYXQgY2FzZSB3ZSBjYW4ndCBkZXRlY3QgYSB3b3JraW5nIHRpbWluZyBmb3IgYWxsIGNvbXBvbmVudHMuXG4gICAgICBpZiAocmVzb2x2ZWRUaW1pbmcgPT09IG51bGwpIHtcbiAgICAgICAgcmVzb2x2ZWRUaW1pbmcgPSBjbGFzc1RpbWluZztcbiAgICAgIH0gZWxzZSBpZiAocmVzb2x2ZWRUaW1pbmcgIT09IGNsYXNzVGltaW5nKSB7XG4gICAgICAgIHRpbWluZ01pc21hdGNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChyZXNvbHZlZFRpbWluZyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHt0aW1pbmc6IFF1ZXJ5VGltaW5nLkRZTkFNSUMsIG1lc3NhZ2U6IFFVRVJZX05PVF9ERUNMQVJFRF9JTl9DT01QT05FTlRfTUVTU0FHRX07XG4gICAgfSBlbHNlIGlmICh0aW1pbmdNaXNtYXRjaCkge1xuICAgICAgcmV0dXJuIHt0aW1pbmc6IG51bGwsIG1lc3NhZ2U6ICdNdWx0aXBsZSBjb21wb25lbnRzIHVzZSB0aGUgcXVlcnkgd2l0aCBkaWZmZXJlbnQgdGltaW5ncy4nfTtcbiAgICB9XG4gICAgcmV0dXJuIHt0aW1pbmc6IHJlc29sdmVkVGltaW5nfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0aW1pbmcgdGhhdCBoYXMgYmVlbiByZXNvbHZlZCBmb3IgYSBnaXZlbiBxdWVyeSB3aGVuIGl0J3MgdXNlZCB3aXRoaW4gdGhlXG4gICAqIHNwZWNpZmllZCBjbGFzcyBkZWNsYXJhdGlvbi4gZS5nLiBxdWVyaWVzIGZyb20gYW4gaW5oZXJpdGVkIGNsYXNzIGNhbiBiZSB1c2VkLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0UXVlcnlUaW1pbmdGcm9tQ2xhc3MoY2xhc3NEZWNsOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBxdWVyeU5hbWU6IHN0cmluZyk6IFF1ZXJ5VGltaW5nXG4gICAgICB8bnVsbCB7XG4gICAgaWYgKCFjbGFzc0RlY2wubmFtZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGZpbGVQYXRoID0gY2xhc3NEZWNsLmdldFNvdXJjZUZpbGUoKS5maWxlTmFtZTtcbiAgICBjb25zdCBxdWVyeUtleSA9IHRoaXMuX2dldFZpZXdRdWVyeVVuaXF1ZUtleShmaWxlUGF0aCwgY2xhc3NEZWNsLm5hbWUudGV4dCwgcXVlcnlOYW1lKTtcblxuICAgIGlmICh0aGlzLmFuYWx5emVkUXVlcmllcy5oYXMocXVlcnlLZXkpKSB7XG4gICAgICByZXR1cm4gdGhpcy5hbmFseXplZFF1ZXJpZXMuZ2V0KHF1ZXJ5S2V5KSAhO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX3BhcnNlVGVtcGxhdGUoY29tcG9uZW50OiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsIG5nTW9kdWxlOiBDb21waWxlTmdNb2R1bGVNZXRhZGF0YSk6XG4gICAgICBUZW1wbGF0ZUFzdFtdIHtcbiAgICByZXR1cm4gdGhpc1xuICAgICAgICAuY29tcGlsZXIgIVsnX3BhcnNlVGVtcGxhdGUnXShjb21wb25lbnQsIG5nTW9kdWxlLCBuZ01vZHVsZS50cmFuc2l0aXZlTW9kdWxlLmRpcmVjdGl2ZXMpXG4gICAgICAgIC50ZW1wbGF0ZTtcbiAgfVxuXG4gIHByaXZhdGUgX3ByaW50RGlhZ25vc3RpY0ZhaWx1cmVzKGRpYWdub3N0aWNzOiAodHMuRGlhZ25vc3RpY3xEaWFnbm9zdGljKVtdKSB7XG4gICAgY29uc29sZS5lcnJvcignQ291bGQgbm90IGNyZWF0ZSBBbmd1bGFyIEFPVCBjb21waWxlciB0byBkZXRlcm1pbmUgcXVlcnkgdGltaW5nLicpO1xuICAgIGNvbnNvbGUuZXJyb3IoJ1RoZSBmb2xsb3dpbmcgZGlhZ25vc3RpY3Mgd2VyZSBkZXRlY3RlZDpcXG4nKTtcbiAgICBjb25zb2xlLmVycm9yKGRpYWdub3N0aWNzLm1hcChkID0+IGQubWVzc2FnZVRleHQpLmpvaW4oYFxcbmApKTtcbiAgICBjb25zb2xlLmVycm9yKCdQbGVhc2UgbWFrZSBzdXJlIHRoYXQgdGhlcmUgaXMgbm8gY29tcGlsYXRpb24gZmFpbHVyZS4gVGhlIG1pZ3JhdGlvbicpO1xuICAgIGNvbnNvbGUuZXJyb3IoJ2NhbiBiZSByZXJ1biB3aXRoOiBcIm5nIHVwZGF0ZSBAYW5ndWxhci9jb3JlIC0tZnJvbSA3IC0tdG8gOCAtLW1pZ3JhdGUtb25seVwiJyk7XG4gIH1cblxuICBwcml2YXRlIF9nZXRWaWV3UXVlcnlVbmlxdWVLZXkoZmlsZVBhdGg6IHN0cmluZywgY2xhc3NOYW1lOiBzdHJpbmcsIHByb3BOYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYCR7cmVzb2x2ZShmaWxlUGF0aCl9IyR7Y2xhc3NOYW1lfS0ke3Byb3BOYW1lfWA7XG4gIH1cbn1cbiJdfQ==