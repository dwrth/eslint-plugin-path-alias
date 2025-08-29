// package.json
var name = "eslint-plugin-path-alias";
var version = "2.1.4";

// src/rules/no-relative.ts
import { dirname as dirname2, resolve as resolve2, basename } from "path";
import picomatch from "picomatch";

// src/utils/docs-url.ts
function docsUrl(ruleName) {
  const repo = "https://github/com/msfragala/eslint-plugin-path-alias";
  return `${repo}/blob/master/docs/rules/${ruleName}.md`;
}

// src/utils/resolve-aliases.ts
import { getTsconfig } from "get-tsconfig";
import { resolve, dirname } from "path";
import findPkg from "find-pkg";
import { readFileSync } from "fs";
function resolveAliases(context) {
  if (context.options[0]?.paths) {
    return resolveCustomPaths(context);
  }
  const filename = context.getFilename?.() ?? context.filename;
  const tsConfig = getTsconfig(filename);
  if (tsConfig?.config?.compilerOptions?.paths) {
    return resolveTsconfigPaths(tsConfig);
  }
  const path = findPkg.sync(dirname(filename));
  if (!path) return;
  const pkg = JSON.parse(readFileSync(path).toString());
  if (pkg?.imports) {
    return resolvePackageImports(pkg, path);
  }
}
function resolvePackageImports(pkg, pkgPath) {
  const aliases = /* @__PURE__ */ new Map();
  const imports = pkg.imports ?? {};
  const base = dirname(pkgPath);
  Object.entries(imports).forEach(([alias, path]) => {
    if (!path) return;
    if (typeof path !== "string") return;
    const resolved = resolve(base, path);
    aliases.set(alias, [resolved]);
  });
  return aliases;
}
function resolveTsconfigPaths(config) {
  const aliases = /* @__PURE__ */ new Map();
  const paths = config?.config?.compilerOptions?.paths ?? {};
  let base = dirname(config.path);
  if (config.config.compilerOptions?.baseUrl) {
    base = resolve(dirname(config.path), config.config.compilerOptions.baseUrl);
  }
  Object.entries(paths).forEach(([alias, path]) => {
    alias = alias.replace(/\/\*$/, "");
    path = path.map((p) => resolve(base, p.replace(/\/\*$/, "")));
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
    const resolved = resolve(cwd, path);
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
        const resolved = resolve2(dirname2(filePath), importPath);
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
        const resolved = resolve2(dirname2(filePath), importPath);
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
  const filename = basename(path);
  return exceptions.some((exception) => picomatch.isMatch(filename, exception));
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
export {
  src_default as default
};
