var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);

// package.json
var name = "eslint-plugin-path-alias";
var version = "2.1.4";

// src/rules/no-relative.ts
var import_node_path2 = require("path");
var import_picomatch = __toESM(require("picomatch"));

// src/utils/docs-url.ts
function docsUrl(ruleName) {
  const repo = "https://github/com/msfragala/eslint-plugin-path-alias";
  return `${repo}/blob/master/docs/rules/${ruleName}.md`;
}

// src/utils/resolve-aliases.ts
var import_get_tsconfig = require("get-tsconfig");
var import_node_path = require("path");
var import_find_pkg = __toESM(require("find-pkg"));
var import_node_fs = require("fs");
function resolveAliases(context) {
  if (context.options[0]?.paths) {
    return resolveCustomPaths(context);
  }
  const filename = context.getFilename?.() ?? context.filename;
  const tsConfig = (0, import_get_tsconfig.getTsconfig)(filename);
  if (tsConfig?.config?.compilerOptions?.paths) {
    return resolveTsconfigPaths(tsConfig);
  }
  const path = import_find_pkg.default.sync((0, import_node_path.dirname)(filename));
  if (!path) return;
  const pkg = JSON.parse((0, import_node_fs.readFileSync)(path).toString());
  if (pkg?.imports) {
    return resolvePackageImports(pkg, path);
  }
}
function resolvePackageImports(pkg, pkgPath) {
  const aliases = /* @__PURE__ */ new Map();
  const imports = pkg.imports ?? {};
  const base = (0, import_node_path.dirname)(pkgPath);
  Object.entries(imports).forEach(([alias, path]) => {
    if (!path) return;
    if (typeof path !== "string") return;
    const resolved = (0, import_node_path.resolve)(base, path);
    aliases.set(alias, [resolved]);
  });
  return aliases;
}
function resolveTsconfigPaths(config) {
  const aliases = /* @__PURE__ */ new Map();
  const paths = config?.config?.compilerOptions?.paths ?? {};
  let base = (0, import_node_path.dirname)(config.path);
  if (config.config.compilerOptions?.baseUrl) {
    base = (0, import_node_path.resolve)((0, import_node_path.dirname)(config.path), config.config.compilerOptions.baseUrl);
  }
  Object.entries(paths).forEach(([alias, path]) => {
    alias = alias.replace(/\/\*$/, "");
    path = path.map((p) => (0, import_node_path.resolve)(base, p.replace(/\/\*$/, "")));
    aliases.set(alias, path);
  });
  return aliases;
}
function resolveCustomPaths(context) {
  const aliases = /* @__PURE__ */ new Map();
  const paths = context.options[0]?.paths ?? {};
  Object.entries(paths).forEach(([alias, path]) => {
    if (!path) return;
    if (typeof path !== "string") return;
    if (path.startsWith("/")) {
      aliases.set(alias, [path]);
      return;
    }
    const cwd = context.getCwd?.() ?? context.cwd;
    const resolved = (0, import_node_path.resolve)(cwd, path);
    aliases.set(alias, [resolved]);
  });
  return aliases;
}

// src/rules/no-relative.ts
var noRelative = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Ensure imports use path aliases whenever possible vs. relative paths",
      url: docsUrl("no-relative")
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          exceptions: {
            type: "array",
            items: {
              type: "string"
            }
          },
          paths: {
            type: "object"
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      shouldUseAlias: "Import should use path alias instead of relative path"
    }
  },
  create(context) {
    const exceptions = context.options[0]?.exceptions;
    const filePath = context.getFilename?.() ?? context.filename;
    const aliases = resolveAliases(context);
    if (!aliases?.size) return {};
    return {
      ImportExpression(node) {
        if (node.source.type !== "Literal") return;
        if (typeof node.source.value !== "string") return;
        const raw = node.source.raw;
        const importPath = node.source.value;
        if (!/^(\.?\.\/)/.test(importPath)) {
          return;
        }
        const resolved = (0, import_node_path2.resolve)((0, import_node_path2.dirname)(filePath), importPath);
        const excepted = matchExceptions(resolved, exceptions);
        if (excepted) return;
        const alias = matchToAlias(resolved, aliases);
        if (!alias) return;
        context.report({
          node,
          messageId: "shouldUseAlias",
          data: { alias },
          fix(fixer) {
            const aliased = insertAlias(resolved, alias, aliases.get(alias));
            const fixed = raw.replace(importPath, aliased);
            return fixer.replaceText(node.source, fixed);
          }
        });
      },
      ImportDeclaration(node) {
        if (typeof node.source.value !== "string") return;
        const importPath = node.source.value;
        if (!/^(\.?\.\/)/.test(importPath)) {
          return;
        }
        const resolved = (0, import_node_path2.resolve)((0, import_node_path2.dirname)(filePath), importPath);
        const excepted = matchExceptions(resolved, exceptions);
        const alias = matchToAlias(resolved, aliases);
        if (excepted) return;
        if (!alias) return;
        context.report({
          node,
          messageId: "shouldUseAlias",
          data: { alias },
          fix(fixer) {
            const raw = node.source.raw;
            const aliased = insertAlias(resolved, alias, aliases.get(alias));
            const fixed = raw.replace(importPath, aliased);
            return fixer.replaceText(node.source, fixed);
          }
        });
      }
    };
  }
};
function matchToAlias(path, aliases) {
  return Array.from(aliases.keys()).find((alias) => {
    const paths = aliases.get(alias);
    return paths.some((aliasPath) => path.indexOf(aliasPath) === 0);
  });
}
function matchExceptions(path, exceptions) {
  if (!exceptions) return false;
  const filename = (0, import_node_path2.basename)(path);
  return exceptions.some((exception) => import_picomatch.default.isMatch(filename, exception));
}
function insertAlias(path, alias, aliasPaths) {
  for (let aliasPath of aliasPaths) {
    if (path.indexOf(aliasPath) !== 0) continue;
    return path.replace(aliasPath, alias);
  }
}

// src/index.ts
var src_default = {
  name,
  version,
  meta: { name, version },
  rules: {
    "no-relative": noRelative
  }
};
