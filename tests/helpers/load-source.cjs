const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Run actual TypeScript modules with explicit mocks for external services.
function loadSource(relativePath, mocks, cache = new Map()) {
  const filename = path.resolve(__dirname, "../..", relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith("@/"))
      return loadSource(`src/${name.slice(2)}.ts`, mocks, cache);
    return require(name);
  };
  vm.runInThisContext(`(function(require, module, exports) {${source}\n})`, {
    filename,
  })(localRequire, module, module.exports);
  return module.exports;
}

module.exports = { loadSource };
