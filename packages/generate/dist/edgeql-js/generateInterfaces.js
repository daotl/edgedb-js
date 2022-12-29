"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInterfaces = void 0;
const builders_1 = require("../builders");
const genutil_1 = require("../genutil");
const genutil_2 = require("../genutil");
const generateInterfaces = (params) => {
    var _a;
    const { dir, types } = params;
    const plainTypesCode = dir.getPath("interfaces");
    plainTypesCode.addImportStar("edgedb", "edgedb", {
        typeOnly: true
    });
    const plainTypeModules = new Map();
    const getPlainTypeModule = (typeName) => {
        const { mod: tMod, name: tName } = (0, genutil_2.splitName)(typeName);
        if (!plainTypeModules.has(tMod)) {
            plainTypeModules.set(tMod, {
                internalName: (0, genutil_2.makePlainIdent)(tMod),
                buf: new builders_1.CodeBuffer(),
                types: new Map()
            });
        }
        return { tMod, tName, module: plainTypeModules.get(tMod) };
    };
    const _getTypeName = (mod) => (typeName, withModule = false) => {
        const { tMod, tName, module } = getPlainTypeModule(typeName);
        return (((mod !== tMod || withModule) && tMod !== "default"
            ? `${module.internalName}.`
            : "") + `${(0, genutil_2.makePlainIdent)(tName)}`);
    };
    for (const type of types.values()) {
        if (type.kind === "scalar" && ((_a = type.enum_values) === null || _a === void 0 ? void 0 : _a.length)) {
            const { mod: enumMod, name: enumName } = (0, genutil_2.splitName)(type.name);
            const getEnumTypeName = _getTypeName(enumMod);
            const { module } = getPlainTypeModule(type.name);
            module.types.set(enumName, getEnumTypeName(type.name, true));
            module.buf.writeln([
                (0, builders_1.t) `export type ${getEnumTypeName(type.name)} = ${type.enum_values
                    .map(val => (0, genutil_2.quote)(val))
                    .join(" | ")};`
            ]);
        }
        if (type.kind !== "object") {
            continue;
        }
        if ((type.union_of && type.union_of.length) ||
            (type.intersection_of && type.intersection_of.length)) {
            continue;
        }
        const { mod, name } = (0, genutil_2.splitName)(type.name);
        const body = dir.getModule(mod);
        body.registerRef(type.name, type.id);
        const getTypeName = _getTypeName(mod);
        const getTSType = (pointer) => {
            const targetType = types.get(pointer.target_id);
            if (pointer.kind === "link") {
                return getTypeName(targetType.name);
            }
            else {
                return (0, genutil_2.toTSScalarType)(targetType, types, {
                    getEnumRef: enumType => getTypeName(enumType.name),
                    edgedbDatatypePrefix: ""
                }).join("");
            }
        };
        const { module: plainTypeModule } = getPlainTypeModule(type.name);
        const pointers = type.pointers.filter(ptr => ptr.name !== "__type__");
        plainTypeModule.types.set(name, getTypeName(type.name, true));
        plainTypeModule.buf.writeln([
            (0, builders_1.t) `export interface ${getTypeName(type.name)}${type.bases.length
                ? ` extends ${type.bases
                    .map(({ id }) => {
                    const baseType = types.get(id);
                    return getTypeName(baseType.name);
                })
                    .join(", ")}`
                : ""} ${pointers.length
                ? `{\n${pointers
                    .map(pointer => {
                    const isOptional = pointer.card === genutil_1.$.Cardinality.AtMostOne;
                    return `  ${(0, genutil_2.quote)(pointer.name)}${isOptional ? "?" : ""}: ${getTSType(pointer)}${pointer.card === genutil_1.$.Cardinality.Many ||
                        pointer.card === genutil_1.$.Cardinality.AtLeastOne
                        ? "[]"
                        : ""}${isOptional ? " | null" : ""};`;
                })
                    .join("\n")}\n}`
                : "{}"}\n`
        ]);
    }
    const plainTypesExportBuf = new builders_1.CodeBuffer();
    for (const [moduleName, module] of plainTypeModules) {
        if (moduleName === "default") {
            plainTypesCode.writeBuf(module.buf);
        }
        else {
            plainTypesCode.writeln([(0, builders_1.t) `export namespace ${module.internalName} {`]);
            plainTypesCode.writeln([(0, builders_1.js) `const ${module.internalName} = {`]);
            plainTypesCode.indented(() => plainTypesCode.writeBuf(module.buf));
            plainTypesCode.writeln([(0, builders_1.t) `}`]);
            plainTypesCode.writeln([(0, builders_1.js) `}`]);
            plainTypesCode.addExport(module.internalName, { modes: ["js"] });
        }
        plainTypesExportBuf.writeln([
            (0, builders_1.t) `  ${(0, genutil_2.quote)(moduleName)}: {\n${[...module.types.entries()]
                .map(([name, typeName]) => `    ${(0, genutil_2.quote)(name)}: ${typeName};`)
                .join("\n")}\n  };`
        ]);
    }
    plainTypesCode.writeln([(0, builders_1.t) `export interface types {`]);
    plainTypesCode.writeBuf(plainTypesExportBuf);
    plainTypesCode.writeln([(0, builders_1.t) `}`]);
    plainTypesCode.writeln([
        (0, builders_1.t) `

export namespace helper {
  type LinkType = std.BaseObject | std.BaseObject[];

  export type propertyKeys<T> = {
    [k in keyof T]: NonNullable<T[k]> extends LinkType ? never : k;
  }[keyof T];

  export type linkKeys<T> = {
    [k in keyof T]: NonNullable<T[k]> extends LinkType ? k : never;
  }[keyof T];

  export type Props<T> = Pick<T, propertyKeys<T>>;
  export type Links<T> = Pick<T, linkKeys<T>>;
}
`
    ]);
};
exports.generateInterfaces = generateInterfaces;
