'use strict';
/**
 * @license Angular v19.1.6+sha-164facb
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
new checker.Version('19.1.6+sha-164facb');

var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["debug"] = 0] = "debug";
    LogLevel[LogLevel["info"] = 1] = "info";
    LogLevel[LogLevel["warn"] = 2] = "warn";
    LogLevel[LogLevel["error"] = 3] = "error";
})(LogLevel || (LogLevel = {}));

checker.setFileSystem(new checker.NodeJSFileSystem());
