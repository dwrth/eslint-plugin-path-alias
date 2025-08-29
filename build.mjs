import esbuild from "esbuild";
import { resolve } from "node:path";

/**
 * @type {import('esbuild').BuildOptions[]}
 */
const outputs = [
  {
    format: "esm",
    outfile: "./dist/index.mjs",
    target: "es2020",
  },
  {
    format: "cjs",
    outfile: "./dist/index.js",
    target: "es2020",
  },
];

outputs.forEach((output) => {
  esbuild.build({
    ...output,
    entryPoints: [resolve("./src/index.ts")],
    bundle: true,
    minify: false,
    platform: "node",
    external: ["eslint", "picomatch", "get-tsconfig", "find-pkg"],
  });
});
