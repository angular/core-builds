var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve3, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve3(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// bazel-out/k8-fastbuild/bin/packages/core/schematics/ng-generate/inject-migration/index.mjs
var inject_migration_exports = {};
__export(inject_migration_exports, {
  default: () => inject_migration_default
});
module.exports = __toCommonJS(inject_migration_exports);
var import_schematics = require("@angular-devkit/schematics");
var import_path3 = require("path");

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/change_tracker.mjs
var import_typescript2 = __toESM(require("typescript"), 1);

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/import_manager.mjs
var import_path = require("path");
var import_typescript = __toESM(require("typescript"), 1);
var ImportManager = class {
  constructor(getUpdateRecorder, printer) {
    __publicField(this, "getUpdateRecorder");
    __publicField(this, "printer");
    __publicField(this, "updatedImports", /* @__PURE__ */ new Map());
    __publicField(this, "usedIdentifierNames", /* @__PURE__ */ new Map());
    __publicField(this, "newImports", /* @__PURE__ */ new Map());
    __publicField(this, "quoteStyles", {});
    __publicField(this, "importCache", []);
    this.getUpdateRecorder = getUpdateRecorder;
    this.printer = printer;
  }
  addImportToSourceFile(sourceFile, symbolName, moduleName, alias = null, typeImport = false, keepSymbolName = false) {
    const sourceDir = (0, import_path.dirname)(sourceFile.fileName);
    let importStartIndex = 0;
    let existingImport = null;
    const cachedImport = this.importCache.find((c) => c.sourceFile === sourceFile && c.symbolName === symbolName && c.moduleName === moduleName && c.alias === alias);
    if (cachedImport) {
      return cachedImport.identifier;
    }
    for (let i = sourceFile.statements.length - 1; i >= 0; i--) {
      const statement = sourceFile.statements[i];
      if (!import_typescript.default.isImportDeclaration(statement) || !import_typescript.default.isStringLiteral(statement.moduleSpecifier) || !statement.importClause) {
        continue;
      }
      if (importStartIndex === 0) {
        importStartIndex = this._getEndPositionOfNode(statement);
      }
      const moduleSpecifier = statement.moduleSpecifier.text;
      if (moduleSpecifier.startsWith(".") && (0, import_path.resolve)(sourceDir, moduleSpecifier) !== (0, import_path.resolve)(sourceDir, moduleName) || moduleSpecifier !== moduleName) {
        continue;
      }
      if (statement.importClause.namedBindings) {
        const namedBindings = statement.importClause.namedBindings;
        if (import_typescript.default.isNamespaceImport(namedBindings) && !typeImport) {
          return import_typescript.default.factory.createPropertyAccessExpression(import_typescript.default.factory.createIdentifier(namedBindings.name.text), import_typescript.default.factory.createIdentifier(alias || symbolName || "default"));
        } else if (import_typescript.default.isNamedImports(namedBindings) && symbolName) {
          const existingElement = namedBindings.elements.find((e) => {
            if (alias) {
              return e.propertyName && e.name.text === alias && e.propertyName.text === symbolName;
            }
            return e.propertyName ? e.propertyName.text === symbolName : e.name.text === symbolName;
          });
          if (existingElement) {
            return import_typescript.default.factory.createIdentifier(existingElement.name.text);
          }
          existingImport = statement;
        }
      } else if (statement.importClause.name && !symbolName) {
        return import_typescript.default.factory.createIdentifier(statement.importClause.name.text);
      }
    }
    if (existingImport) {
      const { propertyName, name } = this._getImportParts(sourceFile, symbolName, alias, keepSymbolName);
      this.updatedImports.set(existingImport, (this.updatedImports.get(existingImport) || []).concat({ propertyName, importName: name }));
      this.importCache.push({ sourceFile, moduleName, symbolName, alias, identifier: name });
      return name;
    }
    let identifier = null;
    if (!this.newImports.has(sourceFile)) {
      this.newImports.set(sourceFile, {
        importStartIndex,
        defaultImports: /* @__PURE__ */ new Map(),
        namedImports: /* @__PURE__ */ new Map()
      });
    }
    if (symbolName) {
      const { propertyName, name } = this._getImportParts(sourceFile, symbolName, alias, keepSymbolName);
      const importMap = this.newImports.get(sourceFile).namedImports;
      identifier = name;
      if (!importMap.has(moduleName)) {
        importMap.set(moduleName, []);
      }
      importMap.get(moduleName).push(import_typescript.default.factory.createImportSpecifier(false, propertyName, name));
    } else {
      const importMap = this.newImports.get(sourceFile).defaultImports;
      identifier = this._getUniqueIdentifier(sourceFile, "defaultExport");
      importMap.set(moduleName, identifier);
    }
    this.importCache.push({ sourceFile, symbolName, moduleName, alias, identifier });
    return identifier;
  }
  recordChanges() {
    this.updatedImports.forEach((expressions, importDecl) => {
      const sourceFile = importDecl.getSourceFile();
      const recorder = this.getUpdateRecorder(sourceFile);
      const namedBindings = importDecl.importClause.namedBindings;
      const newNamedBindings = import_typescript.default.factory.updateNamedImports(namedBindings, namedBindings.elements.concat(expressions.map(({ propertyName, importName }) => import_typescript.default.factory.createImportSpecifier(false, propertyName, importName))));
      const newNamedBindingsText = this.printer.printNode(import_typescript.default.EmitHint.Unspecified, newNamedBindings, sourceFile);
      recorder.updateExistingImport(namedBindings, newNamedBindingsText);
    });
    this.newImports.forEach(({ importStartIndex, defaultImports, namedImports }, sourceFile) => {
      const recorder = this.getUpdateRecorder(sourceFile);
      const useSingleQuotes = this._getQuoteStyle(sourceFile) === 0;
      defaultImports.forEach((identifier, moduleName) => {
        const newImport = import_typescript.default.factory.createImportDeclaration(void 0, import_typescript.default.factory.createImportClause(false, identifier, void 0), import_typescript.default.factory.createStringLiteral(moduleName, useSingleQuotes));
        recorder.addNewImport(importStartIndex, this._getNewImportText(importStartIndex, newImport, sourceFile));
      });
      namedImports.forEach((specifiers, moduleName) => {
        const newImport = import_typescript.default.factory.createImportDeclaration(void 0, import_typescript.default.factory.createImportClause(false, void 0, import_typescript.default.factory.createNamedImports(specifiers)), import_typescript.default.factory.createStringLiteral(moduleName, useSingleQuotes));
        recorder.addNewImport(importStartIndex, this._getNewImportText(importStartIndex, newImport, sourceFile));
      });
    });
  }
  _getUniqueIdentifier(sourceFile, baseName) {
    if (this.isUniqueIdentifierName(sourceFile, baseName)) {
      this._recordUsedIdentifier(sourceFile, baseName);
      return import_typescript.default.factory.createIdentifier(baseName);
    }
    let name = null;
    let counter = 1;
    do {
      name = `${baseName}_${counter++}`;
    } while (!this.isUniqueIdentifierName(sourceFile, name));
    this._recordUsedIdentifier(sourceFile, name);
    return import_typescript.default.factory.createIdentifier(name);
  }
  isUniqueIdentifierName(sourceFile, name) {
    if (this.usedIdentifierNames.has(sourceFile) && this.usedIdentifierNames.get(sourceFile).indexOf(name) !== -1) {
      return false;
    }
    const nodeQueue = [sourceFile];
    while (nodeQueue.length) {
      const node = nodeQueue.shift();
      if (import_typescript.default.isIdentifier(node) && node.text === name && (!import_typescript.default.isImportSpecifier(node.parent) || node.parent.propertyName !== node)) {
        return false;
      }
      nodeQueue.push(...node.getChildren());
    }
    return true;
  }
  _recordUsedIdentifier(sourceFile, identifierName) {
    this.usedIdentifierNames.set(sourceFile, (this.usedIdentifierNames.get(sourceFile) || []).concat(identifierName));
  }
  _getEndPositionOfNode(node) {
    const nodeEndPos = node.getEnd();
    const commentRanges = import_typescript.default.getTrailingCommentRanges(node.getSourceFile().text, nodeEndPos);
    if (!commentRanges || !commentRanges.length) {
      return nodeEndPos;
    }
    return commentRanges[commentRanges.length - 1].end;
  }
  _getNewImportText(importStartIndex, newImport, sourceFile) {
    const text = this.printer.printNode(import_typescript.default.EmitHint.Unspecified, newImport, sourceFile);
    return importStartIndex === 0 ? `${text}
` : `
${text}`;
  }
  _getImportParts(sourceFile, symbolName, alias, keepSymbolName) {
    const symbolIdentifier = import_typescript.default.factory.createIdentifier(symbolName);
    const aliasIdentifier = alias ? import_typescript.default.factory.createIdentifier(alias) : null;
    const generatedUniqueIdentifier = this._getUniqueIdentifier(sourceFile, alias || symbolName);
    const needsGeneratedUniqueName = generatedUniqueIdentifier.text !== (alias || symbolName);
    let propertyName;
    let name;
    if (needsGeneratedUniqueName && !keepSymbolName) {
      propertyName = symbolIdentifier;
      name = generatedUniqueIdentifier;
    } else if (aliasIdentifier) {
      propertyName = symbolIdentifier;
      name = aliasIdentifier;
    } else {
      name = symbolIdentifier;
    }
    return { propertyName, name };
  }
  _getQuoteStyle(sourceFile) {
    if (!this.quoteStyles.hasOwnProperty(sourceFile.fileName)) {
      let quoteStyle;
      for (const statement of sourceFile.statements) {
        if (import_typescript.default.isImportDeclaration(statement) && import_typescript.default.isStringLiteralLike(statement.moduleSpecifier)) {
          quoteStyle = statement.moduleSpecifier.getText().trim().startsWith('"') ? 1 : 0;
          break;
        }
      }
      this.quoteStyles[sourceFile.fileName] = quoteStyle != null ? quoteStyle : 0;
    }
    return this.quoteStyles[sourceFile.fileName];
  }
};

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/change_tracker.mjs
var ChangeTracker = class {
  constructor(_printer, _importRemapper) {
    __publicField(this, "_printer");
    __publicField(this, "_importRemapper");
    __publicField(this, "_changes", /* @__PURE__ */ new Map());
    __publicField(this, "_importManager");
    this._printer = _printer;
    this._importRemapper = _importRemapper;
    this._importManager = new ImportManager((currentFile) => ({
      addNewImport: (start, text) => this.insertText(currentFile, start, text),
      updateExistingImport: (namedBindings, text) => this.replaceText(currentFile, namedBindings.getStart(), namedBindings.getWidth(), text)
    }), this._printer);
  }
  insertText(sourceFile, index, text) {
    this._trackChange(sourceFile, { start: index, text });
  }
  replaceText(sourceFile, start, removeLength, text) {
    this._trackChange(sourceFile, { start, removeLength, text });
  }
  replaceNode(oldNode, newNode, emitHint = import_typescript2.default.EmitHint.Unspecified, sourceFileWhenPrinting) {
    const sourceFile = oldNode.getSourceFile();
    this.replaceText(sourceFile, oldNode.getStart(), oldNode.getWidth(), this._printer.printNode(emitHint, newNode, sourceFileWhenPrinting || sourceFile));
  }
  removeNode(node) {
    this._trackChange(node.getSourceFile(), {
      start: node.getStart(),
      removeLength: node.getWidth(),
      text: ""
    });
  }
  addImport(sourceFile, symbolName, moduleName, alias = null, keepSymbolName = false) {
    if (this._importRemapper) {
      moduleName = this._importRemapper(moduleName, sourceFile.fileName);
    }
    moduleName = normalizePath(moduleName);
    return this._importManager.addImportToSourceFile(sourceFile, symbolName, moduleName, alias, false, keepSymbolName);
  }
  recordChanges() {
    this._importManager.recordChanges();
    return this._changes;
  }
  clearChanges() {
    this._changes.clear();
  }
  _trackChange(file, change) {
    const changes = this._changes.get(file);
    if (changes) {
      const insertIndex = changes.findIndex((current) => current.start <= change.start);
      if (insertIndex === -1) {
        changes.push(change);
      } else {
        changes.splice(insertIndex, 0, change);
      }
    } else {
      this._changes.set(file, [change]);
    }
  }
};
function normalizePath(path2) {
  return path2.replace(/\\/g, "/");
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/typescript/compiler_host.mjs
var import_path2 = require("path");
var import_typescript4 = __toESM(require("typescript"), 1);

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/typescript/parse_tsconfig.mjs
var path = __toESM(require("path"), 1);
var import_typescript3 = __toESM(require("typescript"), 1);
function parseTsconfigFile(tsconfigPath, basePath) {
  const { config } = import_typescript3.default.readConfigFile(tsconfigPath, import_typescript3.default.sys.readFile);
  const parseConfigHost = {
    useCaseSensitiveFileNames: import_typescript3.default.sys.useCaseSensitiveFileNames,
    fileExists: import_typescript3.default.sys.fileExists,
    readDirectory: import_typescript3.default.sys.readDirectory,
    readFile: import_typescript3.default.sys.readFile
  };
  if (!path.isAbsolute(basePath)) {
    throw Error("Unexpected relative base path has been specified.");
  }
  return import_typescript3.default.parseJsonConfigFileContent(config, parseConfigHost, basePath, {});
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/typescript/compiler_host.mjs
function createMigrationProgram(tree, tsconfigPath, basePath, fakeFileRead, additionalFiles) {
  const { rootNames, options, host } = createProgramOptions(tree, tsconfigPath, basePath, fakeFileRead, additionalFiles);
  return import_typescript4.default.createProgram(rootNames, options, host);
}
function createProgramOptions(tree, tsconfigPath, basePath, fakeFileRead, additionalFiles, optionOverrides) {
  tsconfigPath = (0, import_path2.resolve)(basePath, tsconfigPath);
  const parsed = parseTsconfigFile(tsconfigPath, (0, import_path2.dirname)(tsconfigPath));
  const options = optionOverrides ? __spreadValues(__spreadValues({}, parsed.options), optionOverrides) : parsed.options;
  const host = createMigrationCompilerHost(tree, options, basePath, fakeFileRead);
  return { rootNames: parsed.fileNames.concat(additionalFiles || []), options, host };
}
function createMigrationCompilerHost(tree, options, basePath, fakeRead) {
  const host = import_typescript4.default.createCompilerHost(options, true);
  const defaultReadFile = host.readFile;
  host.readFile = (fileName) => {
    var _a;
    const treeRelativePath = (0, import_path2.relative)(basePath, fileName);
    let result = fakeRead == null ? void 0 : fakeRead(treeRelativePath);
    if (typeof result !== "string") {
      result = treeRelativePath.startsWith("..") ? defaultReadFile.call(host, fileName) : (_a = tree.read(treeRelativePath)) == null ? void 0 : _a.toString();
    }
    return typeof result === "string" ? result.replace(/^\uFEFF/, "") : void 0;
  };
  return host;
}
function canMigrateFile(basePath, sourceFile, program) {
  if (sourceFile.fileName.endsWith(".ngtypecheck.ts") || sourceFile.isDeclarationFile || program.isSourceFileFromExternalLibrary(sourceFile)) {
    return false;
  }
  return !(0, import_path2.relative)(basePath, sourceFile.fileName).startsWith("..");
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/ng-generate/inject-migration/migration.mjs
var import_typescript8 = __toESM(require("typescript"), 1);

// bazel-out/k8-fastbuild/bin/packages/core/schematics/ng-generate/inject-migration/analysis.mjs
var import_typescript7 = __toESM(require("typescript"), 1);

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/typescript/decorators.mjs
var import_typescript6 = __toESM(require("typescript"), 1);

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/typescript/imports.mjs
var import_typescript5 = __toESM(require("typescript"), 1);
function getImportOfIdentifier(typeChecker, node) {
  const symbol = typeChecker.getSymbolAtLocation(node);
  if (!symbol || symbol.declarations === void 0 || !symbol.declarations.length) {
    return null;
  }
  const decl = symbol.declarations[0];
  if (!import_typescript5.default.isImportSpecifier(decl)) {
    return null;
  }
  const importDecl = decl.parent.parent.parent;
  if (!import_typescript5.default.isImportDeclaration(importDecl) || !import_typescript5.default.isStringLiteral(importDecl.moduleSpecifier)) {
    return null;
  }
  return {
    name: decl.propertyName ? decl.propertyName.text : decl.name.text,
    importModule: importDecl.moduleSpecifier.text,
    node: importDecl
  };
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/typescript/decorators.mjs
function getCallDecoratorImport(typeChecker, decorator) {
  if (!import_typescript6.default.isCallExpression(decorator.expression) || !import_typescript6.default.isIdentifier(decorator.expression.expression)) {
    return null;
  }
  const identifier = decorator.expression.expression;
  return getImportOfIdentifier(typeChecker, identifier);
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/ng_decorators.mjs
function getAngularDecorators(typeChecker, decorators) {
  return decorators.map((node) => ({ node, importData: getCallDecoratorImport(typeChecker, node) })).filter(({ importData }) => importData && importData.importModule.startsWith("@angular/")).map(({ node, importData }) => ({
    node,
    name: importData.name,
    moduleName: importData.importModule,
    importNode: importData.node
  }));
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/ng-generate/inject-migration/analysis.mjs
var DECORATORS_SUPPORTING_DI = /* @__PURE__ */ new Set([
  "Component",
  "Directive",
  "Pipe",
  "NgModule",
  "Injectable"
]);
function detectClassesUsingDI(sourceFile, localTypeChecker) {
  const results = [];
  sourceFile.forEachChild(function walk(node) {
    if (import_typescript7.default.isClassDeclaration(node)) {
      const decorators = getAngularDecorators(localTypeChecker, import_typescript7.default.getDecorators(node) || []);
      const supportsDI = decorators.some((dec) => DECORATORS_SUPPORTING_DI.has(dec.name));
      const constructorNode = node.members.find((member) => import_typescript7.default.isConstructorDeclaration(member) && member.body != null && member.parameters.length > 0);
      if (supportsDI && constructorNode) {
        results.push({
          node,
          constructor: constructorNode,
          superCall: node.heritageClauses ? findSuperCall(constructorNode) : null
        });
      }
    }
    node.forEachChild(walk);
  });
  return results;
}
function getConstructorUnusedParameters(declaration, localTypeChecker) {
  const accessedTopLevelParameters = /* @__PURE__ */ new Set();
  const topLevelParameters = /* @__PURE__ */ new Set();
  const topLevelParameterNames = /* @__PURE__ */ new Set();
  const unusedParams = /* @__PURE__ */ new Set();
  for (const param of declaration.parameters) {
    if (import_typescript7.default.isIdentifier(param.name)) {
      topLevelParameters.add(param);
      topLevelParameterNames.add(param.name.text);
    }
  }
  if (!declaration.body) {
    return topLevelParameters;
  }
  declaration.body.forEachChild(function walk(node) {
    var _a, _b;
    if (!import_typescript7.default.isIdentifier(node) || !topLevelParameterNames.has(node.text)) {
      node.forEachChild(walk);
      return;
    }
    if (import_typescript7.default.isPropertyAccessExpression(node.parent) && node.parent.expression.kind === import_typescript7.default.SyntaxKind.ThisKeyword && node.parent.name === node) {
      return;
    }
    (_b = (_a = localTypeChecker.getSymbolAtLocation(node)) == null ? void 0 : _a.declarations) == null ? void 0 : _b.forEach((decl) => {
      if (import_typescript7.default.isParameter(decl) && topLevelParameters.has(decl)) {
        accessedTopLevelParameters.add(decl);
      }
    });
  });
  for (const param of topLevelParameters) {
    if (!accessedTopLevelParameters.has(param)) {
      unusedParams.add(param);
    }
  }
  return unusedParams;
}
function getSuperParameters(declaration, superCall, localTypeChecker) {
  const usedParams = /* @__PURE__ */ new Set();
  const topLevelParameters = /* @__PURE__ */ new Set();
  const topLevelParameterNames = /* @__PURE__ */ new Set();
  for (const param of declaration.parameters) {
    if (import_typescript7.default.isIdentifier(param.name)) {
      topLevelParameters.add(param);
      topLevelParameterNames.add(param.name.text);
    }
  }
  superCall.forEachChild(function walk(node) {
    var _a, _b;
    if (import_typescript7.default.isIdentifier(node) && topLevelParameterNames.has(node.text)) {
      (_b = (_a = localTypeChecker.getSymbolAtLocation(node)) == null ? void 0 : _a.declarations) == null ? void 0 : _b.forEach((decl) => {
        if (import_typescript7.default.isParameter(decl) && topLevelParameters.has(decl)) {
          usedParams.add(decl);
        }
      });
    } else {
      node.forEachChild(walk);
    }
  });
  return usedParams;
}
function getNodeIndentation(node) {
  const fullText = node.getFullText();
  const end = fullText.indexOf(node.getText());
  let result = "";
  for (let i = end - 1; i > -1; i--) {
    if (fullText[i] !== "\n") {
      result = fullText[i] + result;
    } else {
      break;
    }
  }
  return result;
}
function parameterDeclaresProperty(node) {
  var _a;
  return !!((_a = node.modifiers) == null ? void 0 : _a.some(({ kind }) => kind === import_typescript7.default.SyntaxKind.PublicKeyword || kind === import_typescript7.default.SyntaxKind.PrivateKeyword || kind === import_typescript7.default.SyntaxKind.ProtectedKeyword || kind === import_typescript7.default.SyntaxKind.ReadonlyKeyword));
}
function isNullableType(node) {
  if (node.kind === import_typescript7.default.SyntaxKind.UndefinedKeyword || node.kind === import_typescript7.default.SyntaxKind.VoidKeyword) {
    return true;
  }
  if (import_typescript7.default.isLiteralTypeNode(node)) {
    return node.literal.kind === import_typescript7.default.SyntaxKind.NullKeyword;
  }
  if (import_typescript7.default.isUnionTypeNode(node)) {
    return node.types.some(isNullableType);
  }
  return false;
}
function hasGenerics(node) {
  if (import_typescript7.default.isTypeReferenceNode(node)) {
    return node.typeArguments != null && node.typeArguments.length > 0;
  }
  if (import_typescript7.default.isUnionTypeNode(node)) {
    return node.types.some(hasGenerics);
  }
  return false;
}
function findSuperCall(root) {
  let result = null;
  root.forEachChild(function find(node) {
    if (import_typescript7.default.isCallExpression(node) && node.expression.kind === import_typescript7.default.SyntaxKind.SuperKeyword) {
      result = node;
    } else if (result === null) {
      node.forEachChild(find);
    }
  });
  return result;
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/ng-generate/inject-migration/migration.mjs
var PLACEHOLDER = "\u0275\u0275ngGeneratePlaceholder\u0275\u0275";
function migrateFile(sourceFile, options) {
  const localTypeChecker = getLocalTypeChecker(sourceFile);
  const printer = import_typescript8.default.createPrinter();
  const tracker = new ChangeTracker(printer);
  detectClassesUsingDI(sourceFile, localTypeChecker).forEach((result) => {
    migrateClass(result.node, result.constructor, result.superCall, options, localTypeChecker, printer, tracker);
  });
  return tracker.recordChanges().get(sourceFile) || [];
}
function migrateClass(node, constructor, superCall, options, localTypeChecker, printer, tracker) {
  var _a, _b;
  const isAbstract = !!((_a = node.modifiers) == null ? void 0 : _a.some((m) => m.kind === import_typescript8.default.SyntaxKind.AbstractKeyword));
  if (isAbstract && !options.migrateAbstractClasses) {
    return;
  }
  const sourceFile = node.getSourceFile();
  const unusedParameters = getConstructorUnusedParameters(constructor, localTypeChecker);
  const superParameters = superCall ? getSuperParameters(constructor, superCall, localTypeChecker) : null;
  const memberIndentation = getNodeIndentation(node.members[0]);
  const innerReference = superCall || ((_b = constructor.body) == null ? void 0 : _b.statements[0]) || constructor;
  const innerIndentation = getNodeIndentation(innerReference);
  const propsToAdd = [];
  const prependToConstructor = [];
  const afterSuper = [];
  const removedMembers = /* @__PURE__ */ new Set();
  for (const param of constructor.parameters) {
    const usedInSuper = superParameters !== null && superParameters.has(param);
    const usedInConstructor = !unusedParameters.has(param);
    migrateParameter(param, options, localTypeChecker, printer, tracker, superCall, usedInSuper, usedInConstructor, memberIndentation, innerIndentation, prependToConstructor, propsToAdd, afterSuper);
  }
  for (const member of node.members) {
    if (import_typescript8.default.isConstructorDeclaration(member) && member !== constructor) {
      removedMembers.add(member);
      tracker.replaceText(sourceFile, member.getFullStart(), member.getFullWidth(), "");
    }
  }
  if (!options.backwardsCompatibleConstructors && (!constructor.body || constructor.body.statements.length === 0)) {
    removedMembers.add(constructor);
    tracker.replaceText(sourceFile, constructor.getFullStart(), constructor.getFullWidth(), "");
  } else {
    stripConstructorParameters(constructor, tracker);
    if (prependToConstructor.length > 0) {
      tracker.insertText(sourceFile, innerReference.getFullStart(), `
${prependToConstructor.join("\n")}
`);
    }
  }
  if (afterSuper.length > 0 && superCall !== null) {
    tracker.insertText(sourceFile, superCall.getEnd() + 1, `
${afterSuper.join("\n")}
`);
  }
  const memberReference = node.members.find((m) => !removedMembers.has(m)) || node.members[0];
  if (options.backwardsCompatibleConstructors) {
    const extraSignature = `
${memberIndentation}/** Inserted by Angular inject() migration for backwards compatibility */
${memberIndentation}constructor(...args: unknown[]);`;
    if (memberReference === constructor) {
      propsToAdd.push(extraSignature);
    } else {
      tracker.insertText(sourceFile, constructor.getFullStart(), "\n" + extraSignature);
    }
  }
  if (propsToAdd.length > 0) {
    if (removedMembers.size === node.members.length) {
      tracker.insertText(sourceFile, constructor.getEnd() + 1, `${propsToAdd.join("\n")}
`);
    } else {
      tracker.insertText(sourceFile, memberReference.getFullStart(), `
${propsToAdd.join("\n")}
`);
    }
  }
}
function migrateParameter(node, options, localTypeChecker, printer, tracker, superCall, usedInSuper, usedInConstructor, memberIndentation, innerIndentation, prependToConstructor, propsToAdd, afterSuper) {
  var _a;
  if (!import_typescript8.default.isIdentifier(node.name)) {
    return;
  }
  const name = node.name.text;
  const replacementCall = createInjectReplacementCall(node, options, localTypeChecker, printer, tracker);
  const declaresProp = parameterDeclaresProperty(node);
  if (declaresProp) {
    const prop = import_typescript8.default.factory.createPropertyDeclaration(
      (_a = node.modifiers) == null ? void 0 : _a.filter((modifier) => {
        return !import_typescript8.default.isDecorator(modifier) && modifier.kind !== import_typescript8.default.SyntaxKind.PublicKeyword;
      }),
      name,
      void 0,
      usedInSuper ? node.type : void 0,
      usedInSuper ? void 0 : import_typescript8.default.factory.createIdentifier(PLACEHOLDER)
    );
    propsToAdd.push(memberIndentation + replaceNodePlaceholder(node.getSourceFile(), prop, replacementCall, printer));
  }
  if (usedInConstructor) {
    if (usedInSuper) {
      prependToConstructor.push(`${innerIndentation}const ${name} = ${replacementCall};`);
      if (declaresProp) {
        afterSuper.push(`${innerIndentation}this.${name} = ${name};`);
      }
    } else if (declaresProp) {
      const initializer = `${innerIndentation}const ${name} = this.${name};`;
      if (superCall === null) {
        prependToConstructor.push(initializer);
      } else {
        afterSuper.push(initializer);
      }
    } else {
      prependToConstructor.push(`${innerIndentation}const ${name} = ${replacementCall};`);
    }
  }
}
function createInjectReplacementCall(param, options, localTypeChecker, printer, tracker) {
  var _a;
  const moduleName = "@angular/core";
  const sourceFile = param.getSourceFile();
  const decorators = getAngularDecorators(localTypeChecker, import_typescript8.default.getDecorators(param) || []);
  const literalProps = [];
  let injectedType = ((_a = param.type) == null ? void 0 : _a.getText()) || "";
  let typeArguments = param.type && hasGenerics(param.type) ? [param.type] : void 0;
  let hasOptionalDecorator = false;
  for (const decorator of decorators) {
    if (decorator.moduleName !== moduleName) {
      continue;
    }
    const firstArg = decorator.node.expression.arguments[0];
    switch (decorator.name) {
      case "Inject":
        if (firstArg) {
          injectedType = firstArg.getText();
          if (import_typescript8.default.isStringLiteralLike(firstArg)) {
            typeArguments = [
              param.type || import_typescript8.default.factory.createKeywordTypeNode(import_typescript8.default.SyntaxKind.AnyKeyword)
            ];
            injectedType += " as any";
          }
        }
        break;
      case "Attribute":
        if (firstArg) {
          const constructorRef = tracker.addImport(sourceFile, "HostAttributeToken", moduleName);
          const expression2 = import_typescript8.default.factory.createNewExpression(constructorRef, void 0, [firstArg]);
          injectedType = printer.printNode(import_typescript8.default.EmitHint.Unspecified, expression2, sourceFile);
          typeArguments = void 0;
        }
        break;
      case "Optional":
        hasOptionalDecorator = true;
        literalProps.push(import_typescript8.default.factory.createPropertyAssignment("optional", import_typescript8.default.factory.createTrue()));
        break;
      case "SkipSelf":
        literalProps.push(import_typescript8.default.factory.createPropertyAssignment("skipSelf", import_typescript8.default.factory.createTrue()));
        break;
      case "Self":
        literalProps.push(import_typescript8.default.factory.createPropertyAssignment("self", import_typescript8.default.factory.createTrue()));
        break;
      case "Host":
        literalProps.push(import_typescript8.default.factory.createPropertyAssignment("host", import_typescript8.default.factory.createTrue()));
        break;
    }
  }
  const injectRef = tracker.addImport(param.getSourceFile(), "inject", moduleName);
  const args = [import_typescript8.default.factory.createIdentifier(PLACEHOLDER)];
  if (literalProps.length > 0) {
    args.push(import_typescript8.default.factory.createObjectLiteralExpression(literalProps));
  }
  let expression = import_typescript8.default.factory.createCallExpression(injectRef, typeArguments, args);
  if (hasOptionalDecorator && options.nonNullableOptional) {
    const hasNullableType = param.questionToken != null || param.type != null && isNullableType(param.type);
    if (!hasNullableType) {
      expression = import_typescript8.default.factory.createNonNullExpression(expression);
    }
  }
  return replaceNodePlaceholder(param.getSourceFile(), expression, injectedType, printer);
}
function stripConstructorParameters(node, tracker) {
  if (node.parameters.length === 0) {
    return;
  }
  const constructorText = node.getText();
  const lastParamText = node.parameters[node.parameters.length - 1].getText();
  const lastParamStart = constructorText.indexOf(lastParamText);
  const whitespacePattern = /\s/;
  let trailingCharacters = 0;
  if (lastParamStart > -1) {
    let lastParamEnd = lastParamStart + lastParamText.length;
    let closeParenIndex = -1;
    for (let i = lastParamEnd; i < constructorText.length; i++) {
      const char = constructorText[i];
      if (char === ")") {
        closeParenIndex = i;
        break;
      } else if (!whitespacePattern.test(char)) {
        lastParamEnd = i + 1;
      }
    }
    if (closeParenIndex > -1) {
      trailingCharacters = closeParenIndex - lastParamEnd;
    }
  }
  tracker.replaceText(node.getSourceFile(), node.parameters.pos, node.parameters.end - node.parameters.pos + trailingCharacters, "");
}
function getLocalTypeChecker(sourceFile) {
  const options = { noEmit: true, skipLibCheck: true };
  const host = import_typescript8.default.createCompilerHost(options);
  host.getSourceFile = (fileName) => fileName === sourceFile.fileName ? sourceFile : void 0;
  const program = import_typescript8.default.createProgram({
    rootNames: [sourceFile.fileName],
    options,
    host
  });
  return program.getTypeChecker();
}
function replaceNodePlaceholder(sourceFile, node, replacement, printer) {
  const result = printer.printNode(import_typescript8.default.EmitHint.Unspecified, node, sourceFile);
  return result.replace(PLACEHOLDER, replacement);
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/ng-generate/inject-migration/index.mjs
function inject_migration_default(options) {
  return (tree) => __async(this, null, function* () {
    const basePath = process.cwd();
    const pathToMigrate = normalizePath((0, import_path3.join)(basePath, options.path));
    let allPaths = [];
    if (pathToMigrate.trim() !== "") {
      allPaths.push(pathToMigrate);
    }
    if (!allPaths.length) {
      throw new import_schematics.SchematicsException("Could not find any tsconfig file. Cannot run the inject migration.");
    }
    for (const tsconfigPath of allPaths) {
      runInjectMigration(tree, tsconfigPath, basePath, pathToMigrate, options);
    }
  });
}
function runInjectMigration(tree, tsconfigPath, basePath, pathToMigrate, schematicOptions) {
  if (schematicOptions.path.startsWith("..")) {
    throw new import_schematics.SchematicsException("Cannot run inject migration outside of the current project.");
  }
  const program = createMigrationProgram(tree, tsconfigPath, basePath);
  const sourceFiles = program.getSourceFiles().filter((sourceFile) => sourceFile.fileName.startsWith(pathToMigrate) && canMigrateFile(basePath, sourceFile, program));
  if (sourceFiles.length === 0) {
    throw new import_schematics.SchematicsException(`Could not find any files to migrate under the path ${pathToMigrate}. Cannot run the inject migration.`);
  }
  for (const sourceFile of sourceFiles) {
    const changes = migrateFile(sourceFile, schematicOptions);
    const update = tree.beginUpdate((0, import_path3.relative)(basePath, sourceFile.fileName));
    changes.forEach((change) => {
      if (change.removeLength != null) {
        update.remove(change.start, change.removeLength);
      }
      update.insertRight(change.start, change.text);
    });
    tree.commitUpdate(update);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
//# sourceMappingURL=bundle.js.map
