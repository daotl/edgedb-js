"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirBuilder = exports.CodeBuilder = exports.CodeBuffer = exports.t = exports.all = exports.r = exports.dts = exports.js = exports.ts = exports.f = void 0;
const edgedb_1 = require("edgedb");
const strictMap_1 = require("edgedb/dist/reflection/strictMap");
const genutil = __importStar(require("./genutil"));
const importExportHelpers_1 = require("./importExportHelpers");
const { fs, path, exists, readFileUtf8 } = edgedb_1.adapter;
const f = (...modes) => (strings, ...exprs) => {
    return {
        type: "frag",
        modes: new Set(modes),
        content: genutil.frag(strings, ...exprs)
    };
};
exports.f = f;
exports.ts = (0, exports.f)("ts");
exports.js = (0, exports.f)("js");
exports.dts = (0, exports.f)("dts");
exports.r = (0, exports.f)("ts", "js");
exports.all = (0, exports.f)("ts", "js", "dts");
exports.t = (0, exports.f)("ts", "dts");
class CodeBuffer {
    constructor() {
        Object.defineProperty(this, "buf", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "indent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
    }
    getBuf() {
        return this.buf;
    }
    nl() {
        this.buf.push(["\n"]);
    }
    indented(nested) {
        this.indent++;
        try {
            nested();
        }
        finally {
            this.indent--;
        }
    }
    writeln(...lines) {
        const indent = "  ".repeat(this.indent);
        const indentFrag = (frag) => typeof frag === "string"
            ? frag.replace(/\n(?!$)/g, "\n" + indent)
            : (frag.type === "frag"
                ? { ...frag, content: frag.content.map(indentFrag) }
                : frag);
        lines.forEach(line => {
            this.buf.push([indent, ...line.map(indentFrag)]);
        });
    }
    writeBuf(buf) {
        this.writeln(...buf.getBuf());
    }
    isEmpty() {
        return !this.buf.length;
    }
}
exports.CodeBuffer = CodeBuffer;
const allModes = new Set(["dts", "js", "ts"]);
class BuilderImportsExports {
    constructor(imports = new Set(), exports = new Set()) {
        Object.defineProperty(this, "imports", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: imports
        });
        Object.defineProperty(this, "exports", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: exports
        });
    }
    addImport(names, fromPath, params = {}) {
        var _a, _b;
        this.imports.add({
            type: "partial",
            fromPath,
            names,
            allowFileExt: (_a = params.allowFileExt) !== null && _a !== void 0 ? _a : false,
            modes: params.modes ? new Set(params.modes) : allModes,
            typeOnly: (_b = params.typeOnly) !== null && _b !== void 0 ? _b : false
        });
    }
    addImportDefault(name, fromPath, params = {}) {
        var _a, _b;
        this.imports.add({
            type: "default",
            fromPath,
            name,
            allowFileExt: (_a = params.allowFileExt) !== null && _a !== void 0 ? _a : false,
            modes: params.modes ? new Set(params.modes) : allModes,
            typeOnly: (_b = params.typeOnly) !== null && _b !== void 0 ? _b : false
        });
    }
    addImportStar(name, fromPath, params = {}) {
        var _a, _b;
        this.imports.add({
            type: "star",
            fromPath,
            name,
            allowFileExt: (_a = params.allowFileExt) !== null && _a !== void 0 ? _a : false,
            modes: params.modes ? new Set(params.modes) : allModes,
            typeOnly: (_b = params.typeOnly) !== null && _b !== void 0 ? _b : false
        });
    }
    addExport(name, params = {}) {
        var _a;
        this.exports.add({
            type: "named",
            name,
            as: params.as,
            isDefault: false,
            modes: params.modes ? new Set(params.modes) : allModes,
            typeOnly: (_a = params.typeOnly) !== null && _a !== void 0 ? _a : false
        });
    }
    addExportDefault(name, params = {}) {
        this.exports.add({
            type: "named",
            name,
            isDefault: true,
            modes: params.modes ? new Set(params.modes) : allModes,
            typeOnly: false
        });
    }
    addToDefaultExport(ref, as) {
        this.exports.add({
            type: "refsDefault",
            ref,
            as,
            modes: allModes
        });
    }
    addExportFrom(names, fromPath, params = {}) {
        var _a, _b;
        this.exports.add({
            type: "from",
            names,
            fromPath,
            allowFileExt: (_a = params.allowFileExt) !== null && _a !== void 0 ? _a : false,
            modes: params.modes ? new Set(params.modes) : allModes,
            typeOnly: (_b = params.typeOnly) !== null && _b !== void 0 ? _b : false
        });
    }
    addExportStar(fromPath, params = {}) {
        var _a;
        this.exports.add({
            type: "starFrom",
            name: params.as || null,
            fromPath,
            allowFileExt: (_a = params.allowFileExt) !== null && _a !== void 0 ? _a : false,
            modes: params.modes ? new Set(params.modes) : allModes
        });
    }
    renderImports({ mode, moduleKind, helpers, extension }) {
        const imports = new Set();
        for (const imp of this.imports) {
            if (imp.modes && !imp.modes.has(mode))
                continue;
            if (imp.typeOnly && mode === "js")
                continue;
            const ext = imp.fromPath.startsWith(".") ? extension : "";
            switch (imp.type) {
                case "default":
                    if (moduleKind === "cjs")
                        helpers.add("importDefault");
                    imports.add(moduleKind === "esm"
                        ? `import${imp.typeOnly ? " type" : ""} ${imp.name} from "${imp.fromPath}${ext}";`
                        : `const ${imp.name} = __importDefault(
                require("${imp.fromPath}")).default;`);
                    break;
                case "star":
                    if (moduleKind === "cjs") {
                        helpers
                            .add("createBinding")
                            .add("setModuleDefault")
                            .add("importStar");
                    }
                    imports.add(moduleKind === "esm"
                        ? `import${imp.typeOnly ? " type" : ""} * as ${imp.name} from "${imp.fromPath}${ext}";`
                        : `const ${imp.name} = __importStar(require("${imp.fromPath}"));`);
                    break;
                case "partial":
                    const names = Object.entries(imp.names)
                        .map(([key, val]) => {
                        if (typeof val === "boolean" && !val)
                            return null;
                        return (key +
                            (typeof val === "string"
                                ? `${moduleKind === "esm" ? " as" : ":"} ${val}`
                                : ""));
                    })
                        .filter(val => val !== null)
                        .join(", ");
                    imports.add(moduleKind === "esm"
                        ? `import${imp.typeOnly ? " type" : ""} { ${names} } from "${imp.fromPath}${ext}";`
                        : `const { ${names} } = require("${imp.fromPath}");`);
                    break;
            }
        }
        return [...imports].join("\n");
    }
    renderExports({ mode, moduleKind, refs, helpers, extension, forceDefaultExport = false }) {
        var _a, _b, _c, _d;
        const exports = [];
        const exportsFrom = [];
        const exportList = [];
        const exportTypes = [];
        const refsDefault = [];
        let hasDefaultExport = false;
        for (const exp of this.exports) {
            if (exp.modes && !exp.modes.has(mode)) {
                continue;
            }
            switch (exp.type) {
                case "named":
                    let name = "";
                    const nameFrags = Array.isArray(exp.name) ? exp.name : [exp.name];
                    for (const nameFrag of nameFrags) {
                        if (typeof nameFrag === "string") {
                            name += nameFrag;
                        }
                        else {
                            const nameRef = refs.get(nameFrag.name);
                            if (!nameRef) {
                                throw new Error(`Cannot find ref: ${nameFrag.name}`);
                            }
                            name += ((_b = (_a = nameFrag.opts) === null || _a === void 0 ? void 0 : _a.prefix) !== null && _b !== void 0 ? _b : "") + nameRef.internalName;
                        }
                    }
                    if (exp.isDefault) {
                        if (hasDefaultExport || refsDefault.length) {
                            throw new Error("multiple default exports");
                        }
                        if (moduleKind === "esm") {
                            exports.push(`export default ${name};`);
                        }
                        else {
                            exports.push(`exports.default = ${name}`);
                        }
                        hasDefaultExport = true;
                    }
                    else {
                        if (moduleKind === "esm") {
                            (exp.typeOnly ? exportTypes : exportList).push(`${name}${exp.as != null ? ` as ${exp.as}` : ""}`);
                        }
                        else if (!exp.typeOnly) {
                            exportList.push(`${exp.as != null ? exp.as : name}: ${name}`);
                        }
                    }
                    break;
                case "from":
                    if (moduleKind === "esm") {
                        exportsFrom.push(`export ${exp.typeOnly ? "type " : ""}{ ${Object.entries(exp.names)
                            .map(([key, val]) => {
                            if (typeof val === "boolean" && !val)
                                return null;
                            return key + (typeof val === "string" ? `as ${val}` : "");
                        })
                            .filter(val => val !== null)
                            .join(", ")} } from "${exp.fromPath}${exp.fromPath.startsWith(".") ? extension : ""}";`);
                    }
                    else {
                        const modName = exp.fromPath.replace(/[^a-z]/gi, "") + "_1";
                        exportsFrom.push(`(function () {\n  var ${modName} = require("${exp.fromPath}");`);
                        for (const [expName, val] of Object.entries(exp.names)) {
                            if (typeof val === "boolean" && !val) {
                                continue;
                            }
                            exportsFrom.push(`  Object.defineProperty(exports, "${typeof val === "string" ? val : expName}", { enumerable: true, get: function () { return ${modName}.${expName}; } });`);
                        }
                        exportsFrom.push(`})();`);
                    }
                    break;
                case "starFrom":
                    if (moduleKind === "esm") {
                        exportsFrom.push(`export * ${exp.name !== null ? `as ${exp.name} ` : ""}from "${exp.fromPath}${exp.fromPath.startsWith(".") ? extension : ""}";`);
                    }
                    else {
                        if (exp.name !== null) {
                            helpers
                                .add("createBinding")
                                .add("setModuleDefault")
                                .add("importStar");
                            exportsFrom.push(`exports.${exp.name} = __importStar(require("${exp.fromPath}"));`);
                        }
                        else {
                            helpers.add("createBinding").add("exportStar");
                            exportsFrom.push(`__exportStar(require("${exp.fromPath}"), exports);`);
                        }
                    }
                    break;
                case "refsDefault":
                    if (hasDefaultExport) {
                        throw new Error("multiple default exports");
                    }
                    const ref = refs.get(exp.ref.name);
                    if (!ref) {
                        throw new Error(`Cannot find ref: ${exp.ref.name}`);
                    }
                    refsDefault.push({
                        ref: ((_d = (_c = exp.ref.opts) === null || _c === void 0 ? void 0 : _c.prefix) !== null && _d !== void 0 ? _d : "") + ref.internalName,
                        as: exp.as
                    });
            }
        }
        if (exportList.length) {
            if (moduleKind === "esm") {
                exports.push(`export { ${exportList.join(", ")} };\n`);
            }
            else {
                exports.push(`Object.assign(exports, { ${exportList.join(", ")} });\n`);
            }
        }
        if (exportTypes.length && mode !== "js") {
            exports.push(`export type { ${exportTypes.join(", ")} };\n`);
        }
        if (refsDefault.length || forceDefaultExport) {
            if (mode === "ts" || mode === "dts") {
                exports.push(`${mode === "dts" ? "declare " : ""}type __defaultExports = {\n${refsDefault
                    .map(({ ref, as }) => `  ${genutil.quote(as)}: typeof ${ref}`)
                    .join(";\n")}\n};`);
            }
            if (mode === "ts" || mode === "js") {
                exports.push(`const __defaultExports${mode === "ts" ? ": __defaultExports" : ""} = {\n${refsDefault
                    .map(({ ref, as }) => `  ${genutil.quote(as)}: ${ref}`)
                    .join(",\n")}\n};`);
            }
            if (mode === "dts") {
                exports.push(`declare const __defaultExports: __defaultExports;`);
            }
            if (moduleKind === "esm") {
                exports.push(`export default __defaultExports;`);
            }
            else {
                exports.push(`exports.default = __defaultExports;`);
            }
        }
        return { exports: exports.join("\n"), exportsFrom: exportsFrom.join("\n") };
    }
    clone() {
        return new BuilderImportsExports(new Set(this.imports), new Set(this.exports));
    }
}
class CodeBuilder {
    constructor(dirBuilder, dir) {
        Object.defineProperty(this, "dirBuilder", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: dirBuilder
        });
        Object.defineProperty(this, "dir", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: dir
        });
        Object.defineProperty(this, "buf", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new CodeBuffer()
        });
        Object.defineProperty(this, "importsExports", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new BuilderImportsExports()
        });
        Object.defineProperty(this, "addImport", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.importsExports.addImport.bind(this.importsExports)
        });
        Object.defineProperty(this, "addImportDefault", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.importsExports.addImportDefault.bind(this.importsExports)
        });
        Object.defineProperty(this, "addImportStar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.importsExports.addImportStar.bind(this.importsExports)
        });
        Object.defineProperty(this, "addExport", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.importsExports.addExport.bind(this.importsExports)
        });
        Object.defineProperty(this, "addExportDefault", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.importsExports.addExportDefault.bind(this.importsExports)
        });
        Object.defineProperty(this, "addToDefaultExport", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.importsExports.addToDefaultExport.bind(this.importsExports)
        });
        Object.defineProperty(this, "addExportFrom", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.importsExports.addExportFrom.bind(this.importsExports)
        });
        Object.defineProperty(this, "addExportStar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.importsExports.addExportStar.bind(this.importsExports)
        });
    }
    getDefaultExportKeys() {
        return [...this.importsExports.exports]
            .filter(exp => exp.type === "refsDefault")
            .map(exp => exp.as);
    }
    registerRef(name, suffix) {
        if (this.dirBuilder._refs.has(name)) {
            throw new Error(`ref name: ${name} already registered`);
        }
        this.dirBuilder._refs.set(name, {
            dir: this.dir,
            internalName: suffix
                ? genutil.getInternalName({ id: suffix, fqn: name })
                : name
        });
    }
    nl() {
        this.buf.nl();
    }
    indented(nested) {
        this.buf.indented(nested);
    }
    writeln(...lines) {
        this.buf.writeln(...lines);
    }
    writeBuf(buf) {
        this.buf.writeBuf(buf);
    }
    resolveIdentRef(identRef, importsExports) {
        var _a, _b;
        const ref = this.dirBuilder._refs.get(identRef.name);
        if (!ref) {
            throw new Error(`Cannot find ref: ${identRef.name}`);
        }
        let prefix = "";
        if (ref.dir !== this.dir) {
            const mod = path.posix.basename(ref.dir, path.posix.extname(ref.dir));
            prefix = `_${mod}`;
            let importPath = path.posix.join(path.posix.relative(path.posix.dirname(this.dir), path.posix.dirname(ref.dir)), mod);
            if (!importPath.startsWith("../")) {
                importPath = "./" + importPath;
            }
            importsExports.addImportStar(prefix, importPath, {
                allowFileExt: true,
                typeOnly: true
            });
        }
        return ((prefix ? prefix + "." : "") +
            ((_b = (_a = identRef.opts) === null || _a === void 0 ? void 0 : _a.prefix) !== null && _b !== void 0 ? _b : "") +
            ref.internalName);
    }
    render({ mode, moduleKind, forceDefaultExport, moduleExtension }) {
        moduleKind !== null && moduleKind !== void 0 ? moduleKind : (moduleKind = mode === "js" ? "cjs" : "esm");
        const importsExports = this.importsExports.clone();
        let body = "";
        for (const lineFrags of this.buf.getBuf()) {
            const line = lineFrags
                .map(frag => {
                if (typeof frag === "string") {
                    return frag;
                }
                else if (frag.type === "identRef") {
                    return this.resolveIdentRef(frag, importsExports);
                }
                else if (frag.modes.has(mode)) {
                    return frag.content
                        .map(contentFrag => typeof contentFrag === "string"
                        ? contentFrag
                        : this.resolveIdentRef(contentFrag, importsExports))
                        .join("");
                }
                else {
                    return "";
                }
            })
                .join("");
            if (line.trim().length || line.endsWith("\n")) {
                body += line + (!line.endsWith("\n") ? "\n" : "");
            }
        }
        const helpers = new Set();
        const { exports, exportsFrom } = importsExports.renderExports({
            mode,
            moduleKind,
            refs: this.dirBuilder._refs,
            helpers,
            forceDefaultExport,
            extension: moduleExtension
        });
        body += "\n\n" + exports;
        let head = mode === "js" && moduleKind === "cjs"
            ? `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });\n`
            : "";
        const imports = importsExports.renderImports({
            mode,
            moduleKind,
            helpers,
            extension: moduleExtension
        });
        if (helpers.size) {
            head += [...helpers.values()]
                .map(helperName => importExportHelpers_1.importExportHelpers[helperName])
                .join("\n");
        }
        head += exportsFrom + "\n";
        head += imports;
        if (head && body) {
            head += "\n";
        }
        return (head + body).trim() + "\n";
    }
    isEmpty() {
        return (this.buf.isEmpty() &&
            !this.importsExports.imports.size &&
            !this.importsExports.exports.size);
    }
}
exports.CodeBuilder = CodeBuilder;
let moduleCounter = 0;
class DirBuilder {
    constructor() {
        Object.defineProperty(this, "_map", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new strictMap_1.StrictMap()
        });
        Object.defineProperty(this, "_refs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "_modules", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    getPath(fn) {
        if (!this._map.has(fn)) {
            this._map.set(fn, new CodeBuilder(this, fn));
        }
        return this._map.get(fn);
    }
    getModule(moduleName) {
        if (!this._modules.has(moduleName)) {
            const internalName = genutil.makeValidIdent({
                name: moduleName,
                id: `${moduleCounter++}`,
                skipKeywordCheck: true
            });
            this._modules.set(moduleName, internalName);
        }
        const mod = this.getPath(`modules/${this._modules.get(moduleName)}`);
        mod.addImportStar("$", "../reflection", { allowFileExt: true });
        mod.addImportStar("_", "../imports", { allowFileExt: true });
        return mod;
    }
    debug() {
        const buf = [];
        for (const [fn, _builder] of this._map.entries()) {
            buf.push(`>>> ${fn}\n`);
            buf.push(`\n`);
        }
        return buf.join("\n");
    }
    async write(to, params, headerComment = "") {
        const dir = path.normalize(to);
        for (const [fn, builder] of this._map.entries()) {
            if (builder.isEmpty()) {
                continue;
            }
            const dest = path.join(dir, fn);
            const destDir = path.dirname(dest);
            if (!(await exists(destDir))) {
                await fs.mkdir(destDir, { recursive: true });
            }
            const forceDefaultExport = fn.startsWith("modules/");
            const filePath = dest + params.fileExtension;
            let oldContents = "";
            try {
                oldContents = await readFileUtf8(filePath);
            }
            catch { }
            const newContents = headerComment +
                builder.render({
                    mode: params.mode,
                    moduleKind: params.moduleKind,
                    moduleExtension: params.moduleExtension,
                    forceDefaultExport
                });
            params.written.add(filePath);
            if (oldContents !== newContents) {
                await fs.writeFile(filePath, newContents);
            }
        }
    }
}
exports.DirBuilder = DirBuilder;