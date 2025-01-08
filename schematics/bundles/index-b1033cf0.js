'use strict';
/**
 * @license Angular v19.1.0-next.4+sha-00cc923
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

require('os');
require('typescript');
var checker = require('./checker-24b68d23.js');
require('./program-c810a4c2.js');
require('path');

/**
 * @module
 * @description
 * Entry point for all public APIs of the compiler-cli package.
 */
new checker.Version('19.1.0-next.4+sha-00cc923');

var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["debug"] = 0] = "debug";
    LogLevel[LogLevel["info"] = 1] = "info";
    LogLevel[LogLevel["warn"] = 2] = "warn";
    LogLevel[LogLevel["error"] = 3] = "error";
})(LogLevel || (LogLevel = {}));

checker.setFileSystem(new checker.NodeJSFileSystem());
