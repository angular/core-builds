/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/static-queries/strategy_prompt", ["require", "exports", "@angular/core/schematics/utils/schematics_prompt"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_prompt_1 = require("@angular/core/schematics/utils/schematics_prompt");
    var SELECTED_STRATEGY;
    (function (SELECTED_STRATEGY) {
        SELECTED_STRATEGY[SELECTED_STRATEGY["TEMPLATE"] = 0] = "TEMPLATE";
        SELECTED_STRATEGY[SELECTED_STRATEGY["USAGE"] = 1] = "USAGE";
        SELECTED_STRATEGY[SELECTED_STRATEGY["TESTS"] = 2] = "TESTS";
    })(SELECTED_STRATEGY = exports.SELECTED_STRATEGY || (exports.SELECTED_STRATEGY = {}));
    /**
     * Prompts the user for the migration strategy that should be used. Defaults to the
     * template strategy as it provides a migration with rare manual corrections.
     * */
    function promptForMigrationStrategy(logger) {
        return __awaiter(this, void 0, void 0, function* () {
            if (schematics_prompt_1.supportsPrompt()) {
                logger.info('There are two available migration strategies that can be selected:');
                logger.info('  • Template strategy  -  migration tool (short-term gains, rare corrections)');
                logger.info('  • Usage strategy  -  best practices (long-term gains, manual corrections)');
                logger.info('For an easy migration, the template strategy is recommended. The usage');
                logger.info('strategy can be used for best practices and a code base that will be more');
                logger.info('flexible to changes going forward.');
                const { strategyName } = yield schematics_prompt_1.getInquirer().prompt({
                    type: 'list',
                    name: 'strategyName',
                    message: 'What migration strategy do you want to use?',
                    choices: [
                        { name: 'Template strategy', value: 'template' }, { name: 'Usage strategy', value: 'usage' }
                    ],
                    default: 'template',
                });
                logger.info('');
                return strategyName === 'usage' ? SELECTED_STRATEGY.USAGE : SELECTED_STRATEGY.TEMPLATE;
            }
            else {
                // In case prompts are not supported, we still want to allow developers to opt
                // into the usage strategy by specifying an environment variable. The tests also
                // use the environment variable as there is no headless way to select via prompt.
                return !!process.env['NG_STATIC_QUERY_USAGE_STRATEGY'] ? SELECTED_STRATEGY.USAGE :
                    SELECTED_STRATEGY.TEMPLATE;
            }
        });
    }
    exports.promptForMigrationStrategy = promptForMigrationStrategy;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyYXRlZ3lfcHJvbXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvc3RhdGljLXF1ZXJpZXMvc3RyYXRlZ3lfcHJvbXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFLSCx3RkFBMEU7SUFFMUUsSUFBWSxpQkFJWDtJQUpELFdBQVksaUJBQWlCO1FBQzNCLGlFQUFRLENBQUE7UUFDUiwyREFBSyxDQUFBO1FBQ0wsMkRBQUssQ0FBQTtJQUNQLENBQUMsRUFKVyxpQkFBaUIsR0FBakIseUJBQWlCLEtBQWpCLHlCQUFpQixRQUk1QjtJQUVEOzs7U0FHSztJQUNMLFNBQXNCLDBCQUEwQixDQUFDLE1BQXlCOztZQUN4RSxJQUFJLGtDQUFjLEVBQUUsRUFBRTtnQkFDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxvRUFBb0UsQ0FBQyxDQUFDO2dCQUNsRixNQUFNLENBQUMsSUFBSSxDQUFDLCtFQUErRSxDQUFDLENBQUM7Z0JBQzdGLE1BQU0sQ0FBQyxJQUFJLENBQUMsNkVBQTZFLENBQUMsQ0FBQztnQkFDM0YsTUFBTSxDQUFDLElBQUksQ0FBQyx3RUFBd0UsQ0FBQyxDQUFDO2dCQUN0RixNQUFNLENBQUMsSUFBSSxDQUFDLDJFQUEyRSxDQUFDLENBQUM7Z0JBQ3pGLE1BQU0sQ0FBQyxJQUFJLENBQUMsb0NBQW9DLENBQUMsQ0FBQztnQkFDbEQsTUFBTSxFQUFDLFlBQVksRUFBQyxHQUFHLE1BQU0sK0JBQVcsRUFBRSxDQUFDLE1BQU0sQ0FBeUI7b0JBQ3hFLElBQUksRUFBRSxNQUFNO29CQUNaLElBQUksRUFBRSxjQUFjO29CQUNwQixPQUFPLEVBQUUsNkNBQTZDO29CQUN0RCxPQUFPLEVBQUU7d0JBQ1AsRUFBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBQyxFQUFFLEVBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUM7cUJBQ3pGO29CQUNELE9BQU8sRUFBRSxVQUFVO2lCQUNwQixDQUFDLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDaEIsT0FBTyxZQUFZLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQzthQUN4RjtpQkFBTTtnQkFDTCw4RUFBOEU7Z0JBQzlFLGdGQUFnRjtnQkFDaEYsaUZBQWlGO2dCQUNqRixPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN6QixpQkFBaUIsQ0FBQyxRQUFRLENBQUM7YUFDckY7UUFDSCxDQUFDO0tBQUE7SUExQkQsZ0VBMEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbmltcG9ydCB7bG9nZ2luZ30gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuXG5pbXBvcnQge2dldElucXVpcmVyLCBzdXBwb3J0c1Byb21wdH0gZnJvbSAnLi4vLi4vdXRpbHMvc2NoZW1hdGljc19wcm9tcHQnO1xuXG5leHBvcnQgZW51bSBTRUxFQ1RFRF9TVFJBVEVHWSB7XG4gIFRFTVBMQVRFLFxuICBVU0FHRSxcbiAgVEVTVFMsXG59XG5cbi8qKlxuICogUHJvbXB0cyB0aGUgdXNlciBmb3IgdGhlIG1pZ3JhdGlvbiBzdHJhdGVneSB0aGF0IHNob3VsZCBiZSB1c2VkLiBEZWZhdWx0cyB0byB0aGVcbiAqIHRlbXBsYXRlIHN0cmF0ZWd5IGFzIGl0IHByb3ZpZGVzIGEgbWlncmF0aW9uIHdpdGggcmFyZSBtYW51YWwgY29ycmVjdGlvbnMuXG4gKiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByb21wdEZvck1pZ3JhdGlvblN0cmF0ZWd5KGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGkpIHtcbiAgaWYgKHN1cHBvcnRzUHJvbXB0KCkpIHtcbiAgICBsb2dnZXIuaW5mbygnVGhlcmUgYXJlIHR3byBhdmFpbGFibGUgbWlncmF0aW9uIHN0cmF0ZWdpZXMgdGhhdCBjYW4gYmUgc2VsZWN0ZWQ6Jyk7XG4gICAgbG9nZ2VyLmluZm8oJyAg4oCiIFRlbXBsYXRlIHN0cmF0ZWd5ICAtICBtaWdyYXRpb24gdG9vbCAoc2hvcnQtdGVybSBnYWlucywgcmFyZSBjb3JyZWN0aW9ucyknKTtcbiAgICBsb2dnZXIuaW5mbygnICDigKIgVXNhZ2Ugc3RyYXRlZ3kgIC0gIGJlc3QgcHJhY3RpY2VzIChsb25nLXRlcm0gZ2FpbnMsIG1hbnVhbCBjb3JyZWN0aW9ucyknKTtcbiAgICBsb2dnZXIuaW5mbygnRm9yIGFuIGVhc3kgbWlncmF0aW9uLCB0aGUgdGVtcGxhdGUgc3RyYXRlZ3kgaXMgcmVjb21tZW5kZWQuIFRoZSB1c2FnZScpO1xuICAgIGxvZ2dlci5pbmZvKCdzdHJhdGVneSBjYW4gYmUgdXNlZCBmb3IgYmVzdCBwcmFjdGljZXMgYW5kIGEgY29kZSBiYXNlIHRoYXQgd2lsbCBiZSBtb3JlJyk7XG4gICAgbG9nZ2VyLmluZm8oJ2ZsZXhpYmxlIHRvIGNoYW5nZXMgZ29pbmcgZm9yd2FyZC4nKTtcbiAgICBjb25zdCB7c3RyYXRlZ3lOYW1lfSA9IGF3YWl0IGdldElucXVpcmVyKCkucHJvbXB0PHtzdHJhdGVneU5hbWU6IHN0cmluZ30+KHtcbiAgICAgIHR5cGU6ICdsaXN0JyxcbiAgICAgIG5hbWU6ICdzdHJhdGVneU5hbWUnLFxuICAgICAgbWVzc2FnZTogJ1doYXQgbWlncmF0aW9uIHN0cmF0ZWd5IGRvIHlvdSB3YW50IHRvIHVzZT8nLFxuICAgICAgY2hvaWNlczogW1xuICAgICAgICB7bmFtZTogJ1RlbXBsYXRlIHN0cmF0ZWd5JywgdmFsdWU6ICd0ZW1wbGF0ZSd9LCB7bmFtZTogJ1VzYWdlIHN0cmF0ZWd5JywgdmFsdWU6ICd1c2FnZSd9XG4gICAgICBdLFxuICAgICAgZGVmYXVsdDogJ3RlbXBsYXRlJyxcbiAgICB9KTtcbiAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgcmV0dXJuIHN0cmF0ZWd5TmFtZSA9PT0gJ3VzYWdlJyA/IFNFTEVDVEVEX1NUUkFURUdZLlVTQUdFIDogU0VMRUNURURfU1RSQVRFR1kuVEVNUExBVEU7XG4gIH0gZWxzZSB7XG4gICAgLy8gSW4gY2FzZSBwcm9tcHRzIGFyZSBub3Qgc3VwcG9ydGVkLCB3ZSBzdGlsbCB3YW50IHRvIGFsbG93IGRldmVsb3BlcnMgdG8gb3B0XG4gICAgLy8gaW50byB0aGUgdXNhZ2Ugc3RyYXRlZ3kgYnkgc3BlY2lmeWluZyBhbiBlbnZpcm9ubWVudCB2YXJpYWJsZS4gVGhlIHRlc3RzIGFsc29cbiAgICAvLyB1c2UgdGhlIGVudmlyb25tZW50IHZhcmlhYmxlIGFzIHRoZXJlIGlzIG5vIGhlYWRsZXNzIHdheSB0byBzZWxlY3QgdmlhIHByb21wdC5cbiAgICByZXR1cm4gISFwcm9jZXNzLmVudlsnTkdfU1RBVElDX1FVRVJZX1VTQUdFX1NUUkFURUdZJ10gPyBTRUxFQ1RFRF9TVFJBVEVHWS5VU0FHRSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU0VMRUNURURfU1RSQVRFR1kuVEVNUExBVEU7XG4gIH1cbn1cbiJdfQ==