/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { defineInjectable } from '../../di/defs';
import { inject } from '../../di/injector';
import { defineNgModule } from '../../metadata/ng_module';
import * as r3 from '../index';
/**
 * A mapping of the @angular/core API surface used in generated expressions to the actual symbols.
 *
 * This should be kept up to date with the public exports of @angular/core.
 */
export var angularCoreEnv = {
    'ɵdefineComponent': r3.defineComponent,
    'defineInjectable': defineInjectable,
    'ɵdefineNgModule': defineNgModule,
    'ɵdirectiveInject': r3.directiveInject,
    'inject': inject,
    'ɵC': r3.C,
    'ɵE': r3.E,
    'ɵe': r3.e,
    'ɵi1': r3.i1,
    'ɵi2': r3.i2,
    'ɵi3': r3.i3,
    'ɵi4': r3.i4,
    'ɵi5': r3.i5,
    'ɵi6': r3.i6,
    'ɵi7': r3.i7,
    'ɵi8': r3.i8,
    'ɵT': r3.T,
    'ɵt': r3.t,
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ppdC9lbnZpcm9ubWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBUUEsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDeEQsT0FBTyxLQUFLLEVBQUUsTUFBTSxVQUFVLENBQUM7Ozs7OztBQVEvQixNQUFNLENBQUMsSUFBTSxjQUFjLEdBQUc7SUFDNUIsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLGVBQWU7SUFDdEMsa0JBQWtCLEVBQUUsZ0JBQWdCO0lBQ3BDLGlCQUFpQixFQUFFLGNBQWM7SUFDakMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLGVBQWU7SUFDdEMsUUFBUSxFQUFFLE1BQU07SUFDaEIsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ1YsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ1YsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ1YsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQ1osS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQ1osS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQ1osS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQ1osS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQ1osS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQ1osS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQ1osS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQ1osSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ1YsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0NBQ1gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaS9kZWZzJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge2RlZmluZU5nTW9kdWxlfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9uZ19tb2R1bGUnO1xuaW1wb3J0ICogYXMgcjMgZnJvbSAnLi4vaW5kZXgnO1xuXG5cbi8qKlxuICogQSBtYXBwaW5nIG9mIHRoZSBAYW5ndWxhci9jb3JlIEFQSSBzdXJmYWNlIHVzZWQgaW4gZ2VuZXJhdGVkIGV4cHJlc3Npb25zIHRvIHRoZSBhY3R1YWwgc3ltYm9scy5cbiAqXG4gKiBUaGlzIHNob3VsZCBiZSBrZXB0IHVwIHRvIGRhdGUgd2l0aCB0aGUgcHVibGljIGV4cG9ydHMgb2YgQGFuZ3VsYXIvY29yZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGFuZ3VsYXJDb3JlRW52ID0ge1xuICAnybVkZWZpbmVDb21wb25lbnQnOiByMy5kZWZpbmVDb21wb25lbnQsXG4gICdkZWZpbmVJbmplY3RhYmxlJzogZGVmaW5lSW5qZWN0YWJsZSxcbiAgJ8m1ZGVmaW5lTmdNb2R1bGUnOiBkZWZpbmVOZ01vZHVsZSxcbiAgJ8m1ZGlyZWN0aXZlSW5qZWN0JzogcjMuZGlyZWN0aXZlSW5qZWN0LFxuICAnaW5qZWN0JzogaW5qZWN0LFxuICAnybVDJzogcjMuQyxcbiAgJ8m1RSc6IHIzLkUsXG4gICfJtWUnOiByMy5lLFxuICAnybVpMSc6IHIzLmkxLFxuICAnybVpMic6IHIzLmkyLFxuICAnybVpMyc6IHIzLmkzLFxuICAnybVpNCc6IHIzLmk0LFxuICAnybVpNSc6IHIzLmk1LFxuICAnybVpNic6IHIzLmk2LFxuICAnybVpNyc6IHIzLmk3LFxuICAnybVpOCc6IHIzLmk4LFxuICAnybVUJzogcjMuVCxcbiAgJ8m1dCc6IHIzLnQsXG59O1xuIl19