'use strict';
/**
 * @license Angular v19.1.7+sha-da25071
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

require('os');
require('typescript');
var checker = require('./checker-2bdbb582.js');
require('./program-f43dcb10.js');
require('path');

/**
 * @module
 * @description
 * Entry point for all public APIs of the compiler-cli package.
 */
new checker.Version('19.1.7+sha-da25071');

var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["debug"] = 0] = "debug";
    LogLevel[LogLevel["info"] = 1] = "info";
    LogLevel[LogLevel["warn"] = 2] = "warn";
    LogLevel[LogLevel["error"] = 3] = "error";
})(LogLevel || (LogLevel = {}));

checker.setFileSystem(new checker.NodeJSFileSystem());
